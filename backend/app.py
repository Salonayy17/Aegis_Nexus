"""AEGIS NEXUS Flask API. Run: python app.py  ->  http://localhost:5000 (also serves ../frontend)."""
import copy, os, json, sqlite3
from flask import Flask, jsonify, request, send_from_directory
import engine as en

app=Flask(__name__,static_folder=os.path.join(os.path.dirname(__file__),'..','frontend'),static_url_path='')
STATE=dict(projects=copy.deepcopy(en.SEED),edges=copy.deepcopy(en.EDGES))
DB=os.path.join(os.path.dirname(__file__),'aegis.db')
def _db():
    c=sqlite3.connect(DB);c.execute('create table if not exists state(k text primary key, v text)');return c
def persist():
    with _db() as c: c.execute('insert or replace into state values(?,?)',('portfolio',json.dumps(STATE)))
def restore():
    with _db() as c:
        r=c.execute("select v from state where k='portfolio'").fetchone()
        if r: STATE.update(json.loads(r[0]))
restore()
@app.after_request
def _save(r):
    if request.method in('POST','PUT','DELETE') and request.path!='/api/simulate' and request.path!='/api/recommendations' and r.status_code<300: persist()
    return r
err=lambda m,c=400:(jsonify(error=m),c)
NUM=dict(pct=(0,100),budget=(.01,1e6),spent=(0,1e6),delay=(0,1e4),prob=(1,5),impact=(1,5),crit=(1,5))

def validate(d,partial=False):
    e=[]
    for k,(lo,hi) in NUM.items():
        if k in d:
            try:
                d[k]=float(d[k])
                if not lo<=d[k]<=hi:e.append(f'{k} must be between {lo} and {hi}')
            except (TypeError,ValueError):e.append(f'{k} must be a number')
        elif not partial and k in('budget',):e.append(f'{k} is required')
    if not partial and not str(d.get('name','')).strip():e.append('name is required')
    return e
def find(i): return next((p for p in STATE['projects'] if p['id']==i),None)
def set_deps(pid,deps,P,E):
    E2=[e for e in E if e[1]!=pid]+[[d,pid,next((e[2] for e in E if e[0]==d and e[1]==pid),.5)] for d in deps if d!=pid and any(p['id']==d for p in P)]
    return E2

@app.get('/')
def index(): return send_from_directory(app.static_folder,'index.html')
@app.get('/api/health')
def health(): return jsonify(status='ok',data='SIMULATED demonstration data',projects=len(STATE['projects']))
@app.get('/api/projects')
def projects():
    G=en.graph(STATE['projects'],STATE['edges'])
    return jsonify([{**p,'status':en.status(p),'risk_score':en.risk_score(p,G),'risk_level':en.level(en.risk_score(p,G)),
        'depends_on':[e[0] for e in STATE['edges'] if e[1]==p['id']]} for p in STATE['projects']])
@app.get('/api/projects/<i>')
def project(i):
    p=find(i);return jsonify(p) if p else err('project not found',404)
@app.post('/api/projects')
def create():
    d=request.get_json(silent=True) or {};e=validate(d)
    if e:return err('; '.join(e),422)
    n=max([int(p['id'][1:]) for p in STATE['projects']]+[0])+1
    p={**dict(cat='Equipment',pm='',start='2026-10-01',end='2027-03-31',pct=0,spent=0,delay=0,prob=2,impact=3,crit=3,res='',risk='New project risk',mit='Open'),**{k:v for k,v in d.items() if k!='depends_on'},'id':f'P{n}'}
    P2=STATE['projects']+[p];E2=set_deps(p['id'],d.get('depends_on',[]),P2,STATE['edges'])
    if en.has_cycle(P2,E2):return err('dependencies would create a cycle',422)
    STATE.update(projects=P2,edges=E2);return jsonify(p),201
