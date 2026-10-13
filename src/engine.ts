// Shared typed data model + deterministic engine (mirrors backend/engine.py). All data is SIMULATED.
export type Project={id:string;name:string;cat:string;pm:string;start:string;end:string;pct:number;budget:number;spent:number;delay:number;prob:number;impact:number;crit:number;res:string;risk:string;mit:string};
export type Edge=[string,string,number];export type DB={projects:Project[];edges:Edge[];log:string[]};
export type Scenario={pid:string;days:number;bud:number;staff:number;sev:number};
export const clamp=(x:number,a=0,b=100)=>Math.max(a,Math.min(b,x));export const f1=(x:number)=>(Math.round(x*10)/10).toFixed(1);export const M=(x:number)=>'$'+x.toFixed(1)+'M';
const R:any[][]=[['P1','Vehicle Procurement','Vehicles','Capt. R. Menon','2026-01-10','2026-11-30',72,12.4,9.8,24,3,5,5,'Fleet Mgmt, Vendor Liaison','Vendor delivery slippage','Open'],
['P2','Fire Station Deployment','Infrastructure','A. Rahman','2026-02-01','2026-12-15',85,18.6,14.9,14,3,4,4,'Civil crew, Apparatus bays','Station readiness blocked by apparatus availability','In progress'],
['P3','Driver & Crew Training','Training','S. Iyer','2026-03-01','2026-12-20',90,3.2,2.7,8,2,3,4,'Instructors, Simulators','Training window compression','Planned'],
['P4','Equipment Acquisition','Equipment','K. Das','2026-01-20','2026-10-31',95,6.8,6.4,0,2,4,4,'Procurement, Logistics','Specialized equipment supply constraint','In progress'],
['P5','Communications Infrastructure','Infrastructure','N. Fernandes','2026-02-15','2026-11-10',94,4.5,4.1,0,2,4,4,'Radio engineers','Integration testing overrun','In progress'],
['P6','Resource Allocation','Resources','L. Chen','2026-04-01','2026-12-31',92,2.1,1.8,4,2,3,3,'Planners, Roster system','Shift roster conflict','Planned'],
['P7','Emergency Coverage','Coverage','Chief D. Okafor','2026-03-15','2027-01-31',88,5.5,4.4,0,2,5,5,'District commanders','Coverage gap in northern district','Open'],
['P8','Disaster Preparedness','Preparedness','M. Alvarez','2026-05-01','2027-02-28',96,2.8,2.5,0,1,3,3,'Planning cell','Plan validation backlog','Planned']];
const K=['id','name','cat','pm','start','end','pct','budget','spent','delay','prob','impact','crit','res','risk','mit'];
export const SEED:Project[]=R.map(r=>Object.fromEntries(r.map((v,i)=>[K[i],v])) as Project);
export const EDGES:Edge[]=[['P1','P2',.8],['P2','P3',.7],['P3','P6',.6],['P6','P7',.75],['P4','P2',.5],['P4','P3',.35],['P5','P7',.5],['P1','P6',.3],['P5','P8',.5],['P7','P8',.4]];
export const seedDB=():DB=>({projects:JSON.parse(JSON.stringify(SEED)),edges:JSON.parse(JSON.stringify(EDGES)),log:['Demo portfolio loaded (simulated data)']});
export const W=[.2,.15,.15,.15,.15,.2],FN=['Infrastructure readiness','Equipment readiness','Personnel availability','Training readiness','Dependency health','Risk exposure (inverted)'];
export const STR:any={A:{n:'Option A — Reallocate Existing Vehicles',rootF:1,downF:.6,cost:.01,pen:3,staffMit:0,as:'Downstream propagation −40% by lending lower-priority vehicles; 3-pt coverage trade-off; cost 1% of root budget.'},
B:{n:'Option B — Prioritize Critical Procurement',rootF:.55,downF:1,cost:.06,pen:.5,staffMit:0,as:'Expedite fees cut root delay 45%; cost 6% of root budget; feasibility falls as budget is cut.'},
C:{n:'Option C — Reschedule Non-Critical Training',rootF:1,downF:.85,cost:.005,pen:2.5,staffMit:.5,as:'Frees staff (halves staff-cut effect), downstream −15%; 2.5-pt training penalty; cost 0.5%.'}};
function reach(id:string,E:Edge[],fw:boolean){const s=new Set<string>(),q=[id];while(q.length){const x=q.pop()!;for(const [a,b] of E){const [f,t]=fw?[a,b]:[b,a];if(f===x&&!s.has(t)&&t!==id){s.add(t);q.push(t)}}}return s}
export const down=(id:string,E:Edge[])=>reach(id,E,true),up=(id:string,E:Edge[])=>reach(id,E,false);
export function topo(E:Edge[],P:Project[]){const ind:any={},o:string[]=[];P.forEach(p=>ind[p.id]=0);E.forEach(e=>ind[e[1]]++);const q=P.filter(p=>!ind[p.id]).map(p=>p.id);while(q.length){const x=q.shift()!;o.push(x);E.forEach(e=>{if(e[0]===x&&--ind[e[1]]===0)q.push(e[1])})}P.forEach(p=>{if(!o.includes(p.id))o.push(p.id)});return o}
export const hasCycle=(E:Edge[],P:Project[])=>{const ind:any={};P.forEach(p=>ind[p.id]=0);E.forEach(e=>ind[e[1]]++);const q=P.filter(p=>!ind[p.id]).map(p=>p.id);let n=0;while(q.length){const x=q.shift()!;n++;E.forEach(e=>{if(e[0]===x&&--ind[e[1]]===0)q.push(e[1])})}return n<P.length};
export const effP=(p:Project)=>Math.min(5,p.prob+p.delay/60),dfac=(p:Project,E:Edge[])=>Math.min(1.5,1+.1*down(p.id,E).size);
export const rs=(p:Project,E:Edge[])=>clamp(effP(p)*p.impact*dfac(p,E)/37.5*100);
export const lvl=(s:number)=>s>=60?'Critical':s>=40?'High':s>=20?'Medium':'Low';
export const lc=(l:string)=>({Critical:'rgb(var(--danger))',High:'rgb(var(--amber))',Medium:'rgb(var(--cy))',Low:'rgb(var(--ok))'} as any)[l];
export const rd=(p:Project)=>p.pct*(1-Math.min(.7,p.delay/60));
export const stat=(p:Project)=>p.pct>=100?'Complete':p.delay>=15?'Delayed':p.delay>0?'At Risk':'On Track';
export function propagate(E:Edge[],P:Project[],root:string,d:number,f=1){const add:any={[root]:d},par:any={};for(const v of topo(E,P)){if(v===root)continue;let b=0;for(const [a,t,s] of E)if(t===v&&add[a]>0){const x=add[a]*s*f;if(x>b){b=x;par[v]=a}}if(b>.01)add[v]=b}
const dep=(id:string):number=>par[id]?1+dep(par[id]):0;const ord=[root,...Object.keys(add).filter(k=>k!==root).sort((a,b)=>dep(a)-dep(b)||add[b]-add[a])];const path:string[]=[];for(let x=ord[ord.length-1];x;x=par[x])path.unshift(x);return {add,par,ord,path}}
export function ors(P:Project[],E:Edge[],o:any={}){const g=(c:string[])=>{const a=P.filter(p=>c.includes(p.cat));return a.length?a.reduce((s,p)=>s+rd(p),0)/a.length:100},B:any=Object.fromEntries(P.map(p=>[p.id,p]));
const dep=E.length?100*(1-E.reduce((s,[a,b,w])=>s+w*Math.min(1,(B[a]?.delay||0)/60),0)/E.length):100,tw=P.reduce((s,p)=>s+p.crit,0)||1,risk=100-P.reduce((s,p)=>s+rs(p,E)*p.crit,0)/tw;
const v=[g(['Infrastructure','Coverage']),g(['Vehicles','Equipment']),g(['Resources'])*(1-(o.staff||0)/100)+(o.pb||0),g(['Training','Preparedness'])+(o.tb||0),dep,risk].map(x=>clamp(x));
return {score:clamp(v.reduce((s,x,i)=>s+x*W[i],0)-(o.pen||0)),v}}
export function sim(db:DB,sc:Scenario,key:string){const P=db.projects,E=db.edges,root=P.find(p=>p.id===sc.pid)!,st=STR[key]||{rootF:1,downF:1,cost:0,pen:0,staffMit:0};
const days=(sc.days+sc.bud*.5)*sc.sev,pr=propagate(E,P,sc.pid,days*st.rootF,st.downF),proj=P.map(p=>({...p,delay:p.delay+(pr.add[p.id]||0)})),o=ors(proj,E,{staff:sc.staff*(1-st.staffMit),pen:st.pen});
const exp=proj.reduce((a,p)=>a+p.budget*.0015*(pr.add[p.id]||0),0)+root.budget*sc.bud/100+root.budget*st.cost;
return {key,root:sc.pid,pr,proj,ors:o,exp,cost:root.budget*st.cost,total:Object.values<number>(pr.add).reduce((a,b)=>a+b,0),ord:pr.ord,crit:E.filter(([a,b,s])=>s>=.6&&pr.add[a]>0&&pr.add[b]>0)} as any}
export function compare(db:DB,sc:Scenario){const base=ors(db.projects,db.edges),root=db.projects.find(p=>p.id===sc.pid)!,R:any={N:sim(db,sc,'N')};['A','B','C'].forEach(k=>R[k]=sim(db,sc,k));
const feas:any={A:['Vehicles','Equipment'].includes(root.cat)?.8:.5,B:clamp(.75-sc.bud*.012,.1,1),C:clamp(.6+sc.staff/200,0,1)},mx=Math.max(.01,...['A','B','C'].map(k=>R[k].ors.score-R.N.ors.score)),mc=Math.max(.01,...['A','B','C'].map(k=>R[k].cost));
['A','B','C'].forEach(k=>{const g=R[k].ors.score-R.N.ors.score,rec=R.N.total?(R.N.total-R[k].total)/R.N.total:0;R[k].parts={gain:.4*clamp(g/mx,0,1),rec:.2*clamp(rec,0,1),cost:.2*(1-R[k].cost/mc),feas:.2*feas[k]};R[k].score=100*(R[k].parts.gain+R[k].parts.rec+R[k].parts.cost+R[k].parts.feas);R[k].feas=feas[k];R[k].gain=g});
return {base,R,best:['A','B','C'].sort((a,b)=>R[b].score-R[a].score)}}
export function impact(db:DB,id:string){const pr=propagate(db.edges,db.projects,id,30),B:any=Object.fromEntries(db.projects.map(p=>[p.id,p]));return {days:Object.entries<number>(pr.add).filter(([k])=>k!==id).reduce((s,[,v])=>s+v,0),cost:Object.entries<number>(pr.add).reduce((s,[k,v])=>s+(B[k]?.budget||0)*.0015*v,0)}}
export function recs(db:DB){const P=db.projects,E=db.edges,base=ors(P,E),tgt=[...P].sort((a,b)=>b.delay*b.crit-a.delay*a.crit)[0],ds=down(tgt.id,E),cl=()=>JSON.parse(JSON.stringify(P)) as Project[];
const eq=[...P].filter(p=>p.cat==='Equipment').sort((a,b)=>b.delay-a.delay)[0]||tgt,tr=P.find(p=>p.cat==='Training')||tgt,hi=[...P].sort((a,b)=>rs(b,E)-rs(a,E))[0];
const m=(fn:(c:Project[])=>void)=>{const c=cl();fn(c);return c};
const C:any[]=[{t:'Expedite critical '+tgt.name,why:`${tgt.name} has the highest delay × criticality (${tgt.delay} d late, criticality ${tgt.crit}/5).`,aff:[tgt.id,...ds],P:m(c=>c.forEach(p=>{if(p.id===tgt.id)p.delay*=.5;else if(ds.has(p.id))p.delay*=.8})),o:{},cost:tgt.budget*.06,sch:-tgt.delay*.5,tr:'Expedite fees; vendor premium.',f:.7,tg:tgt},
{t:'Reallocate available vehicles',why:'Lend lower-priority apparatus to protect downstream stations.',aff:[...ds],P:m(c=>c.forEach(p=>{if(ds.has(p.id))p.delay*=.7})),o:{pen:3},cost:tgt.budget*.01,sch:-3,tr:'Reduced coverage in lower-priority districts.',f:.8,tg:tgt},
{t:`Resolve critical equipment dependency (${eq.name})`,why:'Clears an upstream constraint feeding station and training work.',aff:[eq.id,...down(eq.id,E)],P:m(c=>c.forEach(p=>{if(p.id===eq.id)p.delay=0})),o:{},cost:eq.budget*.03,sch:-eq.delay,tr:'Requires logistics priority.',f:.75,tg:eq},
{t:'Reschedule non-critical activity',why:'Frees staff for critical readiness work.',aff:P.filter(p=>p.crit<=3).map(p=>p.id),P:cl(),o:{pb:8,pen:2},cost:.05,sch:5,tr:'Deferred non-critical work; slight training penalty.',f:.85,tg:P.find(p=>p.crit<=3)||tgt},
{t:'Increase crew-training availability',why:'Adds instructor capacity for '+tr.name+'.',aff:[tr.id],P:cl(),o:{tb:10},cost:tr.budget*.1,sch:-2,tr:'Overtime and instructor costs.',f:.65,tg:tr},
{t:`Escalate ${hi.name} to leadership`,why:`Highest risk score (${f1(rs(hi,E))}); needs an authorized sponsor decision.`,aff:[hi.id,...down(hi.id,E)],P:m(c=>{const p=c.find(x=>x.id===hi.id)!;p.prob=Math.max(1,p.prob-1)}),o:{},cost:0,sch:0,tr:'Leadership attention; no direct cost.',f:.9,tg:hi}];
C.forEach(c=>{const o=ors(c.P,E,c.o);c.gain=o.score-base.score;c.rr=o.v[5]-base.v[5]});const mg=Math.max(.01,...C.map(c=>c.gain)),mr=Math.max(.01,...C.map(c=>c.rr)),mc=Math.max(.01,...C.map(c=>c.cost));
C.forEach(c=>c.score=100*(.3*clamp(c.gain/mg,0,1)+.15*c.tg.crit/5+.15*clamp(c.tg.delay/45,0,1)+.15*clamp(c.rr/mr,0,1)+.1*(1-c.cost/mc)+.15*c.f));return C.sort((a,b)=>b.score-a.score)}
