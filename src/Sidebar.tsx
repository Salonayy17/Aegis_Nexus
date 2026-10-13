import {useEffect,useLayoutEffect,useRef,useState,ComponentType} from 'react';
import {Shield,Play,X,PanelLeftClose,PanelLeftOpen} from 'lucide-react';

export type NavItem=readonly [key:string,label:string,Icon:ComponentType<any>];
const DESKTOP='(min-width:1024px)';
const useDesktop=()=>{const [m,setM]=useState(()=>typeof matchMedia!=='undefined'&&matchMedia(DESKTOP).matches);useEffect(()=>{const q=matchMedia(DESKTOP),f=()=>setM(q.matches);f();q.addEventListener('change',f);return()=>q.removeEventListener('change',f)},[]);return m};

type Tip={label:string,x:number,y:number}|null;
type P={items:readonly NavItem[],page:string,onNav:(k:string)=>void,onDemo:()=>void,collapsed:boolean,setCollapsed:(v:boolean)=>void,drawerOpen:boolean,setDrawerOpen:(v:boolean)=>void,drawerId:string};

export default function Sidebar(p:P){
 const desktop=useDesktop();
 // a drawer left open when the window grows into desktop width would be stuck open; close it
 useEffect(()=>{if(desktop&&p.drawerOpen)p.setDrawerOpen(false)},[desktop]); // eslint-disable-line
 if(desktop)return <Rail {...p}/>;
 return p.drawerOpen?<Drawer {...p}/>:null}

/* One navigation row. In compact mode only the icon is visible; the label shows as a tooltip on hover / keyboard focus. */
function Row({label,Icon,active,compact,onClick,onTip,demo}:{label:string,Icon:ComponentType<any>,active?:boolean,compact:boolean,onClick:()=>void,onTip:(t:Tip)=>void,demo?:boolean}){
 const show=(e:{currentTarget:HTMLElement})=>{if(!compact)return;const r=e.currentTarget.getBoundingClientRect();onTip({label,x:r.right+10,y:r.top+r.height/2})};
 return <button type="button" onClick={onClick} aria-label={compact?label:undefined} aria-current={active?'page':undefined}
  onMouseEnter={show} onMouseLeave={()=>onTip(null)} onFocus={e=>{if(e.currentTarget.matches(':focus-visible'))show(e)}} onBlur={()=>onTip(null)}
  className={`group relative flex h-10 w-full items-center rounded-md text-[13.5px] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/60 ${demo?`border text-[11.5px] font-semibold tracking-[.12em] ${active?'':'hover:bg-amber/10'} border-amber/30 bg-amber/5 text-amber`:active?'bg-amber/10 font-medium text-amber':'text-mute hover:bg-fg/5 hover:text-fg'}`}>
  {active&&!demo&&<span aria-hidden className="absolute -left-3 top-2 h-6 w-[3px] rounded-r bg-amber"/>}
  <span className={`flex shrink-0 justify-center ${demo?'w-[46px]':'w-12'}`}><Icon size={18} strokeWidth={active?2.1:1.8}/></span>
  <span aria-hidden={compact} className={`truncate whitespace-nowrap pr-3 transition-opacity duration-150 ${compact?'opacity-0':'opacity-100'}`}>{label}</span>
 </button>}

const Brand=({compact,onNav}:{compact:boolean,onNav?:()=>void})=><a href="#/" onClick={onNav} title="Back to landing page" aria-label="AEGIS NEXUS — back to landing page" className="flex h-full min-w-0 items-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/60">
 <span className="flex w-12 shrink-0 justify-center"><Shield size={20} className="text-amber"/></span>
 <span aria-hidden={compact} className={`whitespace-nowrap text-[12.5px] font-semibold tracking-[.2em] transition-opacity duration-150 ${compact?'opacity-0':'opacity-100'}`}>AEGIS NEXUS</span></a>;

const TipBubble=({t}:{t:Tip})=>t?<div role="tooltip" style={{left:t.x,top:t.y}} className="pointer-events-none fixed z-[70] -translate-y-1/2 whitespace-nowrap rounded-md border border-bd bg-pn px-2.5 py-1.5 text-xs font-medium text-fg shadow-lg">{t.label}</div>:null;

