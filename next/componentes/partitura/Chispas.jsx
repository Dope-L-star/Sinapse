'use client';
/* Chispas de los 5 colores al tocar cualquier elemento con data-chispas (botón principal, «Quedarme con esta»…).
   La física la hace el motor en Rust; una sola capa para toda la página que solo corre mientras hay chispas. */
import { useEffect, useRef } from 'react';
import { cargarMotor, COLORES } from './motor';

export default function Chispas() {
  const ref = useRef(null);
  useEffect(() => {
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = ref.current, ctx = cv?.getContext('2d'); if (!ctx) return;
    let motor = null, raf = 0, antes = 0, vivo = true;
    const medir = () => { const d = Math.min(2, devicePixelRatio || 1); cv.width = innerWidth * d; cv.height = innerHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    const vuelta = ahora => {
      raf = 0; if (!vivo || !motor) return;
      const { buf, n } = motor.avanzar(antes ? (ahora - antes) / 1000 : 0.016); antes = ahora;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (let i = 0; i < n; i++) {
        const o = i * 4; ctx.globalAlpha = buf[o + 2]; ctx.fillStyle = COLORES[buf[o + 3] | 0];
        ctx.beginPath(); ctx.arc(buf[o], buf[o + 1], 1.2 + buf[o + 2] * 1.8, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (n) raf = requestAnimationFrame(vuelta); else antes = 0;
    };
    const toque = e => {
      const el = e.target.closest?.('[data-chispas]'); if (!el || !motor) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX || r.left + r.width / 2, y = e.clientY || r.top + r.height / 2;
      motor.lanzar(x, y, 18, (performance.now() * 1000) | 0);
      if (!raf) raf = requestAnimationFrame(vuelta);
    };
    medir(); addEventListener('resize', medir); document.addEventListener('pointerdown', toque);
    cargarMotor().then(m => { motor = m; });
    return () => { vivo = false; cancelAnimationFrame(raf); removeEventListener('resize', medir); document.removeEventListener('pointerdown', toque); };
  }, []);
  return <canvas ref={ref} aria-hidden="true" style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 9999 }} />;
}
