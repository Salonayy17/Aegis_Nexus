"""AEGIS NEXUS engine: deterministic, explainable risk / propagation / readiness / simulation / ranking.
All data is SIMULATED demonstration data. Mirrors the JavaScript engine in frontend/index.html."""
import copy
import networkx as nx

def P_(i,n,c,pm,s,e,pct,b,sp,d,pr,im,cr,res,risk,mit):
    return dict(id=i,name=n,cat=c,pm=pm,start=s,end=e,pct=pct,budget=b,spent=sp,delay=d,prob=pr,impact=im,crit=cr,res=res,risk=risk,mit=mit)
SEED=[
P_('P1','Vehicle Procurement','Vehicles','Capt. R. Menon','2026-01-10','2026-11-30',72,12.4,9.8,24,3,5,5,'Fleet Mgmt, Vendor Liaison','Vendor delivery slippage','Open'),
P_('P2','Fire Station Deployment','Infrastructure','A. Rahman','2026-02-01','2026-12-15',85,18.6,14.9,14,3,4,4,'Civil crew, Apparatus bays','Station readiness blocked by apparatus availability','In progress'),
P_('P3','Driver & Crew Training','Training','S. Iyer','2026-03-01','2026-12-20',90,3.2,2.7,8,2,3,4,'Instructors, Simulators','Training window compression','Planned'),
P_('P4','Equipment Acquisition','Equipment','K. Das','2026-01-20','2026-10-31',95,6.8,6.4,0,2,4,4,'Procurement, Logistics','Specialized equipment supply constraint','In progress'),
P_('P5','Communications Infrastructure','Infrastructure','N. Fernandes','2026-02-15','2026-11-10',94,4.5,4.1,0,2,4,4,'Radio engineers','Integration testing overrun','In progress'),
P_('P6','Resource Allocation','Resources','L. Chen','2026-04-01','2026-12-31',92,2.1,1.8,4,2,3,3,'Planners, Roster system','Shift roster conflict','Planned'),
P_('P7','Emergency Coverage','Coverage','Chief D. Okafor','2026-03-15','2027-01-31',88,5.5,4.4,0,2,5,5,'District commanders','Coverage gap in northern district','Open'),
P_('P8','Disaster Preparedness','Preparedness','M. Alvarez','2026-05-01','2027-02-28',96,2.8,2.5,0,1,3,3,'Planning cell','Plan validation backlog','Planned')]
EDGES=[['P1','P2',.8],['P2','P3',.7],['P3','P6',.6],['P6','P7',.75],['P4','P2',.5],['P4','P3',.35],['P5','P7',.5],['P1','P6',.3],['P5','P8',.5],['P7','P8',.4]]
W=[.2,.15,.15,.15,.15,.2]
FACTORS=['Infrastructure readiness','Equipment readiness','Personnel availability','Training readiness','Dependency health','Risk exposure (inverted)']
STR={'N':dict(n='Do nothing',rootF=1,downF=1,cost=0,pen=0,staffMit=0),
'A':dict(n='Option A - Reallocate Existing Vehicles',rootF=1,downF=.6,cost=.01,pen=3,staffMit=0),
'B':dict(n='Option B - Prioritize Critical Procurement',rootF=.55,downF=1,cost=.06,pen=.5,staffMit=0),
'C':dict(n='Option C - Reschedule Non-Critical Training',rootF=1,downF=.85,cost=.005,pen=2.5,staffMit=.5)}

clamp=lambda x,a=0,b=100:max(a,min(b,x))
def graph(P,E):
    G=nx.DiGraph();G.add_nodes_from(p['id'] for p in P)
    ids={p['id'] for p in P}
    G.add_weighted_edges_from([(a,b,w) for a,b,w in E if a in ids and b in ids]);return G
def has_cycle(P,E): return not nx.is_directed_acyclic_graph(graph(P,E))
def eff_p(p): return min(5,p['prob']+p['delay']/60)
def dfac(G,i): return min(1.5,1+.1*len(nx.descendants(G,i)))
def risk_score(p,G): return clamp(eff_p(p)*p['impact']*dfac(G,p['id'])/37.5*100)   # Probability x Impact x DependencyFactor, normalised
def level(s): return 'Critical' if s>=60 else 'High' if s>=40 else 'Medium' if s>=20 else 'Low'
def readiness_of(p): return p['pct']*(1-min(.7,p['delay']/60))
def status(p): return 'Complete' if p['pct']>=100 else 'Delayed' if p['delay']>=15 else 'At Risk' if p['delay']>0 else 'On Track'

