export type LandingChapterId = "home" | "features" | "community" | "pricing" | "download";

export type SceneNavState = "SCROLL_SCRUB" | "PROGRAMMATIC_FLY" | "DRAG_ORBIT" | "REDUCED_MOTION";

export type PerformanceTier = "high" | "medium" | "low" | "fallback";

export interface CameraKeyframe {
  id: LandingChapterId;
  progress: number;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  holdMs: number;
}

export interface PortalNodeConfig {
  id: LandingChapterId;
  position: [number, number, number];
  label: string;
  interactionRadius: number;
}

export interface PerformanceTierConfig {
  tier: PerformanceTier;
  physicsEnabled: boolean;
  postFxEnabled: boolean;
  dprMin: number;
  dprMax: number;
}

export interface LandingSceneStore {
  activeChapter: LandingChapterId;
  navState: SceneNavState;
  jumpToChapter: (id: LandingChapterId) => void;
  setScrollProgress: (progress: number) => void;
  setDragActive: (isDragging: boolean) => void;
}

export interface SpatialLandingProps {
  onContinue: () => void;
  onDownload: () => void;
}

export interface FeatureVisual {
  title: string;
  description: string;
  badge: string;
}

export interface StudentSearchIntentTopic {
  title: string;
  description: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}