function Rail({items,page,onNav,onDemo,collapsed,setCollapsed}:P){
 const [tip,setTip]=useState<Tip>(null);
 useEffect(()=>setTip(null),[collapsed]);
 return <aside aria-label="Primary" className={`sticky top-0 z-20 flex h-screen shrink-0 flex-col border-r border-bd bg-sb transition-[width] duration-200 ease-out ${collapsed?'w-[72px]':'w-60'}`}>
  <div className="h-14 shrink-0 border-b border-bd px-3"><Brand compact={collapsed}/></div>
  <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-3">{items.map(([k,l,I])=><Row key={k} label={l} Icon={I} active={page===k} compact={collapsed} onClick={()=>onNav(k)} onTip={setTip}/>)}</nav>
  <div className="shrink-0 space-y-1 border-t border-bd px-3 py-3">
   <Row demo label="DEMO MODE" Icon={Play} compact={collapsed} onClick={onDemo} onTip={setTip}/>
   <button type="button" onClick={()=>setCollapsed(!collapsed)} aria-label={collapsed?'Expand sidebar':'Collapse sidebar'} aria-expanded={!collapsed}
    onMouseEnter={e=>{if(collapsed){const r=e.currentTarget.getBoundingClientRect();setTip({label:'Expand sidebar',x:r.right+10,y:r.top+r.height/2})}}} onMouseLeave={()=>setTip(null)}
    className="flex h-10 w-full items-center rounded-md text-[13px] text-mute transition-colors hover:bg-fg/5 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/60">
    <span className="flex w-12 shrink-0 justify-center">{collapsed?<PanelLeftOpen size={18}/>:<PanelLeftClose size={18}/>}</span>
    <span aria-hidden={collapsed} className={`whitespace-nowrap transition-opacity duration-150 ${collapsed?'opacity-0':'opacity-100'}`}>Collapse sidebar</span></button>
  </div>
  <TipBubble t={tip}/>
 </aside>}

function Drawer({items,page,onNav,onDemo,setDrawerOpen,drawerId}:P){
 const ref=useRef<HTMLElement>(null),close=()=>setDrawerOpen(false);
 // focus management: move focus in, trap Tab, close on Escape, lock page scroll, restore focus on close
 useLayoutEffect(()=>{
  const prev=document.activeElement as HTMLElement|null,ov=document.body.style.overflow;document.body.style.overflow='hidden';
  const f=()=>ref.current?.querySelectorAll<HTMLElement>('button,a[href]')||[] as any;
  (f()[0] as HTMLElement|undefined)?.focus();
  const k=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();close();return}
   if(e.key!=='Tab')return;const a=Array.from(f()) as HTMLElement[];if(!a.length)return;const first=a[0],last=a[a.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}};
  document.addEventListener('keydown',k);
  return()=>{document.removeEventListener('keydown',k);document.body.style.overflow=ov;prev?.focus?.()}},[]); // eslint-disable-line
 return <div className="fixed inset-0 z-[60]">
  <div className="scrim-in absolute inset-0 bg-scrim/50 backdrop-blur-[2px]" onClick={close} aria-hidden/>
  <aside ref={ref} id={drawerId} role="dialog" aria-modal="true" aria-label="Navigation menu" className="drawer-in absolute inset-y-0 left-0 flex w-[288px] max-w-[88vw] flex-col border-r border-bd bg-sb shadow-2xl">
   <div className="flex h-14 shrink-0 items-center justify-between border-b border-bd pl-3 pr-2"><Brand compact={false} onNav={close}/>
    <button type="button" onClick={close} aria-label="Close navigation menu" className="flex h-9 w-9 items-center justify-center rounded-md text-mute hover:bg-fg/5 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/60"><X size={18}/></button></div>
   <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-3">{items.map(([k,l,I])=><Row key={k} label={l} Icon={I} active={page===k} compact={false} onClick={()=>onNav(k)} onTip={()=>{}}/>)}</nav>
   <div className="shrink-0 border-t border-bd px-3 py-3"><Row demo label="DEMO MODE" Icon={Play} compact={false} onClick={onDemo} onTip={()=>{}}/></div>
  </aside></div>}