def propagate(G,root,d,f=1.0):
    """add(v)=max over parents u of add(u)*strength(u,v), topological order (max => no double counting; DAG enforced)."""
    add={root:d};par={}
    for v in nx.topological_sort(G):
        if v==root: continue
        best=0
        for u in G.predecessors(v):
            if add.get(u,0)>0:
                x=add[u]*G[u][v]['weight']*f
                if x>best: best,par[v]=x,u
        if best>.01: add[v]=best
    depth=lambda i:1+depth(par[i]) if i in par else 0
    order=[root]+sorted([k for k in add if k!=root],key=lambda k:(depth(k),-add[k]))
    path=[];x=order[-1]
    while x: path.insert(0,x);x=par.get(x)
    return dict(add=add,par=par,order=order,path=path)

def ors(P,E,staff=0,pen=0,pb=0,tb=0):
    G=graph(P,E);B={p['id']:p for p in P}
    def g(c):
        a=[readiness_of(p) for p in P if p['cat'] in c];return sum(a)/len(a) if a else 100
    dep=100*(1-sum(w*min(1,B[a]['delay']/60) for a,b,w in E if a in B)/len(E)) if E else 100
    tw=sum(p['crit'] for p in P) or 1
    risk=100-sum(risk_score(p,G)*p['crit'] for p in P)/tw   # risk exposure inverted
    v=[clamp(x) for x in [g(['Infrastructure','Coverage']),g(['Vehicles','Equipment']),g(['Resources'])*(1-staff/100)+pb,g(['Training','Preparedness'])+tb,dep,risk]]
    return dict(score=clamp(sum(x*w for x,w in zip(v,W))-pen),factors=v)

def simulate(P,E,sc,key='N'):
    st=STR[key];root=next(p for p in P if p['id']==sc['pid']);G=graph(P,E)
    days=(sc['days']+sc['bud']*.5)*sc['sev']
    pr=propagate(G,sc['pid'],days*st['rootF'],st['downF'])
    proj=[{**p,'delay':p['delay']+pr['add'].get(p['id'],0)} for p in P]
    o=ors(proj,E,staff=sc['staff']*(1-st['staffMit']),pen=st['pen'])
    exp=sum(p['budget']*.0015*pr['add'].get(p['id'],0) for p in P)+root['budget']*(sc['bud']/100+st['cost'])
    return dict(strategy=key,name=st['n'],added_delay=pr['add'],order=pr['order'],critical_path=pr['path'],parents=pr['par'],
        total_delay=sum(pr['add'].values()),readiness=o,budget_exposure=exp,mitigation_cost=root['budget']*st['cost'],
        critical_dependencies=[e for e in E if e[2]>=.6 and pr['add'].get(e[0],0)>0 and pr['add'].get(e[1],0)>0],
        risk_after={p['id']:risk_score(p,graph(proj,E)) for p in proj},
        assumptions=dict(effective_delay_days=days,formula='(days + 0.5*budget_cut%) * severity',strategy=st))

def compare(P,E,sc):
    base=ors(P,E);R={k:simulate(P,E,sc,k) for k in 'NABC'};root=next(p for p in P if p['id']==sc['pid'])
    feas={'A':.8 if root['cat'] in('Vehicles','Equipment') else .5,'B':clamp(.75-sc['bud']*.012,.1,1),'C':clamp(.6+sc['staff']/200,0,1)}
    mx=max(.01,*[R[k]['readiness']['score']-R['N']['readiness']['score'] for k in 'ABC']);mc=max(.01,*[R[k]['mitigation_cost'] for k in 'ABC'])
    for k in 'ABC':
        g=R[k]['readiness']['score']-R['N']['readiness']['score'];rec=(R['N']['total_delay']-R[k]['total_delay'])/R['N']['total_delay'] if R['N']['total_delay'] else 0
        R[k].update(gain=g,feasibility=feas[k],decision_score=100*(.4*clamp(g/mx,0,1)+.2*clamp(rec,0,1)+.2*(1-R[k]['mitigation_cost']/mc)+.2*feas[k]))
    best=sorted('ABC',key=lambda k:-R[k]['decision_score'])
    return dict(baseline=base,results=R,ranking=best,recommended=best[0],
        weights='40% readiness gain, 20% delay recovery, 20% cost efficiency, 20% feasibility')

