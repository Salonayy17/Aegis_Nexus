import {createContext,useCallback,useContext,useEffect,useMemo,useState,ReactNode} from 'react';
import {Sun,Moon} from 'lucide-react';

export type Theme='dark'|'light';
const KEY='aegis-theme';
const META:Record<Theme,string>={dark:'#0A0A0A',light:'#F5F6F8'};

/* The inline script in index.html has already set data-theme before first paint; read it back here
   so React state starts in sync (default: dark). */
const read=():Theme=>{try{const a=document.documentElement.getAttribute('data-theme');if(a==='light'||a==='dark')return a;return localStorage.getItem(KEY)==='light'?'light':'dark'}catch{return'dark'}};

const Ctx=createContext<{theme:Theme,setTheme:(t:Theme)=>void,toggle:()=>void}>({theme:'dark',setTheme:()=>{},toggle:()=>{}});
export const useTheme=()=>useContext(Ctx);

export function ThemeProvider({children}:{children:ReactNode}){
 const [theme,setT]=useState<Theme>(read);
 const apply=useCallback((t:Theme,animate:boolean)=>{
  const el=document.documentElement;
  if(animate){el.classList.add('theme-anim');window.setTimeout(()=>el.classList.remove('theme-anim'),320)}
  el.setAttribute('data-theme',t);
  document.querySelector('meta[name=theme-color]')?.setAttribute('content',META[t]);
 },[]);
 const setTheme=useCallback((t:Theme)=>{apply(t,true);setT(t);try{localStorage.setItem(KEY,t)}catch{}},[apply]);
 const toggle=useCallback(()=>setTheme(read()==='dark'?'light':'dark'),[setTheme]);
 // keep several open tabs in sync
 useEffect(()=>{const f=(e:StorageEvent)=>{if(e.key===KEY){const t:Theme=e.newValue==='light'?'light':'dark';apply(t,false);setT(t)}};addEventListener('storage',f);return()=>removeEventListener('storage',f)},[apply]);
 const v=useMemo(()=>({theme,setTheme,toggle}),[theme,setTheme,toggle]);
 return <Ctx.Provider value={v}>{children}</Ctx.Provider>}

/* Sliding sun / moon switch. A native button, so Space/Enter work and focus ring is visible. */
export function ThemeToggle({className=''}:{className?:string}){
 const {theme,toggle}=useTheme(),light=theme==='light';
 return <button type="button" role="switch" aria-checked={light} aria-label={light?'Light mode on. Switch to dark mode':'Dark mode on. Switch to light mode'} title={light?'Switch to dark mode':'Switch to light mode'} onClick={toggle}
  className={`relative inline-flex h-8 w-[60px] shrink-0 items-center rounded-full border border-bd bg-p2 p-0.5 transition-colors hover:border-bd2 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/70 ${className}`}>
  <span aria-hidden className={`absolute left-0.5 top-0.5 h-6 w-[28px] rounded-full border border-bd bg-pn shadow-sm transition-transform duration-300 ease-out ${light?'':'translate-x-[28px]'}`}/>
  <span aria-hidden className={`relative z-10 flex h-6 w-[28px] items-center justify-center transition-colors ${light?'text-amber':'text-mute'}`}><Sun size={14}/></span>
  <span aria-hidden className={`relative z-10 flex h-6 w-[28px] items-center justify-center transition-colors ${light?'text-mute':'text-amber'}`}><Moon size={14}/></span>
 </button>}