@app.put('/api/projects/<i>')
def update(i):
    p=find(i)
    if not p:return err('project not found',404)
    d=request.get_json(silent=True) or {};e=validate(d,True)
    if e:return err('; '.join(e),422)
    P2=[{**q,**{k:v for k,v in d.items() if k not in('id','depends_on')}} if q['id']==i else q for q in STATE['projects']]
    E2=set_deps(i,d['depends_on'],P2,STATE['edges']) if 'depends_on' in d else STATE['edges']
    if en.has_cycle(P2,E2):return err('dependencies would create a cycle',422)
    STATE.update(projects=P2,edges=E2);return jsonify(find(i))
@app.delete('/api/projects/<i>')
def delete(i):
    if not find(i):return err('project not found',404)
    STATE['projects']=[p for p in STATE['projects'] if p['id']!=i];STATE['edges']=[e for e in STATE['edges'] if i not in e[:2]];return '',204
@app.get('/api/risks')
def risks():
    G=en.graph(STATE['projects'],STATE['edges'])
    r=[dict(title=p['risk'],project=p['name'],project_id=p['id'],probability=p['prob'],effective_probability=en.eff_p(p),impact=p['impact'],dependency_factor=en.dfac(G,p['id']),
        score=en.risk_score(p,G),level=en.level(en.risk_score(p,G)),mitigation_status=p['mit']) for p in STATE['projects']]
    return jsonify(formula='min(5,P+delay/60) x Impact x min(1.5,1+0.1*downstream) / 37.5 x 100 (a ranking index, not a calibrated probability)',risks=sorted(r,key=lambda x:-x['score']))
@app.get('/api/dependencies')
def deps():
    P,E=STATE['projects'],STATE['edges'];return jsonify(nodes=[p['id'] for p in P],edges=[dict(source=a,target=b,strength=w) for a,b,w in E],acyclic=not en.has_cycle(P,E))
@app.get('/api/readiness')
def readiness():
    P,E=STATE['projects'],STATE['edges'];o=en.ors(P,E)
    return jsonify(score=o['score'],factors=[dict(name=n,score=v,weight=w,contribution=v*w) for n,v,w in zip(en.FACTORS,o['factors'],en.W)],
        average_completion=sum(p['pct'] for p in P)/len(P),note='Prototype decision-support indicator, not a validated standard.')
@app.get('/api/dashboard')
def dashboard():
    P,E=STATE['projects'],STATE['edges'];G=en.graph(P,E);o=en.ors(P,E)
    return jsonify(label='DEMO DATA - simulated',active_projects=sum(p['pct']<100 for p in P),at_risk=sum(en.risk_score(p,G)>=40 for p in P),
        critical_dependencies=sum(e[2]>=.7 for e in E),readiness=o['score'],budget_at_risk=sum(p['budget']*.0015*p['delay'] for p in P),delayed=sum(p['delay']>0 for p in P))
@app.post('/api/simulate')
def simulate():
    d=request.get_json(silent=True) or {}
    sc=dict(pid=d.get('project_id','P1'),days=float(d.get('days',45)),bud=float(d.get('budget_cut',0)),staff=float(d.get('staff_cut',0)),sev=float(d.get('severity',1)))
    if not find(sc['pid']):return err('unknown project_id',404)
    if sc['days']<0 or not 0<=sc['bud']<=50 or not 0<=sc['staff']<=80:return err('days>=0, budget_cut 0-50, staff_cut 0-80',422)
    return jsonify(scenario=sc,**en.compare(STATE['projects'],STATE['edges'],sc))
@app.post('/api/recommendations')
def recs(): return jsonify(en.recommendations(STATE['projects'],STATE['edges']))
@app.post('/api/reset')
def reset():
    STATE.update(projects=copy.deepcopy(en.SEED),edges=copy.deepcopy(en.EDGES));return jsonify(status='reset')
if __name__=='__main__': app.run(debug=True,port=5000)
