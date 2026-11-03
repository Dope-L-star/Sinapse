/* Cuentas del tablero de gestión. Todo sale de lo que ya entrega 'health?panel=1' (lo mismo que ve Pulsem):
   no hay datos nuevos en el servidor, no se guarda nada y no hay datos personales. Funciones puras para poder probarlas. */
const n = v => (Number.isFinite(+v) ? +v : 0);
const suma = (a, k) => a.reduce((s, x) => s + n(x[k]), 0);

export function resumen(P) {
  const stat = Array.isArray(P?.stat) ? P.stat : [];          /* [hoy, ayer, …] 7 días */
  const dias = [...stat].reverse();                             /* del más viejo a hoy, para dibujar */
  const ok = d => Math.max(0, n(d.req) - n(d.fail));            /* respuestas que sí llegaron */
  const hoy = stat[0] || {}, antes = stat.slice(1);
  const prom = antes.length ? antes.reduce((s, d) => s + ok(d), 0) / antes.length : 0;
  const req = suma(stat, 'req'), err = suma(stat, 'err'), fail = suma(stat, 'fail'), ms = suma(stat, 'ms');
  const online = Array.isArray(P?.online) ? P.online : [];
  const invitados = online.filter(o => String(o.id || '').startsWith('d:') || String(o.id || '').startsWith('g:') || o.rank === 'Invitado').length;
  const cel = online.filter(o => o.mobile).length;
  const usando = online.filter(o => n(o.msgs) > 0).length;

  /* tropiezos: primero lo contado por día (ev_*), si no hay, los últimos eventos */
  const tro = {};
  for (const d of stat) for (const k of Object.keys(d)) if (k.startsWith('ev_')) tro[k.slice(3)] = (tro[k.slice(3)] || 0) + n(d[k]);
  if (!Object.keys(tro).length) for (const e of (P?.events || [])) tro[e.kind] = (tro[e.kind] || 0) + 1;
  const tropiezos = Object.entries(tro).sort((a, b) => b[1] - a[1]);

  const keys = Array.isArray(P?.keys) ? P.keys : [];
  const cupoUsado = suma(keys.filter(k => !k.down), 'n'), cupoTotal = suma(keys.filter(k => !k.down), 'cap');
  const llavesMal = keys.filter(k => k.down || (k.check && k.check.ok === false)).length;

  const fb = Array.isArray(P?.feedback) ? P.feedback : [];
  const voz = {}; for (const f of fb) voz[f.cat || 'otro'] = (voz[f.cat || 'otro'] || 0) + 1;
  const help = Array.isArray(P?.help) ? P.help : [];

  return {
    norte: { hoy: ok(hoy), prom: Math.round(prom), cambio: prom ? (ok(hoy) - prom) / prom : 0, serie: dias.map(ok), dias: dias.map(d => d.day) },
    calidad: { req, errPct: req ? err / req : 0, failPct: req ? fail / req : 0, msProm: req ? Math.round(ms / req) : 0 },
    gente: { online: online.length, invitados, conCuenta: online.length - invitados, cel, usando },
    tropiezos,
    capacidad: { cupoUsado, cupoTotal, cupoPct: cupoTotal ? cupoUsado / cupoTotal : 0, llaves: keys.length, llavesMal,
      hoyReq: n(hoy.req), tope: n(P?.dayLimit), topePct: n(P?.dayLimit) ? n(hoy.req) / n(P.dayLimit) : 0, mes: P?.use || null },
    voz: { total: fb.length, nuevos: fb.filter(f => f.status === 'nuevo').length, porTipo: Object.entries(voz).sort((a, b) => b[1] - a[1]) },
    ayuda: { abiertas: help.length, urgentes: help.filter(h => h.urgent).length },
  };
}

export const pct = (x, d = 0) => (Math.round(x * 100 * 10 ** d) / 10 ** d) + '%';
export const num = (x, l = 'es') => new Intl.NumberFormat(l === 'en' ? 'en-US' : 'es-CO').format(Math.round(n(x)));
