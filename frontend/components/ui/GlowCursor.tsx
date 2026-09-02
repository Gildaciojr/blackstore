"use client";

import { useEffect, useRef } from "react";

export default function GlowCursor() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

    if (!finePointer.matches) {
      return;
    }

    let frameId: number | null = null;
    let x = 0;
    let y = 0;

    const updatePosition = () => {
      glow.style.transform = `translate3d(${x - 300}px, ${y - 300}px, 0)`;
      frameId = null;
    };

    const handlePointerMove = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;

      if (frameId !== null) return;

      frameId = window.requestAnimationFrame(updatePosition);
    };

    glow.style.opacity = "0.2";

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-[600px] w-[600px] opacity-0 blur-[120px] will-change-transform"
      style={{
        background:
          "radial-gradient(circle, rgba(212,175,55,0.6), transparent 60%)",
        transform: "translate3d(-600px, -600px, 0)",
      }}
    />
  );
}
