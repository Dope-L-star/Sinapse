'use client';
/* Las 5 líneas de SymphorIA, animadas por el motor en Rust (WebAssembly) con respaldo en JavaScript.
   modo="lineas": la firma que ondula. modo="afinando": el cargador, las líneas se juntan en un latido.
   Se pausa fuera de pantalla y queda quieta si la persona pidió menos movimiento. */
import { useEffect, useRef } from 'react';
import { cargarMotor, COLORES, PUNTOS_MAX } from './motor';

export default function Pentagrama({ modo = 'lineas', alto = 120, amp, grosor = 1.6, className = '', etiqueta, style }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    let motor = null, raf = 0, visible = true, vivo = true, w = 0, h = 0, afinar = modo === 'afinando' ? 0 : 0;
    const quieto = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now();
    const medir = () => {
      const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const pintar = t => {
      if (!motor) return;
      if (modo === 'afinando') afinar = Math.min(1, afinar + 0.02);
      const pts = Math.min(PUNTOS_MAX, Math.max(24, Math.round(w / 8)));
      const a = amp ?? Math.max(2, h * 0.05);
      const b = motor.cuadro(pts, w, h, t, a, modo === 'afinando' ? afinar : 0);
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = grosor; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        for (let k = 0; k < pts; k++) { const o = (i * PUNTOS_MAX + k) * 2; k ? ctx.lineTo(b[o], b[o + 1]) : ctx.moveTo(b[o], b[o + 1]); }
        ctx.strokeStyle = COLORES[i]; ctx.globalAlpha = modo === 'afinando' ? 0.95 : 0.85;
        ctx.shadowColor = COLORES[i]; ctx.shadowBlur = 8; ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    };
    const vuelta = () => { raf = 0; if (!vivo || !visible) return; pintar((performance.now() - t0) / 1000); raf = requestAnimationFrame(vuelta); };
    const arrancar = () => { if (quieto) { if (modo === 'afinando') afinar = 1; pintar(1.2); return; } if (!raf) raf = requestAnimationFrame(vuelta); };
    medir();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { medir(); if (quieto) pintar(1.2); }) : null; ro?.observe(cv);
    const io = typeof IntersectionObserver === 'function' ? new IntersectionObserver(e => { visible = e[0].isIntersecting; if (visible) arrancar(); }) : null; io?.observe(cv);
    cargarMotor().then(m => { if (!vivo) return; motor = m; cv.dataset.motor = m.rust ? 'rust' : 'js'; arrancar(); });
    return () => { vivo = false; cancelAnimationFrame(raf); ro?.disconnect(); io?.disconnect(); };
  }, [modo, amp, grosor]);
  return (
    <canvas
      ref={ref}
      className={'pg-canvas ' + className}
      style={{ display: 'block', width: '100%', height: alto, ...style }}
      role={etiqueta ? 'img' : undefined}
      aria-label={etiqueta}
      aria-hidden={etiqueta ? undefined : true}
    />
  );
}
