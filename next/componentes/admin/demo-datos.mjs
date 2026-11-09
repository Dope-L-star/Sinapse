/* Datos de prueba para ver el panel sin servidor (capturas, pruebas y revisar en local).
   apiDemo imita a SZ.api: responde 'health?panel=1', 'trial' y 'help' con datos inventados. Nada sale a internet. */
export function apiDemo({ rank = 'Prime' } = {}) {
  const now = Date.now(), m = n => now - n * 60e3, day = i => new Date(now - i * 86400e3).toISOString().slice(0, 10);
  const P = {
    now, rank, canEdit: rank !== 'Symmetrix', dayLimit: 20000,
    use: { month: new Date(now).toISOString().slice(0, 7), req: 74200, cmd: 212000 },
    supa: { on: true, google: false, errs: [] }, alerts: [],
    online: [
      { id: 'u:ana', name: 'Ana', rank: 'Synther', page: 'chat', since: m(23), msgs: 14, ai: 'synthz', mobile: true, t: m(1) },
      { id: 'u:leo', name: 'Leo', rank: 'Synther', page: 'chat', since: m(9), msgs: 0, ai: 'puter', mobile: false, errs: 2, locked: true, t: m(1) },
      { id: 'u:mia', name: 'Mía', rank: 'Synther', page: 'index', since: m(2), msgs: 0, mobile: true, t: m(0) },
      { id: 'u:sammueladmin', name: 'Sammuel', rank: 'Prime', page: 'pulsem', since: m(41), msgs: 6, ai: 'synthz', mobile: false, t: m(0) },
      { id: 'g:x1', name: 'Invitado 4821', rank: 'Synther', page: 'chat', since: m(6), msgs: 3, ai: 'synthz', mobile: true, t: m(2) },
    ],
    events: [
      { t: m(4), kind: 'error', who: 'Leo', rank: 'Synther', sub: 'leo', page: 'chat', detail: 'Groq respondió 429' },
      { t: m(6), kind: 'confused', who: 'Mía', rank: 'Synther', sub: 'mia', page: 'index', detail: 'Abrió la guía 3 veces' },
      { t: m(12), kind: 'noai', who: 'Leo', rank: 'Synther', sub: 'leo', page: 'chat', detail: 'Sin Puter y sin cupo' },
      { t: m(25), kind: 'reload', who: 'Ana', rank: 'Synther', sub: 'ana', page: 'chat', detail: '—' },
      { t: m(48), kind: 'limit', who: 'Invitado 4821', rank: 'Synther', page: 'chat', detail: 'Tope del día' },
    ],
    stat: [0, 1, 2, 3, 4, 5, 6].map(i => ({ day: day(i), req: [812, 1290, 1104, 960, 1422, 1010, 760][i], tok: [402000, 610000, 520000, 480000, 700000, 500000, 380000][i], err: [6, 9, 3, 4, 12, 2, 1][i], fail: [2, 3, 1, 0, 4, 1, 0][i], ms: [812, 1290, 1104, 960, 1422, 1010, 760][i] * 2300 })),
    perMin: [3, 5, 2, 0, 4, 7, 6, 8, 3, 2, 5, 9, 11, 7, 4, 6, 3, 2, 0, 1, 4, 6, 8, 10, 12, 9, 7, 5, 6, 8],
    keys: [
      { id: 'k1', prov: 'groq', provName: 'Groq', owner: { name: 'Sammuel', rank: 'Prime' }, key: 'gsk_…f3a', n: 412, cap: 1000, tok: 160000, check: { ok: true, state: 'funciona', t: m(14) } },
      { id: 'k2', prov: 'openrouter', provName: 'OpenRouter', owner: { name: 'ZFlow', rank: 'ZFlow' }, key: 'sk-or-…9d1', n: 188, cap: 200, tok: 70000, check: { ok: false, kind: 'limit', state: 'llegó a su tope de hoy', detail: 'Rate limit exceeded: free-models-per-day', t: m(30) } },
      { id: 'k3', prov: 'google', provName: 'Google AI Studio', owner: { name: 'Sammuel', rank: 'Prime' }, key: 'AIza…77Q', n: 96, cap: 1500, tok: 40000, check: { ok: true, state: 'funciona', t: m(55) } },
      { id: 'k4', prov: 'mistral', provName: 'Mistral', owner: { name: 'Symmetrix', rank: 'Symmetrix' }, key: '…a20', n: 0, cap: 500, tok: 0, down: 'pidió pago' },
    ],
    help: [
      { id: 'h1', status: 'open', t: m(22), urgent: true, user: { username: 'leo', name: 'Leo', rank: 'Synther' }, text: 'No me responde ninguna IA desde hace rato' },
      { id: 'h2', status: 'open', t: m(5), urgent: false, user: { username: 'mia', name: 'Mía', rank: 'Synther' }, text: '¿Cómo cambio el color del chat?' },
      { id: 'h3', status: 'talk', t: m(70), user: { username: 'ana', name: 'Ana', rank: 'Synther' }, text: 'Las fotos tardan en subir', by: { name: 'ZFlow' } },
    ],
    feedback: [
      { id: 'f1', cat: 'idea', who: 'Ana', rank: 'Synther', sub: 'ana', page: 'chat', t: m(90), status: 'nuevo', text: 'Me encantaría poder fijar mis chats favoritos arriba.' },
      { id: 'f2', cat: 'error', who: 'Leo', rank: 'Synther', sub: 'leo', page: 'chat', t: m(200), status: 'nuevo', text: 'En el celular el botón de enviar a veces no se ve.' },
      { id: 'f3', cat: 'confuso', who: 'Invitado 4821', rank: 'Synther', page: 'index', t: m(600), status: 'visto', by: 'ZFlow', text: 'No entendí qué es EnerX.' },
    ],
  };
  const T = { keys: P.keys.map(k => Object.assign({}, k, { mine: k.owner.name === 'Sammuel' })), mine: { groq: true, google: true }, models: { n: 37 }, imgDay: 3,
    google: { clientId: '123456-abc.apps.googleusercontent.com', source: 'panel' }, drive: {}, maint: { on: false, text: '' }, now: null, cfAccount: '' };
  const U = [
    { sub: 'ana', name: 'Ana', handle: '@ana', email: 'ana@correo.co', rank: 'Synther', used: { day: 14200, img: 2, search: 11, smart: 6 }, sessions: 2, perm: { day: 60000, img: 10, f: { premium: true }, note: 'Probadora de la beta', by: 'Prime @sammuersynth', t: m(180) } },
    { sub: 'leo', name: 'Leo', handle: '@leo', email: 'leo@correo.co', rank: 'Synther', used: { day: 19800, img: 0, search: 3, smart: 1 }, sessions: 1, perm: null },
    { sub: 'mia', name: 'Mía', handle: '@mia', email: 'mia@correo.co', rank: 'Synther', used: { day: 2100, img: 1, search: 0, smart: 0 }, sessions: 1, perm: { f: { alias: false }, by: 'ZFlow @sammueladmin', t: m(900) } },
    { sub: 'tomas', name: 'Tomás', handle: '@tomas', email: '', rank: 'Synther', used: { day: 0, img: 0, search: 0, smart: 0 }, sessions: 0, perm: null, blocked: true },
    { sub: 'sammueladmin', name: 'ZFlow', handle: '@sammueladmin', email: '', rank: 'ZFlow', used: { day: 52000, img: 4, search: 20, smart: 9 }, sessions: 3, perm: null },
  ];
  const LOG = [{ t: m(180), by: 'Prime @sammuersynth', who: '@ana', what: 'set' }, { t: m(900), by: 'ZFlow @sammueladmin', who: '@mia', what: 'set' }, { t: m(2000), by: 'ZFlow @sammueladmin', who: '@tomas', what: 'block' }];
  const fila = u => ({ sub: u.sub, name: u.name, handle: u.handle, email: u.email, rank: u.rank, blocked: !!u.blocked, own: !!u.perm });
  const ficha = sub => {
    const u = U.find(x => x.sub === sub) || U[0], p = u.perm || {}, team = u.rank !== 'Synther', f0 = { alias: true, image: true, search: true, review: true, smart: true, premium: false };
    const base = { day: P.dayLimit, img: T.imgDay, search: 60, smart: 40, aliasX: 1, credit: 2, f: f0 }, f = {};
    Object.keys(f0).forEach(k => { f[k] = p.f && k in p.f ? p.f[k] : team ? true : f0[k]; });
    const own = { f: p.f || {}, note: p.note || '', by: p.by || '', t: p.t || 0 }; ['day', 'img', 'search', 'smart', 'aliasX', 'credit'].forEach(k => { own[k] = p[k] ?? null; });
    return { user: fila(u), sessions: u.sessions, used: u.used, own, base, team, premiumOn: false, canEdit: rank !== 'Symmetrix', canBlock: rank !== 'Symmetrix' && !team,
      now: { f, day: p.day ?? (team ? -1 : base.day), img: p.img ?? (team ? 5000 : base.img), search: p.search ?? (team ? 5000 : 60), smart: p.smart ?? (team ? 1000 : 40), aliasX: p.aliasX ?? (team ? 100 : 1), credit: p.credit ?? 2 } };
  };
  const conv = { h1: [{ from: 'user', name: 'Leo', t: m(22), text: 'No me responde ninguna IA desde hace rato' }], h2: [{ from: 'user', name: 'Mía', t: m(5), text: '¿Cómo cambio el color del chat?' }],
    h3: [{ from: 'user', name: 'Ana', t: m(70), text: 'Las fotos tardan en subir' }, { from: 'team', name: 'ZFlow', rank: 'ZFlow', t: m(60), text: '¡Hola Ana! Ya lo estamos revisando.' }] };
  const item = id => { const h = P.help.find(x => x.id === id) || P.help[0]; return Object.assign({}, h, { page: 'chat', msgs: conv[h.id] }); };
  const wait = v => new Promise(r => setTimeout(() => r(JSON.parse(JSON.stringify(v))), 250));
  return async (path, o = {}) => {
    const b = o.body || {};
    if (path.startsWith('health')) return wait(P);
    if (path.startsWith('help?id=')) return wait({ item: item(decodeURIComponent(path.split('=')[1])) });
    if (path === 'help') {
      if (b.action === 'say') { conv[b.id].push({ from: 'team', name: 'Sammuel', rank, t: Date.now(), text: b.text }); return wait({ item: item(b.id) }); }
      if (b.action === 'fbset') { const f = P.feedback.find(x => x.id === b.id); f.status = b.status; f.by = 'Sammuel'; return wait({ item: f }); }
      if (b.action === 'close') { P.help = P.help.filter(x => x.id !== b.id); return wait({ ok: true }); }
      return wait({ ok: true, item: item('h1') });
    }
    if (path === 'trial') {
      if (!o.method) return wait(T);
      if (b.action === 'now') { T.now = b.text ? { text: b.text, by: 'Sammuel', t: Date.now() } : null; return wait({ now: T.now }); }
      if (b.action === 'maint') { T.maint = { on: !!b.on, text: b.text }; return wait({ maint: T.maint }); }
      if (b.action === 'limit') { if (b.dayLimit) P.dayLimit = b.dayLimit; if (b.imgDay != null) T.imgDay = b.imgDay; return wait({ dayLimit: P.dayLimit, imgDay: T.imgDay }); }
      if (b.action === 'check') return wait({ keys: [{ ok: true }, { ok: false }, { ok: true }] });
      /* v4.4 · Usuarios: cuentas inventadas con permisos y límites propios */
      if (b.action === 'users') { const q = String(b.q || '').toLowerCase().replace(/^@/, ''); return wait({ users: U.filter(u => !q || (u.name + u.handle + u.email).toLowerCase().includes(q)).map(fila), cursor: '0', done: true, canEdit: rank !== 'Symmetrix', log: LOG }); }
      if (b.action === 'user') return wait(ficha(b.sub));
      if (b.action === 'uset') { const u = U.find(x => x.sub === b.sub); u.perm = Object.keys(b.perm || {}).length ? Object.assign({}, b.perm, { by: rank + ' @sammuersynth', t: Date.now() }) : null; LOG.unshift({ t: Date.now(), by: rank + ' @sammuersynth', who: u.handle, what: u.perm ? 'set' : 'reset' }); return wait(Object.assign({ ok: true, log: LOG }, ficha(b.sub))); }
      if (b.action === 'ublock') { const u = U.find(x => x.sub === b.sub); u.blocked = !!b.on; LOG.unshift({ t: Date.now(), by: rank + ' @sammuersynth', who: u.handle, what: b.on ? 'block' : 'unblock' }); return wait(Object.assign({ ok: true, log: LOG }, ficha(b.sub))); }
      return wait({ ok: true, keys: [] });
    }
    return wait({});
  };
}
