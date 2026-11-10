/* Sona, el robotcito negro con neón, dibujado en React para las páginas nuevas (la portada, etc.).
   Es el mismo dibujo que el de su botón y su ventanita (src/synthonia/20-…): cabeza de vidrio negro con filo de neón rosa → violeta → cian,
   antena con su rizo y su foquito que late, orejitas y dos ojos cian que parpadean. SIN manos y SIN boca. */
import { useId } from 'react';

export default function SonaRobot({ size = 88, className = '' }) {
  const u = 'sb' + useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <svg className={'sona-bot ' + className} viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={u + 'b'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2c2c3b" /><stop offset=".38" stopColor="#11111a" /><stop offset="1" stopColor="#040408" /></linearGradient>
        <linearGradient id={u + 'r'} gradientUnits="userSpaceOnUse" x1="12" y1="10" x2="88" y2="86"><stop offset="0" stopColor="#ff5fae" /><stop offset=".5" stopColor="#a866ff" /><stop offset="1" stopColor="#3de0ff" /></linearGradient>
        <radialGradient id={u + 's'} cx=".5" cy=".3" r=".85"><stop offset="0" stopColor="#171726" /><stop offset=".6" stopColor="#07070d" /><stop offset="1" stopColor="#010103" /></radialGradient>
        <filter id={u + 'n'} x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="1.3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id={u + 'e'} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.9" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <g className="sb-ant">
        <g filter={`url(#${u}n)`} fill="none" stroke="#ff7ac0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M50 28V19" />
          <path d="M50 19c0-4.6 2.8-7.6 6.6-7.6s6.2 2.8 6.2 6-2.4 5-4.8 5" />
        </g>
        <circle className="sb-bulb" cx="58" cy="22.4" r="2.9" fill="#ff7ac0" filter={`url(#${u}n)`} />
      </g>
      <rect x="10.5" y="43" width="9" height="20" rx="4.5" fill={`url(#${u}b)`} />
      <rect x="80.5" y="43" width="9" height="20" rx="4.5" fill={`url(#${u}b)`} />
      <rect x="19" y="27" width="62" height="54" rx="17" fill={`url(#${u}b)`} />
      <path d="M27 36q4-5 14-5.5" stroke="#fff" strokeOpacity=".2" strokeWidth="2" strokeLinecap="round" fill="none" />
      <g filter={`url(#${u}n)`} fill="none" stroke={`url(#${u}r)`} strokeWidth="2.2" strokeLinecap="round">
        <rect x="19" y="27" width="62" height="54" rx="17" />
        <rect x="10.5" y="43" width="9" height="20" rx="4.5" strokeWidth="1.9" />
        <rect x="80.5" y="43" width="9" height="20" rx="4.5" strokeWidth="1.9" />
      </g>
      <rect x="26.5" y="35.5" width="47" height="36" rx="11" fill={`url(#${u}s)`} stroke="#fff" strokeOpacity=".09" />
      <g className="sb-eyes" filter={`url(#${u}e)`} stroke="#3DE0FF" strokeWidth="7" strokeLinecap="round" fill="none">
        <path d="M40 48v8" /><path d="M60 48v8" />
      </g>
    </svg>
  );
}
