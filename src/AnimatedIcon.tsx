import { useEffect, useState, type ReactNode } from "react";
import { LordIcon } from "@lordicon/react";

// Official Lordicon CDN embeds; keep attribution visible in the app footer.
const sources = {
  dashboard: "https://cdn.lordicon.com/jecbuzqe.json",
  inventory: "https://cdn.lordicon.com/uukerzzv.json",
  value: "https://cdn.lordicon.com/qhviklyi.json",
  settings: "https://cdn.lordicon.com/lecprnjb.json",
  search: "https://cdn.lordicon.com/msoeawqm.json",
} as const;
export type AnimatedIconName = keyof typeof sources;

export function AnimatedIcon({
  name,
  fallback,
  size = 24,
  target = "button, .stat, .search",
}: {
  name: AnimatedIconName;
  fallback: ReactNode;
  size?: number;
  target?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduceMotion(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  return (
    <span
      className="animated-icon"
      aria-hidden="true"
      style={{ width: size, height: size }}
    >
      {failed || reduceMotion ? (
        fallback
      ) : (
        <LordIcon
          src={sources[name]}
          trigger="hover"
          target={target}
          currentColor
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: size, height: size }}
        >
          {fallback}
        </LordIcon>
      )}
    </span>
  );
}
