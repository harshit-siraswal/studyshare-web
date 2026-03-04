import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { PerformanceTier } from "./types";
import { trackLandingEvent } from "./analytics";

interface TierState {
  tier: PerformanceTier;
  loading: boolean;
  reason: string;
}

function supportsWebGL() {
  if (typeof window === "undefined") return false;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl2") || canvas.getContext("webgl");
  return Boolean(context);
}

async function sampleFps(durationMs = 900): Promise<number> {
  return new Promise((resolve) => {
    let frames = 0;
    const start = performance.now();

    const loop = () => {
      frames += 1;
      const now = performance.now();
      if (now - start >= durationMs) {
        const fps = (frames * 1000) / (now - start);
        resolve(fps);
        return;
      }
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  });
}

export function useLandingPerformanceTier() {
  const prefersReducedMotion = useReducedMotion();
  const [state, setState] = useState<TierState>({
    tier: "fallback",
    loading: true,
    reason: "booting",
  });

  useEffect(() => {
    let isCancelled = false;

    const decide = async () => {
      if (typeof window === "undefined") return;

      const viewportWidth = window.innerWidth;
      if (prefersReducedMotion) {
        const next = { tier: "fallback" as const, loading: false, reason: "prefers-reduced-motion" };
        if (!isCancelled) {
          setState(next);
          trackLandingEvent("landing_fallback_mode", { reason: next.reason, tier: next.tier });
        }
        return;
      }

      if (viewportWidth < 1024) {
        const next = { tier: "fallback" as const, loading: false, reason: "small-viewport" };
        if (!isCancelled) {
          setState(next);
          trackLandingEvent("landing_fallback_mode", { reason: next.reason, tier: next.tier });
        }
        return;
      }

      if (!supportsWebGL()) {
        const next = { tier: "fallback" as const, loading: false, reason: "webgl-unavailable" };
        if (!isCancelled) {
          setState(next);
          trackLandingEvent("landing_fallback_mode", { reason: next.reason, tier: next.tier });
        }
        return;
      }

      const fps = await sampleFps();

      let tier: PerformanceTier = "low";
      if (fps >= 52) tier = "high";
      else if (fps >= 38) tier = "medium";
      else if (fps >= 26) tier = "low";
      else tier = "fallback";

      const next = {
        tier,
        loading: false,
        reason: `fps-${Math.round(fps)}`,
      };

      if (!isCancelled) {
        setState(next);
        if (tier === "fallback") {
          trackLandingEvent("landing_fallback_mode", { reason: next.reason, tier: next.tier });
        }
      }
    };

    void decide();

    return () => {
      isCancelled = true;
    };
  }, [prefersReducedMotion]);

  return state;
}
