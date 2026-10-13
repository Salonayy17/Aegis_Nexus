// Node-position persistence for the graph pages. Positions are purely visual: they are stored apart from the
// dependency data, keyed by stable node id, and never feed into any risk / cascade calculation.
export type Pos={x:number,y:number};
export type Layout=Record<string,Pos>;
/** Canvas boundary (flow coordinates). Default layout spans roughly x 0..905, y 0..390. */
export const EXTENT:[[number,number],[number,number]]=[[-400,-300],[1600,900]];
const SCOPE='default'; // the app has a single project; use the project id here if several are added
export const layoutKey=(page:string,scope=SCOPE)=>`aegis-layout-v1:${scope}:${page}`;
const ok=(p:any):p is Pos=>!!p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const clampPos=(p:Pos):Pos=>({x:Math.min(EXTENT[1][0],Math.max(EXTENT[0][0],p.x)),y:Math.min(EXTENT[1][1],Math.max(EXTENT[0][1],p.y))});

type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
const store=():Store|null=>{try{return localStorage}catch{return null}};

/** Load a saved layout; anything malformed is dropped rather than trusted. */
export function loadLayout(page:string,s:Store|null=store(),scope=SCOPE):Layout{
 try{const raw=s?.getItem(layoutKey(page,scope));if(!raw)return {};const j=JSON.parse(raw),src=j&&j.v===1&&j.pos?j.pos:{},out:Layout={};
  for(const id of Object.keys(src))if(ok(src[id]))out[id]=clampPos({x:src[id].x,y:src[id].y});return out}catch{return {}}}

/** Save, keeping only ids that still exist in the project (removed nodes can't corrupt the saved layout). */
export function saveLayout(page:string,layout:Layout,validIds:Set<string>,s:Store|null=store(),scope=SCOPE){
 try{const pos:Layout={};for(const id of Object.keys(layout))if(validIds.has(id)&&ok(layout[id]))pos[id]={x:Math.round(layout[id].x),y:Math.round(layout[id].y)};
  if(!s)return;if(Object.keys(pos).length)s.setItem(layoutKey(page,scope),JSON.stringify({v:1,pos}));else s.removeItem(layoutKey(page,scope))}catch{}}

/** Reset = drop the saved layout, so the default arrangement applies (and that reset persists). */
export const clearLayout=(page:string,s:Store|null=store(),scope=SCOPE)=>{try{s?.removeItem(layoutKey(page,scope))}catch{}};

/** Saved position if valid, else the default, else a tidy grid slot below the default area (for newly added nodes). */
export function placeNode(id:string,index:number,saved:Layout,defaults:Record<string,[number,number]>):Pos{
 if(ok(saved[id]))return saved[id];const d=defaults[id];if(d)return {x:d[0],y:d[1]};return {x:(index%4)*220,y:430+Math.floor(index/4)*110}}