def recommendations(P,E):
    base=ors(P,E);G=graph(P,E)
    tgt=max(P,key=lambda p:p['delay']*p['crit']);ds=nx.descendants(G,tgt['id'])
    eq=max([p for p in P if p['cat']=='Equipment'] or [tgt],key=lambda p:p['delay'])
    tr=next((p for p in P if p['cat']=='Training'),tgt);hi=max(P,key=lambda p:risk_score(p,G))
    def mod(fn):
        c=copy.deepcopy(P);fn(c);return c
    def sc(c,i,k,f): 
        for p in c:
            if p['id']==i:p[k]=f(p[k])
    C=[dict(t='Expedite critical '+tgt['name'],why=f"Highest delay x criticality ({tgt['delay']} d late, criticality {tgt['crit']}/5).",aff=[tgt['id'],*ds],
        P=mod(lambda c:[p.update(delay=p['delay']*(.5 if p['id']==tgt['id'] else .8)) for p in c if p['id']==tgt['id'] or p['id'] in ds]),o={},cost=tgt['budget']*.06,sch=-tgt['delay']*.5,tr='Expedite fees; vendor premium.',f=.7,tg=tgt),
       dict(t='Reallocate available vehicles',why='Lend lower-priority apparatus to protect downstream stations.',aff=list(ds),
        P=mod(lambda c:[p.update(delay=p['delay']*.7) for p in c if p['id'] in ds]),o=dict(pen=3),cost=tgt['budget']*.01,sch=-3,tr='Reduced coverage in lower-priority districts.',f=.8,tg=tgt),
       dict(t=f"Resolve critical equipment dependency ({eq['name']})",why='Clears an upstream constraint feeding station and training work.',aff=[eq['id'],*nx.descendants(G,eq['id'])],
        P=mod(lambda c:sc(c,eq['id'],'delay',lambda _:0)),o={},cost=eq['budget']*.03,sch=-eq['delay'],tr='Requires logistics priority.',f=.75,tg=eq),
       dict(t='Reschedule non-critical activity',why='Frees staff for critical readiness work.',aff=[p['id'] for p in P if p['crit']<=3],P=copy.deepcopy(P),o=dict(pb=8,pen=2),
        cost=.05,sch=5,tr='Deferred non-critical work; slight training penalty.',f=.85,tg=next((p for p in P if p['crit']<=3),tgt)),
       dict(t='Increase crew-training availability',why='Adds instructor capacity for '+tr['name']+'.',aff=[tr['id']],P=copy.deepcopy(P),o=dict(tb=10),cost=tr['budget']*.1,sch=-2,tr='Overtime and instructor costs.',f=.65,tg=tr),
       dict(t=f"Escalate {hi['name']} to leadership",why=f"Highest risk score ({risk_score(hi,G):.1f}); needs authorized sponsor decision.",aff=[hi['id'],*nx.descendants(G,hi['id'])],
        P=mod(lambda c:sc(c,hi['id'],'prob',lambda x:max(1,x-1))),o={},cost=0,sch=0,tr='Leadership attention; no direct cost.',f=.9,tg=hi)]
    for c in C:
        o=ors(c['P'],E,**c['o']);c['gain']=o['score']-base['score'];c['rr']=o['factors'][5]-base['factors'][5]
    mg=max(.01,*[c['gain'] for c in C]);mr=max(.01,*[c['rr'] for c in C]);mc=max(.01,*[c['cost'] for c in C])
    out=[]
    for c in C:
        s=100*(.3*clamp(c['gain']/mg,0,1)+.15*c['tg']['crit']/5+.15*clamp(c['tg']['delay']/45,0,1)+.15*clamp(c['rr']/mr,0,1)+.1*(1-c['cost']/mc)+.15*c['f'])
        out.append(dict(action=c['t'],reason=c['why'],affected=c['aff'],readiness_improvement=c['gain'],schedule_impact_days=c['sch'],estimated_cost_musd=c['cost'],
            trade_offs=c['tr'],evidence='Simulated demo data; rule-of-thumb parameters.',score=s,requires_human_approval=True))
    out.sort(key=lambda r:-r['score'])
    for i,r in enumerate(out,1): r['priority']=i
    return dict(method='Transparent rules-based decision support (no ML). Weights: 30% readiness gain, 15% criticality, 15% urgency, 15% risk reduction, 10% cost, 15% feasibility.',recommendations=out)
