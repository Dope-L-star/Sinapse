'use strict';
/* LUTIM · Dirección creativa «Horizonte de noche» (boceto de Yunque en Opus, M4).
   Concepto: Timo aparece como una luz sobre el horizonte de tu trabajo. Noche tinta para la calma, hojas de papel para el
   trabajo, una sola línea ámbar (el horizonte) que marca dónde está la atención.
   Todo es ficticio y vive en memoria: no hay modelos, cuentas, red ni almacenamiento.
   Patrones de Sinapse (solo lectura) marcados con «Sinapse:» y explicados en HORIZONTE_DIRECCION_CREATIVA.md. */

/* ---------- marca: trazado oficial del símbolo (brand.json de lutim-brand.zip), recoloreable con currentColor ---------- */
const MARCA = [
  'M 2181.49 742.626 C 2670.68 740.161 3068.33 1136.48 3067.49 1625.68 C 3066.66 2114.88 2667.66 2509.84 2178.48 2505.7 C 1693.95 2501.6 1303.55 2107.22 1304.38 1622.67 C 1305.2 1138.12 1696.95 745.068 2181.49 742.626 z M 1432.41 1733.21 C 1438.52 1779.6 1449.91 1825.39 1463.95 1870 C 1471.9 1895.26 1482.46 1920.46 1493.5 1944.51 C 1517.21 1996.2 1549.52 2048.21 1584.51 2093.04 C 1599.07 2111.69 1615.28 2128.98 1631.3 2146.39 C 1670.14 2188.57 1730.59 2233.68 1778 2261.86 C 1839.78 2298.58 1909.38 2323.86 1980.29 2335.52 C 2014.01 2341.07 2048.33 2341.87 2082.5 2341.6 C 2126.53 2341.26 2170.38 2334.09 2212.85 2322.48 C 2315.31 2294.46 2406.34 2233.83 2483.79 2162.44 C 2514.73 2133.92 2542.71 2102.3 2569.19 2069.59 C 2613.45 2014.89 2644.8 1963.03 2676.45 1901.91 C 2688.07 1879.48 2706.83 1835.69 2715.46 1812.81 C 2722.26 1794.8 2728.1 1776.44 2735.03 1758.49 C 2757.35 1700.63 2799.74 1645.49 2862.33 1629.46 C 2889.57 1622.48 2920.29 1626.36 2946.71 1634.96 C 2946.67 1621.64 2946.68 1608.31 2946.2 1595 C 2943.55 1522.07 2928.26 1441.11 2901.33 1373.42 C 2882.9 1327.09 2870.21 1301.65 2844.17 1259.44 C 2806.16 1197.85 2754.6 1143.64 2696.96 1100.51 C 2552.75 992.593 2362.17 955.647 2189.01 1006.36 C 2133.98 1022.48 2090.56 1040.64 2041.08 1069.54 C 1990.67 1098.98 1959.21 1122.03 1912.96 1160.93 C 1864.27 1201.88 1808.59 1263.37 1771.8 1314.41 C 1745.32 1351.14 1726.69 1379.91 1703.38 1419.25 C 1703.38 1419.26 1699.64 1425.74 1699.64 1425.74 C 1678.9 1462.67 1659.73 1500.46 1642.16 1539 C 1633.78 1557.36 1626.95 1576.38 1619.16 1595 C 1595.71 1651.09 1563.95 1695.74 1506.02 1719.49 C 1482.17 1729.27 1458 1732.48 1432.41 1733.21 Z M 1897.5 920.008 C 1876.33 920.016 1852.28 935.438 1834.44 944.785 C 1743.81 992.24 1674.06 1050.13 1606.93 1124.46 C 1580.25 1154.01 1556.79 1186.28 1534.1 1218.99 C 1521.99 1236.44 1511.32 1254.82 1500.51 1273.1 C 1486.96 1296.02 1477.58 1316.08 1485.95 1343 C 1493.87 1368.51 1520.98 1387.71 1547.5 1387.56 C 1593.98 1387.3 1604.8 1356.71 1625.65 1321.39 C 1639.82 1297.38 1655.89 1274.52 1673.02 1252.52 C 1733.07 1175.41 1807.06 1113.59 1892.67 1066.58 C 1923.4 1049.71 1951.25 1043.78 1962.94 1006.99 C 1976.44 964.529 1941.11 919.991 1897.5 920.008 Z M 2869.5 1748.05 C 2838.63 1748.18 2812.59 1767.11 2804.19 1797 C 2796.12 1825.67 2790.64 1852.84 2779.73 1881 C 2759.75 1932.56 2727.35 1990.15 2692.95 2034.46 C 2677.5 2054.36 2672.68 2067.54 2676.94 2093 C 2681.85 2122.4 2710.91 2146.16 2740.5 2146.11 C 2764.81 2146.06 2783.85 2135.26 2798.29 2116.26 C 2832.27 2071.54 2860.87 2022.68 2885.91 1972.49 C 2897.45 1949.37 2906.47 1924.35 2915.02 1900 C 2921.81 1880.68 2928.65 1858.51 2933.41 1838.6 C 2940.15 1810.43 2936.87 1783.39 2913.89 1763.52 C 2901.1 1752.47 2886.21 1747.98 2869.5 1748.05 Z',
  'M 2450.5 1463.58 C 2478.46 1463.6 2505.53 1472.65 2526.12 1491.88 C 2554.51 1518.37 2556.31 1542.81 2556.39 1579 C 2556.53 1648.32 2556.86 1717.68 2556.43 1787 C 2556.4 1791.34 2556.3 1795.67 2556.04 1800 C 2552.68 1857.05 2505.67 1893.02 2450.5 1893.04 C 2423.05 1893.05 2395.69 1883.99 2375.54 1864.87 C 2354.43 1844.84 2345.79 1820.59 2345.57 1792 C 2345.33 1760.67 2345.59 1729.32 2345.51 1698 C 2345.4 1653.35 2344.99 1608.64 2345.55 1564 C 2346.31 1504.35 2391.77 1463.54 2450.5 1463.58 z',
  'M 1914.5 1463.92 C 1945.62 1463.94 1974.31 1474.34 1995.54 1497.82 C 2015.53 1519.93 2019.7 1541.19 2020.12 1570 C 2020.32 1583.82 2020.11 1597.68 2020.08 1611.5 C 2019.92 1671.3 2020.8 1731.21 2019.85 1791 C 2019.7 1800.61 2019.27 1810.17 2016.78 1819.5 C 2004.09 1867.03 1961.03 1893.1 1913.5 1893.05 C 1887.74 1893.02 1861.29 1884.48 1841.91 1867.14 C 1818 1845.75 1809.63 1820.7 1809.17 1789.5 C 1809 1778.34 1809.04 1767.16 1809.04 1756 C 1809.07 1695.02 1808.46 1633.97 1809.11 1573 C 1809.15 1569 1809.21 1564.99 1809.41 1561 C 1812.31 1500.68 1855.02 1463.88 1914.5 1463.92 z'
];
const mark = (cls = '') => '<svg class="lx-mark ' + cls + '" viewBox="1250 690 1870 1870" aria-hidden="true">' + MARCA.map(d => '<path d="' + d + '"/>').join('') + '</svg>';

/* ---------- iconos de línea (24 px, una tinta, currentColor: regla de brand.json) ---------- */
const P = {
  plus: 'M12 5v14M5 12h14', search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4', home: 'M4 11l8-7 8 7v9h-5v-6H9v6H4z',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5', folder: 'M3 6h6l2 2h10v11H3z', book: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1',
  chat: 'M4 5h16v11H9l-5 4z', arrow: 'M5 12h14M13 6l6 6-6 6', close: 'M6 6l12 12M18 6L6 18', help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01',
  spark: 'M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z', bolt: 'M13 2L4 14h7l-1 8 9-12h-7z', moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  file: 'M6 3h9l4 4v14H6zM14 3v5h5', link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  clip: 'M20 11l-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L14 7', mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  check: 'M5 12l5 5 9-10', menu: 'M4 7h16M4 12h16M4 17h16', user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0', users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3',
  pin: 'M9 3h6l-1 6 4 4H6l4-4zM12 13v8', clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2', grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', sliders: 'M4 7h10M18 7h2M4 17h4M12 17h8M14 4v6M8 14v6', eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  memory: 'M6 4h12v16H6zM9 8h6M9 12h6M9 16h3', code: 'M8 7l-5 5 5 5M16 7l5 5-5 5', star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  tasks: 'M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2', wifi: 'M2 9a15 15 0 0 1 20 0M5 13a10 10 0 0 1 14 0M8.5 16.5a5 5 0 0 1 7 0M12 20h.01',
  console: 'M3 5h18v14H3zM7 10l3 2-3 2M12 14h5', globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3.3 3 14.7 0 18M12 3c-3 3.3-3 14.7 0 18'
};
const ic = (n, cls = '') => '<svg class="lx-ic ' + cls + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (P[n] || P.grid) + '"/></svg>';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* Caras: misma marca para Timo y Tim (decisión vigente), distinguidas por su distintivo y su color de fondo. */
const face = (who, size = '') => '<span class="lx-face lx-face-' + who + ' ' + size + '" aria-hidden="true">' + mark() +
  '<b>' + ic(who === 'tim' ? 'help' : 'star') + '</b></span>';

