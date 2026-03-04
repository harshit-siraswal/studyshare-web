import type {
  CameraKeyframe,
  LandingChapterId,
  PerformanceTierConfig,
  PortalNodeConfig,
  PerformanceTier,
} from "./types";

export const CHAPTER_ORDER: LandingChapterId[] = ["home", "features", "community", "pricing", "download"];

export const CAMERA_KEYFRAMES: CameraKeyframe[] = [
  {
    id: "home",
    progress: 0,
    position: [0, 1.8, 8],
    target: [0, 0.8, 0],
    fov: 48,
    holdMs: 420,
  },
  {
    id: "features",
    progress: 0.25,
    position: [7, 2.2, 4],
    target: [10, 1, -8],
    fov: 46,
    holdMs: 360,
  },
  {
    id: "community",
    progress: 0.5,
    position: [18, 2.8, 5],
    target: [22, 2, -2],
    fov: 44,
    holdMs: 360,
  },
  {
    id: "pricing",
    progress: 0.75,
    position: [30, 2.4, 10],
    target: [34, 1, 6],
    fov: 45,
    holdMs: 360,
  },
  {
    id: "download",
    progress: 1,
    position: [42, 2, 8],
    target: [46, 0, 2],
    fov: 47,
    holdMs: 420,
  },
];

export const PORTAL_NODES: PortalNodeConfig[] = [
  { id: "home", label: "Home", position: [0, 0, 0], interactionRadius: 2.8 },
  { id: "features", label: "Features", position: [10, 1, -8], interactionRadius: 2.8 },
  { id: "community", label: "Community", position: [22, 2, -2], interactionRadius: 2.8 },
  { id: "pricing", label: "Pricing", position: [34, 1, 6], interactionRadius: 2.8 },
  { id: "download", label: "Download", position: [46, 0, 2], interactionRadius: 2.8 },
];

export const CHAPTER_PROGRESS: Record<LandingChapterId, number> = CAMERA_KEYFRAMES.reduce(
  (acc, frame) => {
    acc[frame.id] = frame.progress;
    return acc;
  },
  {
    home: 0,
    features: 0.25,
    community: 0.5,
    pricing: 0.75,
    download: 1,
  } as Record<LandingChapterId, number>,
);

export const PERFORMANCE_TIER_CONFIG: Record<PerformanceTier, PerformanceTierConfig> = {
  high: { tier: "high", physicsEnabled: true, postFxEnabled: true, dprMin: 1, dprMax: 1.8 },
  medium: { tier: "medium", physicsEnabled: false, postFxEnabled: true, dprMin: 0.9, dprMax: 1.4 },
  low: { tier: "low", physicsEnabled: false, postFxEnabled: false, dprMin: 0.75, dprMax: 1.1 },
  fallback: { tier: "fallback", physicsEnabled: false, postFxEnabled: false, dprMin: 1, dprMax: 1 },
};

export const CHAPTER_LABELS: Record<LandingChapterId, string> = {
  home: "Chaos to clarity",
  features: "AI and resource velocity",
  community: "Verified student collaboration",
  pricing: "Predictable student pricing",
  download: "Study on the go",
};

export function chapterFromProgress(progress: number): LandingChapterId {
  const sorted = [...CAMERA_KEYFRAMES].sort((a, b) => a.progress - b.progress);
  let best = sorted[0];
  let bestDistance = Math.abs(progress - best.progress);

  for (const frame of sorted.slice(1)) {
    const distance = Math.abs(progress - frame.progress);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = frame;
    }
  }

  return best.id;
}
