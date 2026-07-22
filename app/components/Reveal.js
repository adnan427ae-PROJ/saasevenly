"use client";

// Reveal — fades/slides children in the first time they scroll into view.
// Pure IntersectionObserver + CSS (see .reveal in globals.css), no libraries.
//
//   <Reveal><section>…</section></Reveal>
//   <Reveal delay={150} as="div" className="grid …">…</Reveal>
import { useEffect, useRef, useState } from "react";

export default function Reveal({ children, delay = 0, as: Tag = "div", className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
