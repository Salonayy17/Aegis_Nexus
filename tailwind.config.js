// Colours resolve to CSS variables defined in src/index.css, so Dark/Light are maintained centrally.
const v=n=>`rgb(var(--${n}) / <alpha-value>)`;
export default {content:['./index.html','./src/**/*.{ts,tsx}'],theme:{extend:{colors:{
 ink:v('ink'),sb:v('sb'),pn:v('pn'),p2:v('p2'),alt:v('alt'),bd:v('bd'),bd2:v('bd2'),fg:v('fg'),mute:v('mute'),faint:v('faint'),
 amber:v('amber'),cy:v('cy'),danger:v('danger'),ok:v('ok'),lost:v('lost'),scrim:v('scrim')},
 fontFamily:{sans:['Inter','system-ui','sans-serif']}}},plugins:[]};
