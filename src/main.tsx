import React,{useEffect,useState} from 'react';import ReactDOM from 'react-dom/client';import App from './App';import Landing from './Landing';import {ThemeProvider} from './theme';import './index.css';
// Hash routing, no extra dependency: "#/" = landing page (initial route), "#/app" = command centre.
const route=()=>location.hash.startsWith('#/app')?'app':'home';
function Root(){const [r,setR]=useState(route());useEffect(()=>{const f=()=>setR(route());addEventListener('hashchange',f);return()=>removeEventListener('hashchange',f)},[]);useEffect(()=>{scrollTo(0,0)},[r]);return r==='app'?<App/>:<Landing/>}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><ThemeProvider><Root/></ThemeProvider></React.StrictMode>);
