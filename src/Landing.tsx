import {useEffect,useState} from 'react';
import {Network,FlaskConical,Scale,ArrowRight} from 'lucide-react';import {ThemeToggle} from './theme';
const AMBER='rgb(var(--amber))';
const go=(id:string)=>{const el=document.getElementById(id);if(el)el.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})};
const NAV=[['Platform','platform'],['Capabilities','capabilities'],['About','about']];
const CAP=[[Network,'Cascade Intelligence','Understand how connected activities influence one another.'],[FlaskConical,'Scenario Simulation','Explore the possible consequences of operational disruptions.'],[Scale,'Mitigation Strategy','Compare potential responses using transparent scoring and practical trade-offs.']] as const;
const Label=({n,t}:any)=><div className="mb-6 flex items-center gap-3 text-[11px] uppercase tracking-[.24em] text-faint"><span style={{color:AMBER}}>{n}</span><span className="h-px w-8 bg-bd"/>{t}</div>;
export default function Landing(){
 const [img,setImg]=useState(true),[shown,setShown]=useState(false);
 useEffect(()=>{document.title='AEGIS NEXUS — Operational risk management';const t=requestAnimationFrame(()=>setShown(true));return()=>cancelAnimationFrame(t)},[]);
 return <div className="bg-ink font-sans text-fg">
  <style>{`.lp-in{opacity:0;transform:translateY(8px);transition:opacity .9s ease,transform .9s ease}.lp-in.on{opacity:1;transform:none}.lp-link{position:relative}.lp-link:after{content:"";position:absolute;left:0;bottom:-5px;height:1px;width:0;background:${AMBER};transition:width .25s}.lp-link:hover:after,.lp-link:focus-visible:after{width:100%}@media (prefers-reduced-motion:reduce){.lp-in{opacity:1;transform:none;transition:none}.lp-link:after{transition:none}}`}</style>
  <section id="platform" className="relative min-h-screen overflow-hidden">
   <div className="absolute inset-0 bg-gradient-to-br from-p2 via-alt to-ink"/>
   {img&&<img src="/images/hero.jpg" alt="Electrical substation and steel structures at an industrial site" onError={()=>setImg(false)} className="absolute inset-0 h-full w-full object-cover" fetchPriority="high"/>}
   <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/60 to-ink/15"/><div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ink to-transparent"/>
   <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between border-b border-fg/10 px-6 py-6 md:px-10">
    <a href="#/" className="text-[12px] font-semibold tracking-[.32em]" aria-label="AEGIS NEXUS home">AEGIS NEXUS</a>
    <nav aria-label="Primary" className="flex gap-6 text-[11px] uppercase tracking-[.2em] text-fg/80 md:gap-10">{NAV.map(([l,id])=><a key={id} href={'#'+id} onClick={e=>{e.preventDefault();go(id)}} className="lp-link transition-colors hover:text-fg focus:outline-none focus-visible:text-fg">{l}</a>)}</nav>
    <ThemeToggle className="ml-4"/>
   </header>
   <div className="relative z-10 mx-auto flex min-h-[calc(100vh-90px)] max-w-7xl items-center px-6 pb-24 md:px-10">
    <div className={`lp-in max-w-xl ${shown?'on':''}`}>
     <div className="mb-7 h-px w-14" style={{background:AMBER}}/>
     <h1 className="text-5xl font-light tracking-[.14em] md:text-6xl">AEGIS NEXUS</h1>
     <p className="mt-5 text-[12px] font-medium uppercase leading-loose tracking-[.26em] text-fg/90 md:text-[13px]">See the cascade. Simulate the impact. Stay ready.</p>
     <p className="mt-7 max-w-md text-[15px] leading-relaxed text-mute">Understand operational dependencies, evaluate cascading risks, and explore mitigation strategies before disruptions affect project delivery.</p>
     <div className="mt-11 flex flex-wrap items-center gap-x-9 gap-y-4">
      <a href="#/app" className="inline-flex items-center gap-3 rounded-md px-7 py-4 text-[12px] font-semibold uppercase tracking-[.16em] text-black transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-fg/70" style={{background:AMBER}}>Enter Command Centre <ArrowRight size={15}/></a>
      <a href="#capabilities" onClick={e=>{e.preventDefault();go('capabilities')}} className="lp-link text-[12px] uppercase tracking-[.16em] text-fg/80 hover:text-fg">Explore capabilities</a>
     </div>
    </div>
   </div>
  </section>
  <section id="capabilities" className="bg-alt px-6 py-28 md:px-10"><div className="mx-auto max-w-7xl">
   <Label n="01" t="Capabilities"/>
   <h2 className="max-w-2xl text-2xl font-light leading-snug tracking-tight md:text-[32px]">From a single delay to its downstream consequences.</h2>
   <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-mute">Projects rarely fail in isolation. AEGIS NEXUS models how one activity affects the others, then lets teams test their options.</p>
   <div className="mt-16 grid border-t border-bd md:grid-cols-3">{CAP.map(([I,t,d],i)=><div key={t} className={`py-10 md:px-8 md:py-12 ${i?'border-t border-bd md:border-l md:border-t-0':'md:pl-0'}`}><div className="flex items-center justify-between"><I size={22} strokeWidth={1.4} style={{color:AMBER}}/><span className="text-[11px] tracking-[.2em] text-faint">0{i+1}</span></div><h3 className="mt-8 text-[12px] font-semibold uppercase tracking-[.2em]">{t}</h3><p className="mt-3 max-w-xs text-[15px] leading-relaxed text-mute">{d}</p></div>)}</div>
  </div></section>
  <section id="about" className="border-t border-bd px-6 py-28 md:px-10"><div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[1fr_1.5fr]">
   <div><Label n="02" t="About"/><h2 className="text-2xl font-light tracking-tight">Transparent by design.</h2></div>
   <div className="max-w-2xl space-y-5 text-[15px] leading-relaxed text-mute"><p>AEGIS NEXUS is a project portfolio and operational-risk prototype built around a dependency graph. Risk scores, schedule propagation, readiness and mitigation rankings are calculated by documented rules, so every figure can be traced back to its inputs.</p><p>The demonstration uses simulated data. Scores are decision-support indicators, not validated safety or readiness standards, and any operational decision remains with authorised people.</p>
    <a href="#/app" className="lp-link inline-flex items-center gap-2 pt-2 text-[12px] font-semibold uppercase tracking-[.16em]" style={{color:AMBER}}>Enter Command Centre <ArrowRight size={14}/></a></div>
  </div></section>
  <footer className="border-t border-bd px-6 py-6 text-[11px] tracking-wide text-faint md:px-10"><div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2"><span>AEGIS NEXUS · Demonstration prototype</span><span>All data shown in the application is simulated.</span></div></footer>
 </div>}
