import { useEffect, useRef } from "react";

/** Ambient light stays below the interface and never captures pointer input. */
export function BackgroundAtmosphere() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const layer = root.current!;
    const lights = Array.from(layer.querySelectorAll<HTMLElement>(".cursor-light"));
    const allowed = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let frame = 0;
    let fade: ReturnType<typeof setTimeout> | undefined;
    let target = { x: 0, y: 0 };
    let points = lights.map(() => ({ x: 0, y: 0 }));
    let initialized = false;
    const stop = () => {
      layer.removeAttribute("data-active");
      cancelAnimationFrame(frame);
      frame = 0;
      initialized = false;
      clearTimeout(fade);
    };
    const draw = () => {
      let moving = false;
      points.forEach((point, index) => {
        const destination = index === 0 ? target : points[index - 1];
        const ease = index === 0 ? 0.18 : 0.12;
        point.x += (destination.x - point.x) * ease;
        point.y += (destination.y - point.y) * ease;
        lights[index].style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`;
        if (Math.abs(destination.x - point.x) + Math.abs(destination.y - point.y) > 0.2) moving = true;
      });
      frame = moving ? requestAnimationFrame(draw) : 0;
    };
    const move = (event: PointerEvent) => {
      if (!allowed.matches || event.pointerType !== "mouse") return;
      target = { x: event.clientX, y: event.clientY };
      if (!initialized) {
        points = lights.map(() => ({ ...target }));
        initialized = true;
      }
      layer.setAttribute("data-active", "");
      clearTimeout(fade);
      fade = setTimeout(() => layer.removeAttribute("data-active"), 850);
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const leave = (event: PointerEvent) => { if (!event.relatedTarget) stop(); };
    const visibility = () => { if (document.hidden) stop(); };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerout", leave);
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", visibility);
    allowed.addEventListener("change", stop);
    return () => {
      stop();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerout", leave);
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", visibility);
      allowed.removeEventListener("change", stop);
    };
  }, []);
  return <div className="background-atmosphere" ref={root} aria-hidden="true">
    <div className="ambient-orb" />
    <div className="cursor-light cursor-light-blue" />
    <div className="cursor-light cursor-light-cyan" />
    <div className="cursor-light cursor-light-violet" />
  </div>;
}