/* ---------- datos ficticios ---------- */
const RECIENTES = [
  { id: 'cafeteria', t: 'Identidad de una cafetería', d: 'Ayer, 6:40 p. m.' },
  { id: 'menu', t: 'Menú de temporada', d: 'Lunes' },
  { id: 'historia', t: 'Resumen para la clase de historia', d: '9 nov.' }
];
const FIJADOS = [{ id: 'casa-calma', t: 'Casa Calma', d: 'Proyecto' }, { id: 'estudio', t: 'Estudio', d: 'Espacio' }];
const ESPACIOS = [
  { id: 'casa-calma', t: 'Casa Calma', tipo: 'Proyecto personalizado', n: '4 conversaciones · 3 archivos', c: 'amber' },
  { id: 'estudio', t: 'Estudio', tipo: 'Estudio', n: '2 conversaciones · apuntes', c: 'blue' },
  { id: 'escritura', t: 'Cartas y textos', tipo: 'Escritura', n: '1 conversación', c: 'paper' },
  { id: 'investigacion', t: 'Mercado de café', tipo: 'Investigación', n: '5 fuentes guardadas', c: 'ink' }
];
const CREACIONES = [
  { id: 'presentacion', t: 'Identidad de una cafetería', tipo: 'Presentación', v: 'Versión 3', p: 'Casa Calma', ok: true },
  { id: 'menu', t: 'Menú de temporada', tipo: 'Documento', v: 'Versión 2', p: 'Casa Calma', ok: false },
  { id: 'guia', t: 'Guía de tono', tipo: 'Documento', v: 'Versión 1', p: 'Casa Calma', ok: true },
  { id: 'reservas', t: 'Página de reservas', tipo: 'Página web', v: 'Borrador', p: 'Casa Calma', ok: true },
  { id: 'apuntes', t: 'Apuntes de independencia', tipo: 'Resumen', v: 'Versión 1', p: 'Estudio', ok: true },
  { id: 'marca', t: 'Paquete de marca', tipo: 'Archivo ZIP', v: '12 archivos', p: 'Casa Calma', ok: true }
];
const MODELOS = [
  { id: 'agil', t: 'Modelo Ágil', d: 'Responde rápido. Bueno para preguntas cortas y textos simples.', e: 1, tags: ['Rápido', 'Poca energía'] },
  { id: 'analitico', t: 'Modelo Analítico', d: 'Piensa paso a paso. Bueno para comparar, resumir y razonar.', e: 2, tags: ['Razona', 'Energía media'] },
  { id: 'visual', t: 'Modelo Visual', d: 'Lee imágenes y documentos con tablas.', e: 2, tags: ['Imágenes', 'Energía media'] },
  { id: 'profundo', t: 'Modelo Profundo', d: 'Para trabajos largos y difíciles. Tarda más y gasta más.', e: 3, tags: ['Trabajos largos', 'Mucha energía'] }
];
const SECUNDARIAS = [
  ['tareas', 'Tareas', 'tasks', 'Lo que Timo y tú dejaron pendiente, con fecha.', 'Muestra'],
  ['memoria', 'Memoria Lutim', 'memory', 'Lo que Timo recuerda de ti. Puedes verlo, editarlo, pausarlo o borrarlo.', 'Muestra'],
  ['ecos', 'Ecos de Timo', 'chat', 'Cómo quieres que Timo te hable: tono, largo de las respuestas y trato.', 'Muestra'],
  ['conexiones', 'Conexiones', 'link', 'Servicios que autorizas a usar, con permisos claros y fáciles de quitar.', 'Muestra'],
  ['skills', 'Skills', 'grid', 'Habilidades extra revisadas que puedes activar.', 'Muestra'],
  ['niveles', 'Niveles', 'star', 'Tu progreso usando LUTIM.', 'Muestra'],
  ['energia', 'Energía y plan', 'bolt', 'Cuánta energía te queda, cuándo se renueva y tu plan.', 'Muestra'],
  ['historial', 'Historial', 'clock', 'Todas tus conversaciones, con búsqueda.', 'Muestra'],
  ['console', 'LUTIM Console', 'console', 'Administración de la plataforma. Solo para quien tiene permiso.', 'Propietario'],
  ['code', 'Timo Code', 'code', 'Un espacio para crear software con Timo.', 'Demo'],
  ['autimum', 'Autimum', 'mic', 'Asistente de voz para tareas en tu computador.', 'Futuro'],
  ['sin-conexion', 'Sin conexión', 'wifi', 'Lo que ves si se cae el internet: qué se guardó y qué hacer.', 'Estado']
];

