"use client";

import { useEffect, useState } from "react";

export default function GlowCursor() {

  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {

    const move = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", move);

    return () => window.removeEventListener("mousemove", move);

  }, []);

  return (
    <div
      className="pointer-events-none fixed z-[9999] w-[600px] h-[600px] blur-[120px] opacity-20"
      style={{
        background:
          "radial-gradient(circle, rgba(212,175,55,0.6), transparent 60%)",
        left: pos.x - 300,
        top: pos.y - 300,
      }}
    />
  );
}