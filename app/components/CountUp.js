"use client";

// CountUp — animates a number from 0 to `end` when it scrolls into view.
// Accepts prefix/suffix so "+30%" or "1.6×" style stats animate too.
import { useEffect, useRef, useState } from "react";

export default function CountUp({ end, decimals = 0, prefix = "", suffix = "", duration = 1400 }) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min(1, (now - start) / duration);
          // ease-out cubic — fast start, gentle landing.
          const eased = 1 - Math.pow(1 - t, 3);
          setValue(end * eased);
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [end, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
