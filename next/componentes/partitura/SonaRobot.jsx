import ChasisSona from './ChasisSona';

export default function SonaRobot({ size = 88, className = '' }) {
  return (
    <svg className={'sona-bot ' + className} viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false">
      <ChasisSona />
      <g className="sb-eyes" fill="#50eaff">
        <rect x="34" y="43" width="9" height="12" rx="2"/>
        <rect x="57" y="43" width="9" height="12" rx="2"/>
      </g>
    </svg>
  );
}