/* ---------- estado ---------- */
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const S = {
  page: 'timo', thread: null, messages: [], draft: '', pending: false, temporary: false,
  creation: null, creationTab: 'vista', tour: 1, focus: '', tim: false, glossary: false, menu: false,
  pinnedOpen: true, recentOpen: true, panel: 'personal', model: 'analitico', effort: 'Medio', compare: 'no',
  setting: 'apariencia', theme: 'Sistema', motion: reduce.matches ? 'Rápido' : 'Ultratim', sec: null, libFilter: 'Todo', project: 'casa-calma'
};
const app = document.querySelector('#lx-app');
const narrow = () => matchMedia('(max-width: 860px)').matches;
function toast(t) { const el = document.querySelector('#lx-toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.k); toast.k = setTimeout(() => el.classList.remove('on'), 3400); }

/* ---------- navegación lateral ---------- */
function navBtn(label, page, glyph, extra = '') {
  const cur = S.page === page && !S.sec;
  return '<button class="lx-nav' + (cur ? ' is-cur' : '') + '" data-go="' + page + '"' + (cur ? ' aria-current="page"' : '') + extra + '>' + ic(glyph) + '<span>' + label + '</span></button>';
}
function rail() {
  return '<aside class="lx-rail" id="lx-rail" aria-label="Navegación principal">' +
    '<button class="lx-brand" data-act="home" aria-label="LUTIM, inicio">' + mark('lx-brand-mark') + '<span>LUTIM</span></button>' +
    '<button class="lx-new" data-act="new">' + ic('plus') + '<span>Nueva conversación</span></button>' +
    '<button class="lx-nav" data-act="search">' + ic('search') + '<span>Buscar</span><kbd>Ctrl K</kbd></button>' +
    '<nav class="lx-rail-main" aria-label="Secciones">' + navBtn('Timo', 'timo', 'chat') + navBtn('Tu panel', 'panel', 'home') +
    navBtn('Espacios', 'espacios', 'layers') + navBtn('Biblioteca', 'biblioteca', 'book') + '</nav>' +
    '<div class="lx-rail-lists">' +
    '<details' + (S.pinnedOpen ? ' open' : '') + ' data-list="pinnedOpen"><summary>' + ic('pin') + 'Fijados</summary>' +
    FIJADOS.map(f => '<button class="lx-item" data-open-space="' + f.id + '"><span>' + f.t + '</span><small>' + f.d + '</small></button>').join('') + '</details>' +
    '<details' + (S.recentOpen ? ' open' : '') + ' data-list="recentOpen"><summary>' + ic('clock') + 'Recientes</summary>' +
    RECIENTES.map(r => '<button class="lx-item' + (S.thread === r.id && S.page === 'timo' ? ' is-cur' : '') + '" data-thread="' + r.id + '"><span>' + r.t + '</span><small>' + r.d + '</small></button>').join('') +
    '<button class="lx-item lx-item-more" data-sec="historial"><span>Ver todo el historial</span></button></details></div>' +
    '<div class="lx-rail-foot">' + navBtn('Más funciones', 'mas', 'grid') + navBtn('Ajustes', 'ajustes', 'gear') +
    '<button class="lx-account" data-act="account"><span class="lx-avatar" aria-hidden="true">' + mark() + '<i>G</i></span><span><strong>Glitch</strong><small>Propietario · muestra</small></span></button></div></aside>';
}

/* ---------- barra superior ---------- */
function topbar() {
  const timoCur = S.page === 'timo';
  return '<header class="lx-top">' +
    '<button class="lx-icon lx-only-narrow" data-act="menu" aria-label="Abrir menú" aria-expanded="' + S.menu + '" aria-controls="lx-rail">' + ic('menu') + '</button>' +
    '<div class="lx-modes" role="group" aria-label="Con quién conversas">' +
    '<button data-go="timo" aria-pressed="' + timoCur + '">' + face('timo', 'xs') + '<span><b>Timo</b><small>elige por ti</small></span></button>' +
    '<button data-go="seletim" aria-pressed="' + (S.page === 'seletim') + '">' + ic('sliders') + '<span><b>Seletim</b><small>eliges el modelo</small></span></button></div>' +
    '<div class="lx-top-right"><span class="lx-tag-demo">Boceto</span>' +
    '<button class="lx-energy" data-sec="energia" aria-label="Energía de Timo: 72 por ciento disponible"><span>' + ic('bolt') + 'Energía</span><i><b style="width:72%"></b></i><em>72 %</em></button>' +
    '<button class="lx-top-btn" data-go="ajustes" data-setting="apariencia" id="lx-appearance" aria-label="Apariencia">' + ic('eye') + '<span>Apariencia</span></button>' +
    // «Ayuda de Tim» vive en la barra: siempre visible y rotulada, sin tapar mensajes (en celular está en la barra inferior)
    '<button class="lx-help-btn" data-act="tim" aria-expanded="' + S.tim + '">' + face('tim', 'xs') + '<span>Ayuda de Tim</span></button></div></header>';
}

/* ---------- inicio en Timo ---------- */
/* Sinapse: src/chat/11-primera-vez-synthflow-camino.js — pasos 1·2·3 con ✓ y salida directa al chat.
   Aquí: una franja dentro del inicio (no una pantalla aparte); cada paso enciende el control real; se salta con un toque. */
const TOUR = [
  { k: 'Escribir', t: 'Escribe lo que necesitas', p: 'Una idea, una pregunta o una tarea. Timo lee todo tu mensaje y solo pregunta si le falta algo.', target: '.lx-composer' },
  { k: 'Retomar', t: 'Vuelve a lo que dejaste', p: 'Tu última conversación y tus proyectos están justo debajo. Toca la tarjeta para seguir donde ibas.', target: '.lx-resume-main' },
  { k: 'Pedir ayuda', t: 'Tim te explica LUTIM', p: '«Ayuda de Tim» te dice dónde está cada cosa. Puedes preguntarle en cualquier momento.', target: () => narrow() ? '.lx-bottom [data-act="tim"]' : '.lx-help-btn' }
];
function tour() {
  const n = S.tour, s = TOUR[n - 1];
  return '<section class="lx-tour" aria-labelledby="lx-tour-t">' +
    '<div class="lx-tour-head"><span class="lx-eyebrow">Primera vez · opcional</span><button class="lx-link" data-act="tour-skip">Saltar</button></div>' +
    '<ol class="lx-tour-steps">' + TOUR.map((x, i) => '<li class="' + (i + 1 === n ? 'on' : i + 1 < n ? 'done' : '') + '"' + (i + 1 === n ? ' aria-current="step"' : '') + '><b>' + (i + 1 < n ? ic('check') : i + 1) + '</b>' + x.k + '</li>').join('') + '</ol>' +
    '<h2 id="lx-tour-t">' + s.t + '</h2><p>' + s.p + '</p><div class="lx-tour-actions">' +
    (n > 1 ? '<button class="lx-btn ghost" data-act="tour-back">Atrás</button>' : '') +
    '<button class="lx-btn solid" data-act="tour-next">' + (n < 3 ? 'Siguiente' : 'Entendido') + '</button></div></section>';
}
function composer(placeholder) {
  return '<form class="lx-composer" id="lx-compose"><label class="lx-sr" for="lx-prompt">Mensaje para Timo</label>' +
    '<textarea id="lx-prompt" rows="2" placeholder="' + (placeholder || 'Escribe lo que quieres hacer…') + '">' + esc(S.draft) + '</textarea>' +
    '<div class="lx-compose-row"><div class="lx-compose-tools">' +
    '<button type="button" class="lx-chip" aria-label="Adjuntar" data-toast="Adjuntar: verás el archivo, su tamaño y si se puede leer (muestra)">' + ic('clip') + '<span>Adjuntar</span></button>' +
    '<button type="button" class="lx-chip" aria-label="Buscar en la web" data-toast="Buscar en la web: la respuesta mostrará sus fuentes (muestra)">' + ic('globe') + '<span>Buscar en la web</span></button>' +
    '<button type="button" class="lx-chip" aria-label="Dictar" data-toast="Dictar: revisas el texto antes de enviarlo (muestra)">' + ic('mic') + '<span>Dictar</span></button>' +
    '<button type="button" class="lx-chip' + (S.temporary ? ' is-on' : '') + '" aria-label="Conversación temporal" data-act="temporary" aria-pressed="' + S.temporary + '" title="Una conversación temporal no se guarda en tu historial">' + ic('moon') + '<span>' + (S.temporary ? 'Temporal: sí' : 'Temporal') + '</span></button></div>' +
    '<button class="lx-send" type="submit" aria-label="Enviar a Timo"' + (S.pending ? ' disabled' : '') + '>' + ic('arrow') + '</button></div></form>';
}
function home() {
  return '<section class="lx-home"><div class="lx-horizon" aria-hidden="true"><i></i></div>' +
    '<div class="lx-sun">' + face('timo', 'xl') + '</div>' +
    '<p class="lx-eyebrow lx-center">Timo · tu inteligencia en LUTIM</p>' +
    '<h1 class="lx-display">¿Qué hacemos <em>hoy</em>, Glitch?</h1>' +
    '<p class="lx-lead">Escribe lo que necesitas. Timo elige cómo ayudarte.</p>' +
    (S.tour ? tour() : '') + composer() +
    '<section class="lx-resume" aria-labelledby="lx-resume-t"><h2 id="lx-resume-t" class="lx-eyebrow">Retomar</h2>' +
    '<button class="lx-resume-main" data-thread="cafeteria"><span class="lx-sheet-art" aria-hidden="true"><i></i><i></i><i></i></span>' +
    '<span class="lx-resume-text"><small>Conversación · ayer, 6:40 p. m.</small><strong>Identidad de una cafetería</strong><span>La portada está lista para revisar.</span></span>' +
    '<span class="lx-cta">Continuar ' + ic('arrow') + '</span></button>' +
    '<button class="lx-resume-side" data-open-space="casa-calma">' + ic('folder') + '<span><small>Proyecto fijado</small><strong>Casa Calma</strong></span><span class="lx-cta-quiet">Abrir proyecto</span></button>' +
    '<button class="lx-resume-side" data-thread="historia">' + ic('chat') + '<span><small>Conversación · 9 nov.</small><strong>Resumen de historia</strong></span><span class="lx-cta-quiet">Abrir</span></button>' +
    '</section></section>';
}

/* ---------- conversación ---------- */
/* Sinapse: next/componentes/entrada/FraseCarga.jsx — la espera se dice con texto (role="status"). Aquí, una frase que nombra lo que pasa. */
const waiting = () => '<p class="lx-wait" role="status">' + face('timo', 'xs') + '<span>Timo está leyendo tu mensaje</span><i></i><i></i><i></i></p>';
function timoSays(html, extra = '') { return '<article class="lx-msg lx-msg-timo"><header>' + face('timo', 'sm') + '<strong>Timo</strong></header><div class="lx-msg-body">' + html + '</div>' + extra + '</article>'; }
/* Tim habla en una nota al margen, en papel y con su rótulo: así no se confunde con Timo (hallazgo de Mira/Grok). */
function timSays(text) {
  return '<aside class="lx-msg lx-msg-tim" aria-label="Ayuda de Tim"><header>' + face('tim', 'sm') + '<strong>Tim</strong><span class="lx-badge">Ayuda de LUTIM</span></header>' +
    '<p>' + esc(text) + '</p><button class="lx-btn ghost sm" data-act="point">' + ic('eye') + 'Señálamelo</button></aside>';
}
const userSays = t => '<div class="lx-msg-user">' + esc(t) + '</div>';
const replyTools = () => '<div class="lx-reply-tools"><button class="lx-mini" data-act="sources">' + ic('link') + 'Fuentes</button>' +
  '<button class="lx-mini" data-act="understood">' + ic('check') + 'Qué entendí</button><button class="lx-mini" data-toast="Editar mensaje (muestra)">' + ic('file') + 'Editar</button>' +
  '<button class="lx-mini" data-toast="Regenerar en otra rama: la anterior queda en Versiones (muestra)">' + ic('spark') + 'Regenerar</button></div>';
function creationCard(id) {
  const c = CREACIONES.find(x => x.id === id);
  return '<button class="lx-creation-card" data-creation="' + id + '"><span class="lx-cc-thumb lx-thumb-' + id + '" aria-hidden="true"><i></i></span>' +
    '<span class="lx-cc-text"><small>' + c.tipo + ' · ' + c.v + '</small><strong>' + c.t + '</strong></span><span class="lx-cta">Abrir creación</span></button>';
}
function threadContent() {
  let h = '';
  if (S.thread === 'cafeteria') h = userSays('Quiero preparar una presentación para la cafetería. Conservemos el tono cercano.') +
    timoSays('<p>Ya tenemos el enfoque y la estructura. Preparé una primera portada para que revisemos el tono sin perder el trabajo anterior.</p>' + creationCard('presentacion'), replyTools());
  if (S.thread === 'menu') h = userSays('Sigamos con el menú de temporada. Quiero ver la versión con postres.') +
    timoSays('<p>Esta es la última versión que preparamos juntos.</p>' + brokenCard());
  if (S.thread === 'historia') h = userSays('Hazme un resumen corto de la independencia para estudiar.') +
    timoSays('<p>Lo dividí en cinco momentos con fechas y una pregunta de repaso por cada uno.</p>' + creationCard('apuntes'), replyTools());
  return h + S.messages.map(m => m.r === 'user' ? userSays(m.t) : m.r === 'tim' ? timSays(m.t) : timoSays('<p>' + esc(m.t) + '</p>')).join('') + (S.pending ? waiting() : '');
}
/* Sinapse: next/componentes/synthflow/IaCaida.jsx — error con título claro, qué sigue igual y dos salidas concretas. */
function brokenCard() {
  return '<section class="lx-error" role="alert" aria-labelledby="lx-err-t">' + ic('file') + '<div><h3 id="lx-err-t">No pude abrir «Menú de temporada · versión 2»</h3>' +
    '<p>El archivo de esta versión no está disponible ahora. Tu conversación y la versión 1 siguen guardadas.</p>' +
    '<div class="lx-row"><button class="lx-btn solid sm" data-act="retry">Intentar de nuevo</button><button class="lx-btn ghost sm" data-creation="menu-v1">Abrir versión 1</button></div></div></section>';
}
function thread() {
  const title = S.thread ? RECIENTES.find(r => r.id === S.thread).t : 'Nueva conversación';
  const proj = S.thread && S.thread !== 'historia' ? '<button class="lx-crumb" data-open-space="casa-calma">' + ic('folder') + 'Casa Calma</button>' :
    S.thread === 'historia' ? '<button class="lx-crumb" data-open-space="estudio">' + ic('layers') + 'Estudio</button>' : '';
  return '<section class="lx-thread"><header class="lx-thread-head">' + proj + '<h1 class="lx-title">' + title + '</h1>' +
    (S.temporary ? '<span class="lx-badge">Temporal · no se guarda</span>' : '') + '</header>' + threadContent() + composer('Escribe para seguir…') + '</section>';
}

/* ---------- creación (apertura deliberada) ---------- */
function creationPanel() {
  const id = S.creation, broken = id === 'menu-v1', c = CREACIONES.find(x => x.id === (broken ? 'menu' : id));
  const sheet = id === 'presentacion' ? '<div class="lx-slide"><small>CASA CALMA</small><i></i><h2>Hay ideas que se comparten mejor alrededor de una mesa.</h2><span>Portada · 1 de 10</span></div>' :
    broken ? '<div class="lx-slide lx-slide-doc"><small>MENÚ DE TEMPORADA</small><i></i><h2>Café de olla, pan de bono y arepa de choclo.</h2><span>Página 1 de 4 · versión 1</span></div>' :
    '<div class="lx-slide lx-slide-doc"><small>' + esc(c.tipo.toUpperCase()) + '</small><i></i><h2>' + esc(c.t) + '</h2><span>' + esc(c.v) + '</span></div>';
  const tabs = [['vista', 'Vista'], ['versiones', 'Versiones'], ['comentarios', 'Comentarios']];
  const body = S.creationTab === 'vista' ? sheet :
    S.creationTab === 'versiones' ? '<ol class="lx-versions"><li class="on"><b>' + (broken ? 'Versión 1' : c.v) + '</b><span>Abierta ahora</span></li><li><b>Versión anterior</b><span>Guardada · ayer</span></li><li><b>Primera idea</b><span>Guardada · lunes</span></li></ol>' :
    '<div class="lx-comment"><label for="lx-c">Comentario para esta versión</label><textarea id="lx-c" rows="3" placeholder="Por ejemplo: el título en dos líneas"></textarea><button class="lx-btn solid sm" data-toast="Comentario guardado en la muestra">Comentar</button></div>';
  return '<aside class="lx-creation" aria-label="Creación abierta: ' + esc(c.t) + '">' +
    '<header><div><small>' + esc(c.tipo) + ' · ' + (broken ? 'Versión 1' : esc(c.v)) + '</small><strong>' + esc(c.t) + '</strong></div>' +
    '<button class="lx-btn ghost sm" data-act="close-creation">' + ic('close') + 'Volver al chat</button></header>' +
    '<div class="lx-tabs" role="tablist">' + tabs.map(([k, l]) => '<button role="tab" aria-selected="' + (S.creationTab === k) + '" data-ctab="' + k + '">' + l + '</button>').join('') + '</div>' +
    '<div class="lx-creation-body">' + body + '</div>' +
    '<footer><button class="lx-btn ghost sm" data-toast="Descargar: acción simulada">Descargar</button><button class="lx-btn solid sm" data-toast="Pantalla completa de la creación (muestra)">Abrir completa</button></footer></aside>';
}

/* ---------- Seletim ---------- */
/* Sinapse: src/chat/16x-aviso-alto-consumo.js (aviso antes de gastar mucha energía) y PENDIENTES.md («Quedarme con esta IA»).
   Aquí: aviso en línea antes de comparar o elegir un modelo de mucho consumo; al final, quedarse o volver a que Timo elija. */
function seletim() {
  const m = MODELOS.find(x => x.id === S.model);
  let panel = '';
  if (S.compare === 'ask') panel = '<div class="lx-note-energy" role="alert"><strong>Comparar usa más energía</strong><p>Tu mensaje irá a dos modelos y se descuenta la energía de ambas respuestas. Los valores son ilustrativos.</p><div class="lx-row"><button class="lx-btn solid sm" data-act="compare-yes">Comparar igual</button><button class="lx-btn ghost sm" data-act="compare-no">Mejor que Timo elija</button></div></div>';
  if (S.compare === 'yes') panel = '<div class="lx-compare">' + ['analitico', 'agil'].map(id => { const x = MODELOS.find(y => y.id === id); return '<article><header><strong>' + x.t + '</strong><small>' + x.tags.join(' · ') + '</small></header><p>' + (id === 'analitico' ? 'Propongo tres ideas de portada: la mesa compartida, el aroma de la mañana y la casa abierta. La primera mantiene el tono cercano.' : 'Una portada con la frase «Hay ideas que se comparten mejor alrededor de una mesa».') + '</p></article>'; }).join('') +
    '</div><div class="lx-note-energy"><strong>¿Con cuál sigues?</strong><div class="lx-row"><button class="lx-btn solid sm" data-toast="Te quedas con Modelo Analítico en esta conversación (muestra)">Quedarme con Modelo Analítico</button><button class="lx-btn ghost sm" data-act="compare-no">Volver a que Timo elija</button></div></div>';
  return '<section class="lx-page"><header class="lx-page-head"><span class="lx-eyebrow">Seletim · eliges tú</span><h1 class="lx-title">Elige el modelo que responde</h1>' +
    '<p class="lx-lead-s">Aquí escoges qué modelo responde, cuánto esfuerzo pone o comparas dos respuestas. Si prefieres no decidir, Timo elige por ti.</p>' +
    '<button class="lx-btn ghost sm" data-go="timo">' + face('timo', 'xs') + 'Volver a Timo</button></header>' +
    '<div class="lx-seletim"><div class="lx-models" role="radiogroup" aria-label="Modelos de muestra">' + MODELOS.map(x =>
      '<button role="radio" aria-checked="' + (x.id === S.model) + '" data-model="' + x.id + '" class="lx-model"><span class="lx-energy-dots" aria-label="Consumo ' + ['bajo', 'medio', 'alto'][x.e - 1] + '">' + [1, 2, 3].map(i => '<i class="' + (i <= x.e ? 'on' : '') + '"></i>').join('') + '</span>' +
      '<strong>' + x.t + '</strong><p>' + x.d + '</p><small>' + x.tags.join(' · ') + '</small></button>').join('') + '</div>' +
    '<aside class="lx-choice"><h2>Tu elección</h2><p><strong>' + m.t + '</strong> · ' + m.tags.join(' · ') + '</p>' +
    (m.e === 3 ? '<p class="lx-warn">' + ic('bolt') + 'Este modelo gasta mucha energía. Úsalo para trabajos difíciles.</p>' : '') +
    '<label class="lx-label" for="lx-effort">Esfuerzo</label><select id="lx-effort" data-effort>' + ['Bajo', 'Medio', 'Alto'].map(e => '<option' + (e === S.effort ? ' selected' : '') + '>' + e + '</option>').join('') + '</select>' +
    '<button class="lx-btn solid" data-act="use-model">Conversar con ' + m.t + '</button>' +
    '<div class="lx-divider"></div><h2>Una pregunta, dos respuestas</h2><p class="lx-muted">Compara dos modelos lado a lado con el mismo mensaje de ejemplo.</p>' +
    (S.compare === 'no' ? '<button class="lx-btn ghost" data-act="compare">Ver comparación de ejemplo</button>' : '') + '</aside></div>' + panel + '</section>';
}

/* ---------- Tu panel ---------- */
function panelPage() {
  const V = {
    personal: { t: 'Lo tuyo', d: 'Lo que dejaste en marcha y lo que viene.', tiles: [['Conversaciones esta semana', '12'], ['Tareas pendientes', '3'], ['Energía disponible', '72 %']],
      rows: [['Identidad de una cafetería', 'Conversación · ayer', '<button class="lx-btn solid sm" data-thread="cafeteria">Continuar</button>'], ['Casa Calma', 'Proyecto fijado', '<button class="lx-btn ghost sm" data-open-space="casa-calma">Abrir proyecto</button>'], ['Revisar una propuesta', 'Tarea · vence el viernes', '<button class="lx-btn ghost sm" data-sec="tareas">Ver tareas</button>']] },
    equipo: { t: 'Tu equipo', d: 'El trabajo compartido con otras personas.', tiles: [['Personas', '4'], ['Proyectos compartidos', '2'], ['Invitaciones', '1']],
      rows: [['Proyecto de marca', 'Compartido · 3 personas', '<button class="lx-btn ghost sm" data-go="espacios">Ver espacios</button>'], ['Revisar la presentación', 'Tarea compartida', '<button class="lx-btn ghost sm" data-sec="tareas">Ver tareas</button>'], ['Ana · invitación pendiente', 'Enviada hace 2 días', '<button class="lx-btn ghost sm" data-toast="Reenviar invitación: acción simulada">Reenviar</button>']] },
    admin: { t: 'Administración', d: 'Lo que necesita atención como propietario.', tiles: [['Servicios', 'Bien'], ['Alertas', '1'], ['Personas con acceso', '4']],
      rows: [['Operación de la plataforma', 'Estado de servicios y modelos', '<button class="lx-btn ghost sm" data-sec="console">Abrir Console</button>'], ['Accesos y permisos', 'Quién puede ver y hacer qué', '<button class="lx-btn ghost sm" data-sec="console">Revisar accesos</button>']] }
  }, a = V[S.panel];
  return '<section class="lx-page"><header class="lx-page-head"><span class="lx-eyebrow">Tu panel</span><h1 class="lx-title">' + a.t + '</h1><p class="lx-lead-s">' + a.d + '</p></header>' +
    '<div class="lx-seg" role="tablist" aria-label="Vista del panel">' + [['personal', 'Personal'], ['equipo', 'Equipo'], ['admin', 'Administración']].map(([k, l]) => '<button role="tab" aria-selected="' + (S.panel === k) + '" data-panel="' + k + '">' + l + '</button>').join('') + '</div>' +
    '<p class="lx-muted lx-small">Ves Administración porque esta cuenta de muestra es propietaria. Cada persona ve solo lo que le corresponde.</p>' +
    '<div class="lx-tiles">' + a.tiles.map(([l, v]) => '<div class="lx-tile"><b>' + v + '</b><span>' + l + '</span></div>').join('') + '</div>' +
    '<div class="lx-list">' + a.rows.map(([t, d, b]) => '<div class="lx-list-row"><div><strong>' + t + '</strong><small>' + d + '</small></div>' + b + '</div>').join('') + '</div></section>';
}

/* ---------- Espacios y proyecto ---------- */
function espacios() {
  return '<section class="lx-page"><header class="lx-page-head"><span class="lx-eyebrow">Espacios</span><h1 class="lx-title">Tus lugares de trabajo</h1>' +
    '<p class="lx-lead-s">Cada espacio reúne conversaciones, archivos, instrucciones y memoria de un mismo objetivo.</p>' +
    '<button class="lx-btn solid sm" data-toast="Crear espacio: Estudio, Escritura, Investigación o Proyecto (muestra)">' + ic('plus') + 'Nuevo espacio</button></header>' +
    '<div class="lx-spaces">' + ESPACIOS.map(e => '<button class="lx-space lx-space-' + e.c + '" data-open-space="' + e.id + '"><span class="lx-eyebrow">' + e.tipo + '</span><strong>' + e.t + '</strong><small>' + e.n + '</small>' +
      (FIJADOS.some(f => f.id === e.id) ? '<span class="lx-pin">' + ic('pin') + 'Fijado</span>' : '') + '</button>').join('') + '</div></section>';
}
function proyecto() {
  const e = ESPACIOS.find(x => x.id === S.project) || ESPACIOS[0];
  const mine = CREACIONES.filter(c => c.p === e.t);
  const convs = e.id === 'casa-calma' ? RECIENTES.slice(0, 2) : e.id === 'estudio' ? [RECIENTES[2]] : [];
  return '<section class="lx-page"><header class="lx-page-head"><button class="lx-crumb" data-go="espacios">' + ic('layers') + 'Espacios</button><h1 class="lx-title">' + e.t + '</h1>' +
    '<p class="lx-lead-s">' + e.tipo + '. Instrucciones del espacio: «tono cercano, frases cortas, colores cálidos».</p>' +
    '<button class="lx-btn solid sm" data-act="new">' + ic('plus') + 'Conversar en este espacio</button></header>' +
    '<div class="lx-project"><section><h2 class="lx-eyebrow">Conversaciones</h2>' + (convs.length ? convs.map(r => '<button class="lx-list-row lx-click" data-thread="' + r.id + '"><div><strong>' + r.t + '</strong><small>' + r.d + '</small></div><span class="lx-cta-quiet">Abrir</span></button>').join('') : '<p class="lx-muted">Aún no hay conversaciones aquí.</p>') + '</section>' +
    '<section><h2 class="lx-eyebrow">Creaciones</h2>' + (mine.length ? mine.map(c => '<button class="lx-list-row lx-click" data-creation-lib="' + c.id + '"><div><strong>' + c.t + '</strong><small>' + c.tipo + ' · ' + c.v + '</small></div><span class="lx-cta-quiet">' + (c.ok ? 'Ver' : 'No disponible') + '</span></button>').join('') : '<p class="lx-muted">Aún no hay creaciones.</p>') + '</section>' +
    '<section><h2 class="lx-eyebrow">Archivos y memoria</h2><div class="lx-list-row"><div><strong>Notas de la cafetería.pdf</strong><small>Archivo · 2 páginas</small></div></div><div class="lx-list-row"><div><strong>Prefiere frases cortas</strong><small>Recuerdo del proyecto</small></div><button class="lx-btn ghost sm" data-sec="memoria">Ver memoria</button></div></section></div></section>';
}

/* ---------- Biblioteca ---------- */
function biblioteca() {
  const tipos = ['Todo', 'Presentación', 'Documento', 'Página web', 'Resumen', 'Archivo ZIP'];
  const lista = CREACIONES.filter(c => S.libFilter === 'Todo' || c.tipo === S.libFilter);
  return '<section class="lx-page"><header class="lx-page-head"><span class="lx-eyebrow">Biblioteca de creaciones</span><h1 class="lx-title">Todo lo que has creado</h1>' +
    '<p class="lx-lead-s">Presentaciones, documentos, páginas y paquetes, con sus versiones.</p></header>' +
    '<div class="lx-filters" role="group" aria-label="Filtrar por tipo">' + tipos.map(t => '<button aria-pressed="' + (S.libFilter === t) + '" data-filter="' + t + '">' + t + '</button>').join('') + '</div>' +
    '<div class="lx-library">' + lista.map(c => '<button class="lx-book" data-creation-lib="' + c.id + '"><span class="lx-cc-thumb lx-thumb-' + c.id + '" aria-hidden="true"><i></i></span>' +
      '<small>' + c.tipo + ' · ' + c.v + '</small><strong>' + c.t + '</strong><span class="lx-muted">' + c.p + (c.ok ? '' : ' · no disponible') + '</span></button>').join('') + '</div></section>';
}

/* ---------- Ajustes ---------- */
const AJUSTES = [['cuenta', 'Cuenta y perfil', 'user'], ['apariencia', 'Apariencia', 'eye'], ['idioma', 'Idioma', 'globe'], ['ecos', 'Ecos de Timo', 'chat'], ['memoria', 'Memoria Lutim', 'memory'],
  ['privacidad', 'Privacidad y datos', 'shield'], ['energia', 'Energía y plan', 'bolt'], ['conexiones', 'Conexiones', 'link'], ['accesibilidad', 'Accesibilidad', 'help'], ['equipo', 'Equipo', 'users']];
function ajustes() {
  const k = S.setting, label = AJUSTES.find(a => a[0] === k)[1];
  let body;
  if (k === 'apariencia') body = '<div class="lx-field"><span class="lx-label">Tema</span><div class="lx-seg" role="radiogroup" aria-label="Tema">' + ['Sistema', 'Claro', 'Oscuro'].map(t => '<button role="radio" aria-checked="' + (S.theme === t) + '" data-theme-set="' + t + '">' + t + '</button>').join('') + '</div><small class="lx-muted">«Sistema» sigue el modo claro u oscuro de tu equipo. Tu elección manual siempre manda.</small></div>' +
    '<div class="lx-field"><span class="lx-label">Movimiento</span><div class="lx-seg" role="radiogroup" aria-label="Movimiento">' + ['Ultratim', 'Rápido'].map(t => '<button role="radio" aria-checked="' + (S.motion === t) + '" data-motion-set="' + t + '">' + t + '</button>').join('') + '</div><small class="lx-muted">«Rápido» quita animaciones. También se respeta la reducción de movimiento del sistema.</small></div>';
  else if (k === 'idioma') body = '<div class="lx-field"><label class="lx-label" for="lx-lang">Idioma de LUTIM</label><select id="lx-lang" data-toast-change="Idioma de muestra: el boceto solo está en español"><option>Español (predeterminado)</option><option>English</option></select><small class="lx-muted">Se detecta del sistema y puedes cambiarlo cuando quieras.</small></div>';
  else body = '<p class="lx-lead-s">' + ({ cuenta: 'Nombre, foto con la cara de LUTIM y tus iniciales, correo y sesiones abiertas.', ecos: 'El trato que prefieres de Timo: tono, largo de las respuestas y cómo te llama.', memoria: 'Qué recuerda Timo de ti. Ver, editar, pausar, exportar o borrar.', privacidad: 'Qué datos se guardan, cuánto tiempo y cómo descargarlos o borrarlos.', energia: 'Tu energía mensual, el calentamiento de 5 horas y tu plan.', conexiones: 'Servicios autorizados y sus permisos.', accesibilidad: 'Tamaño de letra, contraste, movimiento y lector de pantalla.', equipo: 'Personas, invitaciones y permisos por rol.' }[k] || '') + '</p>' +
    '<div class="lx-field"><label class="lx-switch"><input type="checkbox" checked> <span>Opción de muestra activada</span></label><small class="lx-muted">Los controles de esta sección son de muestra.</small></div>';
  return '<section class="lx-page"><header class="lx-page-head"><span class="lx-eyebrow">Ajustes</span><h1 class="lx-title">' + label + '</h1></header>' +
    '<div class="lx-settings"><nav class="lx-settings-nav" aria-label="Categorías de ajustes">' + AJUSTES.map(([id, l, g]) => '<button data-setting="' + id + '" aria-current="' + (id === k ? 'page' : 'false') + '">' + ic(g) + l + '</button>').join('') + '</nav>' +
    '<div class="lx-settings-body">' + body + '</div></div></section>';
}

/* ---------- Más funciones y pantallas secundarias ---------- */
function mas() {
  return '<section class="lx-page"><header class="lx-page-head"><span class="lx-eyebrow">Todo LUTIM</span><h1 class="lx-title">Más funciones</h1>' +
    '<p class="lx-lead-s">Lo que no está en la barra principal, con una línea que explica para qué sirve.</p></header>' +
    '<div class="lx-more">' + SECUNDARIAS.map(([id, t, g, d, tag]) => '<button class="lx-more-item" data-sec="' + id + '">' + ic(g) + '<span><strong>' + t + '</strong><small>' + d + '</small></span><em class="lx-tag lx-tag-' + tag.toLowerCase() + '">' + tag + '</em></button>').join('') + '</div></section>';
}
function secundaria() {
  const [id, t, g, d, tag] = SECUNDARIAS.find(s => s[0] === S.sec);
  const extra = id === 'energia' ? '<div class="lx-meter"><span>Energía del mes</span><i><b style="width:72%"></b></i><em>72 %</em></div><div class="lx-meter"><span>Calentamiento de 5 horas</span><i><b style="width:28%"></b></i><em>28 %</em></div><p class="lx-muted lx-small">Si llegas al límite de 5 horas verás «Timo se está enfriando» y cuándo vuelve. Valores ilustrativos.</p>' :
    id === 'sin-conexion' ? '<div class="lx-error lx-offline">' + ic('wifi') + '<div><h3>Estás sin conexión</h3><p>Lo que escribiste quedó guardado en este equipo. Se enviará cuando vuelva el internet.</p></div></div>' :
    id === 'console' ? '<div class="lx-tiles"><div class="lx-tile"><b>Bien</b><span>Servicios</span></div><div class="lx-tile"><b>1</b><span>Alerta abierta</span></div><div class="lx-tile"><b>4</b><span>Personas con acceso</span></div></div>' :
    '<div class="lx-empty">' + ic(g) + '<p>Pantalla de muestra. En el producto, aquí estará «' + t + '».</p></div>';
  return '<section class="lx-page"><header class="lx-page-head"><button class="lx-crumb" data-go="mas">' + ic('grid') + 'Más funciones</button><h1 class="lx-title">' + t + '</h1>' +
    '<p class="lx-lead-s">' + d + '</p><em class="lx-tag lx-tag-' + tag.toLowerCase() + '">' + tag + '</em></header>' + extra + '</section>';
}

/* ---------- ayuda de Tim, fuentes y búsqueda ---------- */
function glossary() {
  return '<dl class="lx-glossary"><div><dt>' + face('timo', 'xs') + 'Timo</dt><dd>Conversa contigo y elige por ti el modelo que mejor sirve.</dd></div>' +
    '<div><dt>' + ic('sliders') + 'Seletim</dt><dd>Eliges tú el modelo, cuánto esfuerzo pone o comparas dos respuestas.</dd></div>' +
    '<div><dt>' + face('tim', 'xs') + 'Tim</dt><dd>Te ayuda a usar LUTIM: dónde está cada cosa y qué hace.</dd></div></dl>';
}
function timPanel() {
  return '<section class="lx-sheet lx-help" role="dialog" aria-modal="false" aria-labelledby="lx-help-t"><header>' + face('tim', 'sm') +
    '<div><h2 id="lx-help-t">Ayuda de Tim</h2><small>Te explico cómo usar LUTIM</small></div><button class="lx-icon" data-act="tim" aria-label="Cerrar ayuda">' + ic('close') + '</button></header>' +
    '<div class="lx-help-list"><button data-act="ask-theme">' + ic('chat') + '<span><strong>¿Dónde cambio el tema?</strong><small>Te respondo en el chat y te señalo el botón</small></span></button>' +
    '<button data-act="glossary" aria-expanded="' + S.glossary + '">' + ic('help') + '<span><strong>¿Qué es Timo, Seletim y Tim?</strong><small>Tres nombres, tres funciones</small></span></button>' + (S.glossary ? glossary() : '') +
    '<button data-act="tour-again">' + ic('spark') + '<span><strong>Ver la bienvenida otra vez</strong><small>Tres pasos, se salta cuando quieras</small></span></button>' +
    '<button data-go="mas">' + ic('grid') + '<span><strong>Ver todo LUTIM</strong><small>Todas las funciones en una lista</small></span></button></div></section>';
}
function sourcesPanel() {
  const understood = S.sources === 'understood';
  return '<section class="lx-sheet lx-sources" role="dialog" aria-modal="false" aria-labelledby="lx-src-t"><header><div><h2 id="lx-src-t">' + (understood ? 'Qué entendí' : 'Fuentes y contexto') + '</h2><small>Lo que Timo usó para responder</small></div>' +
    '<button class="lx-icon" data-act="sources-close" aria-label="Cerrar">' + ic('close') + '</button></header>' +
    (understood ? '<ul class="lx-bullets"><li>Objetivo: una presentación para la cafetería.</li><li>Tono: cercano, como antes.</li><li>Conservar el trabajo anterior en Versiones.</li></ul>' :
      '<div class="lx-list"><div class="lx-list-row"><div><strong>Notas de la cafetería</strong><small>Archivo del proyecto</small></div></div><div class="lx-list-row"><div><strong>Tono cercano</strong><small>Recuerdo del proyecto</small></div></div><div class="lx-list-row"><div><strong>Referencia web de ejemplo</strong><small>Cita · muestra</small></div></div></div>') + '</section>';
}
function searchDialog() {
  const items = [...RECIENTES.map(r => ['Conversación', r.t, 'data-thread="' + r.id + '"']), ...ESPACIOS.map(e => ['Espacio', e.t, 'data-open-space="' + e.id + '"']),
    ...CREACIONES.map(c => ['Creación', c.t, 'data-creation-lib="' + c.id + '"']), ['Pantalla', 'Ajustes · Apariencia', 'data-go="ajustes" data-setting="apariencia"'], ['Pantalla', 'Tu panel', 'data-go="panel"'], ['Pantalla', 'Más funciones', 'data-go="mas"']];
  return '<dialog id="lx-search" aria-labelledby="lx-search-t"><header><h2 id="lx-search-t">Buscar en LUTIM</h2><form method="dialog"><button class="lx-icon" aria-label="Cerrar búsqueda">' + ic('close') + '</button></form></header>' +
    '<label class="lx-sr" for="lx-search-in">Buscar</label><input id="lx-search-in" placeholder="Conversaciones, proyectos, creaciones o ajustes" autocomplete="off">' +
    '<div class="lx-search-list">' + items.map(([k, t, a]) => '<button ' + a + ' data-close-search><small>' + k + '</small>' + esc(t) + '</button>').join('') + '<p class="lx-muted" hidden id="lx-none">Sin resultados en la muestra.</p></div></dialog>';
}

/* ---------- composición ---------- */
function main() {
  if (S.sec) return secundaria();
  switch (S.page) {
    case 'timo': return S.thread || S.messages.length ? thread() : home();
    case 'seletim': return seletim();
    case 'panel': return panelPage();
    case 'espacios': return espacios();
    case 'proyecto': return proyecto();
    case 'biblioteca': return biblioteca();
    case 'ajustes': return ajustes();
    case 'mas': return mas();
  }
}
function applyTheme() {
  const dark = S.theme === 'Oscuro' || (S.theme === 'Sistema' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.classList.toggle('lx-rapid', S.motion === 'Rápido');
}
function render() {
  applyTheme();
  const showCreation = S.page === 'timo' && S.creation && !S.sec;
  const bottom = [['timo', 'Timo', 'chat'], ['panel', 'Tu panel', 'home'], ['espacios', 'Espacios', 'layers'], ['biblioteca', 'Biblioteca', 'book']];
  app.innerHTML = '<div class="lx' + (S.menu ? ' menu-open' : '') + (showCreation ? ' has-creation' : '') + '">' +
    '<a class="lx-skip" href="#lx-main">Saltar al contenido</a>' + (S.menu ? '<button class="lx-scrim" data-act="menu" aria-label="Cerrar menú"></button>' : '') +
    rail() + '<div class="lx-stage">' + topbar() + '<div class="lx-body"><main id="lx-main" tabindex="-1">' + main() + '</main>' + (showCreation ? creationPanel() : '') + '</div></div>' +
    '<nav class="lx-bottom" aria-label="Navegación del celular">' + bottom.map(([p, l, g]) => '<button data-go="' + p + '"' + (S.page === p && !S.sec ? ' aria-current="page"' : '') + '>' + ic(g) + '<span>' + l + '</span></button>').join('') +
    '<button data-act="tim" aria-expanded="' + S.tim + '">' + ic('help') + '<span>Ayuda</span></button></nav>' +
    (S.tim ? timPanel() : '') + (S.sources && !S.tim ? sourcesPanel() : '') + searchDialog() + '</div>';
  highlight();
}

/* Sinapse: src/synthonia/21-manita-robotica-synthonia-senala.js — Sona llevaba un puntero hasta el control y lo anunciaba.
   Aquí: un halo ámbar quieto sobre el control real, un solo pulso, y el aviso escrito. */
function highlight() {
  document.querySelectorAll('.lx-lit').forEach(n => n.classList.remove('lx-lit'));
  let sel = S.focus;
  const onHome = S.page === 'timo' && !S.thread && !S.messages.length && !S.sec;
  if (!sel && S.tour && onHome) { const t = TOUR[S.tour - 1].target; sel = typeof t === 'function' ? t() : t; }
  const el = sel && document.querySelector(sel);
  if (!el) return;
  el.classList.add('lx-lit');
  const key = sel + S.tour;
  if (highlight.last !== key) {
    highlight.last = key;
    if (S.tour === 1 && !S.focus) return;
    const r = el.getBoundingClientRect();
    if (r.top < 80 || r.bottom > innerHeight - 80) el.scrollIntoView({ block: 'center', behavior: S.motion === 'Rápido' || reduce.matches ? 'auto' : 'smooth' });
  }
}

/* ---------- acciones ---------- */
function go(page, opts = {}) {
  S.page = page; S.sec = null; S.menu = false; S.tim = false; S.sources = false; S.focus = '';
  if (page !== 'timo') S.creation = null;
  if (page !== 'seletim') S.compare = 'no';
  Object.assign(S, opts);
  render(); window.scrollTo(0, 0);
  document.querySelector('#lx-main')?.focus({ preventScroll: true });
}
function openThread(id) { S.thread = id; S.messages = []; S.creation = null; S.tour = 0; go('timo'); }
function send(text) {
  if (!text || S.pending) return;
  if (!S.thread && !S.messages.length) S.tour = 0;
  S.draft = ''; S.messages.push({ r: 'user', t: text }); S.pending = true; render();
  setTimeout(() => {
    S.pending = false;
    if (/\b(tema|apariencia|oscuro|claro)\b/i.test(text)) S.messages.push({ r: 'timo', t: 'Eso es sobre cómo usar LUTIM. Le paso tu pregunta a Tim.' }, { r: 'tim', t: 'Toca «Apariencia», arriba a la derecha, y elige Sistema, Claro u Oscuro. Si quieres, te lo señalo.' });
    else S.messages.push({ r: 'timo', t: S.thread ? 'Anoté el cambio en esta muestra. La versión anterior queda guardada en Versiones.' : 'Esta es una respuesta de muestra. En el inicio, «Continuar» abre una conversación completa de ejemplo.' });
    render(); document.querySelector('#lx-prompt')?.focus();
  }, S.motion === 'Rápido' ? 0 : 900);
}
function act(a, el) {
  switch (a) {
    case 'home': S.thread = null; S.messages = []; S.creation = null; go('timo'); break;
    case 'new': S.thread = null; S.messages = []; S.creation = null; S.draft = ''; go('timo'); document.querySelector('#lx-prompt')?.focus(); break;
    case 'search': document.querySelector('#lx-search').showModal(); document.querySelector('#lx-search-in').focus(); break;
    case 'menu': S.menu = !S.menu; render(); if (S.menu) document.querySelector('.lx-rail .lx-new')?.focus(); else document.querySelector('[data-act="menu"]')?.focus(); break;
    case 'tim': S.tim = !S.tim; S.sources = false; render(); document.querySelector(S.tim ? '.lx-help button' : '.lx-help-btn')?.focus(); break;
    case 'glossary': S.glossary = !S.glossary; render(); document.querySelector('[data-act="glossary"]').focus(); break;
    case 'tour-next': if (S.tour < 3) { S.tour++; render(); document.querySelector('[data-act="tour-next"]').focus(); } else { S.tour = 0; render(); document.querySelector('#lx-prompt').focus(); toast('Listo. «Ayuda de Tim» puede mostrarte la bienvenida otra vez.'); } break;
    case 'tour-back': S.tour = Math.max(1, S.tour - 1); render(); document.querySelector('[data-act="tour-next"]').focus(); break;
    case 'tour-skip': S.tour = 0; render(); document.querySelector('#lx-prompt').focus(); toast('Bienvenida cerrada. Puedes verla otra vez desde «Ayuda de Tim».'); break;
    case 'tour-again': S.tour = 1; S.thread = null; S.messages = []; go('timo'); document.querySelector('[data-act="tour-next"]').focus(); break;
    case 'ask-theme': S.tim = false; if (S.page !== 'timo' || S.sec) { S.page = 'timo'; S.sec = null; } S.tour = 0; send('¿Dónde cambio el tema?'); break;
    case 'point': S.focus = '#lx-appearance'; render(); document.querySelector('#lx-appearance').focus(); toast('Tim señaló «Apariencia», arriba a la derecha.'); break;
    case 'temporary': S.temporary = !S.temporary; render(); document.querySelector('[data-act="temporary"]').focus(); toast(S.temporary ? 'Conversación temporal: no se guardará en tu historial (muestra).' : 'Conversación temporal desactivada.'); break;
    case 'close-creation': { const prev = S.creation; S.creation = null; render(); document.querySelector('[data-creation="' + (prev === 'menu-v1' ? 'menu-v1' : prev) + '"]')?.focus(); break; }
    case 'retry': toast('Sigue sin abrir (simulado). Tu conversación no cambió.'); break;
    case 'sources': case 'understood': S.sources = a; S.tim = false; render(); document.querySelector('.lx-sources button').focus(); break;
    case 'sources-close': S.sources = false; render(); document.querySelector('[data-act="sources"]')?.focus(); break;
    case 'compare': S.compare = 'ask'; render(); document.querySelector('[data-act="compare-yes"]').focus(); break;
    case 'compare-yes': S.compare = 'yes'; render(); document.querySelector('.lx-compare')?.scrollIntoView({ block: 'nearest' }); break;
    case 'compare-no': S.compare = 'no'; go('timo'); break;
    case 'use-model': toast('Conversarás con ' + MODELOS.find(m => m.id === S.model).t + ' (muestra). Timo deja de elegir en esta conversación.'); S.thread = null; S.messages = []; go('timo'); break;
    case 'account': S.setting = 'cuenta'; go('ajustes'); break;
  }
}

document.addEventListener('click', e => {
  const b = e.target.closest('button, [data-go]'); if (!b) return;
  if (S.focus && !b.matches('[data-act="point"]')) { S.focus = ''; }
  if (b.hasAttribute('data-close-search')) document.querySelector('#lx-search')?.close();
  const d = b.dataset;
  if (d.act) return act(d.act, b);
  if (d.thread) return openThread(d.thread);
  if (d.openSpace) return go('proyecto', { project: d.openSpace });
  if (d.creation) { S.creation = d.creation; S.creationTab = 'vista'; render(); document.querySelector('.lx-creation header .lx-btn')?.focus(); return; }
  if (d.creationLib) {
    const c = CREACIONES.find(x => x.id === d.creationLib);
    if (!c.ok) return openThread('menu');
    const t = { presentacion: 'cafeteria', apuntes: 'historia' }[c.id];
    if (t) { openThread(t); S.creation = c.id; render(); } else toast('«' + c.t + '» se abre en su vista completa (muestra).');
    return;
  }
  if (d.ctab) { S.creationTab = d.ctab; render(); document.querySelector('[data-ctab="' + d.ctab + '"]').focus(); return; }
  if (d.sec) { S.sec = d.sec; S.menu = false; S.tim = false; S.creation = null; render(); window.scrollTo(0, 0); document.querySelector('#lx-main').focus({ preventScroll: true }); return; }
  if (d.setting && !d.go) { S.setting = d.setting; render(); document.querySelector('[data-setting="' + d.setting + '"]').focus(); return; }
  if (d.go) { if (d.setting) S.setting = d.setting; return go(d.go); }
  if (d.panel) { S.panel = d.panel; render(); document.querySelector('[data-panel="' + d.panel + '"]').focus(); return; }
  if (d.model) { S.model = d.model; render(); document.querySelector('[data-model="' + d.model + '"]').focus(); return; }
  if (d.filter) { S.libFilter = d.filter; render(); document.querySelector('[data-filter="' + d.filter + '"]').focus(); return; }
  if (d.themeSet) { S.theme = d.themeSet; render(); document.querySelector('[data-theme-set="' + d.themeSet + '"]').focus(); return; }
  if (d.motionSet) { S.motion = d.motionSet; render(); document.querySelector('[data-motion-set="' + d.motionSet + '"]').focus(); return; }
  if (d.toast) toast(d.toast);
  if (!S.focus) document.querySelectorAll('.lx-lit').forEach(n => { if (!S.tour) n.classList.remove('lx-lit'); });
});
document.addEventListener('toggle', e => { const k = e.target.dataset?.list; if (k && e.target.isConnected) S[k] = e.target.open; }, true);
document.addEventListener('submit', e => { if (e.target.id !== 'lx-compose') return; e.preventDefault(); send(document.querySelector('#lx-prompt').value.trim()); });
document.addEventListener('input', e => {
  if (e.target.id === 'lx-prompt') S.draft = e.target.value;
  if (e.target.id === 'lx-search-in') {
    const q = e.target.value.trim().toLocaleLowerCase('es'), btns = [...document.querySelectorAll('.lx-search-list button')];
    btns.forEach(b => { b.hidden = !b.textContent.toLocaleLowerCase('es').includes(q); });
    document.querySelector('#lx-none').hidden = btns.some(b => !b.hidden);
  }
});
document.addEventListener('change', e => {
  if (e.target.matches('[data-effort]')) { S.effort = e.target.value; toast('Esfuerzo: ' + S.effort + ' (muestra).'); }
  if (e.target.dataset.toastChange) toast(e.target.dataset.toastChange);
});
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); act('search'); return; }
  if (e.key !== 'Escape' || document.querySelector('dialog[open]')) return;
  if (S.tim) act('tim');
  else if (S.sources) act('sources-close');
  else if (S.menu) act('menu');
  else if (S.creation && S.page === 'timo') act('close-creation');
  else if (S.compare === 'ask') { S.compare = 'no'; render(); }
  else if (S.tour && S.page === 'timo') act('tour-skip');
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (S.theme === 'Sistema') render(); });
addEventListener('resize', () => { if (S.tour) highlight(); });
render();
