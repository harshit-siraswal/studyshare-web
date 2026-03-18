import { useCallback, useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CatmullRomCurve3, Vector3, type PerspectiveCamera } from "three";
import { CAMERA_KEYFRAMES, CHAPTER_PROGRESS, chapterFromProgress } from "../config";
import { trackLandingEvent } from "../analytics";
import { RenderInvalidationCoordinator } from "../RenderInvalidationCoordinator";
import type { LandingChapterId, SceneNavState } from "../types";

gsap.registerPlugin(ScrollTrigger);

interface UseCameraTimelineParams {
  camera: PerspectiveCamera;
  scrollElement: HTMLElement;
  coordinator: RenderInvalidationCoordinator;
  onProgress: (progress: number) => void;
  onNavStateChange: (state: SceneNavState) => void;
}

interface FocusTarget {
  point: Vector3;
  mix: number;
}

function lerpNumber(start: number, end: number, alpha: number) {
  return start + (end - start) * alpha;
}

function findFrameWindow(progress: number) {
  const sorted = CAMERA_KEYFRAMES;
  if (progress <= sorted[0].progress) return { from: sorted[0], to: sorted[0], alpha: 0 };
  if (progress >= sorted[sorted.length - 1].progress) {
    const last = sorted[sorted.length - 1];
    return { from: last, to: last, alpha: 0 };
  }

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const from = sorted[index];
    const to = sorted[index + 1];
    if (progress >= from.progress && progress <= to.progress) {
      const span = to.progress - from.progress || 1;
      return { from, to, alpha: (progress - from.progress) / span };
    }
  }

  const fallback = sorted[0];
  return { from: fallback, to: fallback, alpha: 0 };
}

export function useCameraTimeline({
  camera,
  scrollElement,
  coordinator,
  onProgress,
  onNavStateChange,
}: UseCameraTimelineParams) {
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const progressRef = useRef(0);
  const isProgrammaticFly = useRef(false);
  const activeChapterRef = useRef<LandingChapterId>("home");
  const focusRef = useRef<FocusTarget>({
    point: new Vector3(0, 0, 0),
    mix: 0,
  });

  const cameraCurve = useMemo(
    () => new CatmullRomCurve3(CAMERA_KEYFRAMES.map((frame) => new Vector3(...frame.position)), false, "catmullrom", 0.45),
    [],
  );
  const targetCurve = useMemo(
    () => new CatmullRomCurve3(CAMERA_KEYFRAMES.map((frame) => new Vector3(...frame.target)), false, "catmullrom", 0.45),
    [],
  );

  const applyCameraFromProgress = useCallback(
    (progress: number) => {
      const clamped = Math.max(0, Math.min(1, progress));
      progressRef.current = clamped;

      const basePosition = cameraCurve.getPoint(clamped);
      const baseTarget = targetCurve.getPoint(clamped);
      const tangent = cameraCurve.getTangent(Math.max(0.001, Math.min(0.999, clamped)));
      const side = new Vector3(-tangent.z, 0, tangent.x).normalize();
      const drift = side.multiplyScalar(Math.sin(clamped * Math.PI * 4.8) * 0.12);
      const position = basePosition.clone().add(drift);

      const focusMix = focusRef.current.mix;
      const targetX = lerpNumber(baseTarget.x, focusRef.current.point.x, focusMix);
      const targetY = lerpNumber(baseTarget.y, focusRef.current.point.y, focusMix);
      const targetZ = lerpNumber(baseTarget.z, focusRef.current.point.z, focusMix);

      const { from, to, alpha } = findFrameWindow(clamped);
      camera.position.copy(position);
      camera.lookAt(targetX, targetY, targetZ);
      camera.fov = lerpNumber(from.fov, to.fov, alpha);
      camera.updateProjectionMatrix();

      onProgress(clamped);
      coordinator.pulse("camera-progress", 120);
    },
    [camera, cameraCurve, coordinator, onProgress, targetCurve],
  );

  const flyToChapter = useCallback(
    (id: LandingChapterId, source: "scroll" | "jump") => {
      const trigger = scrollTriggerRef.current;
      if (!trigger || isProgrammaticFly.current) return;

      const targetProgress = CHAPTER_PROGRESS[id];
      if (Math.abs(targetProgress - progressRef.current) < 0.001) return;

      isProgrammaticFly.current = true;
      onNavStateChange("PROGRAMMATIC_FLY");
      trigger.disable(false, false);
      coordinator.activate("programmatic-fly");

      const progressState = { value: progressRef.current };
      gsap.to(progressState, {
        value: targetProgress,
        duration: source === "jump" ? 0.88 : 0.72,
        ease: source === "jump" ? "power3.inOut" : "power2.out",
        onUpdate: () => {
          applyCameraFromProgress(progressState.value);
        },
        onComplete: () => {
          activeChapterRef.current = id;
          trackLandingEvent("landing_chapter_view", { chapter: id });

          const start = trigger.start;
          const end = trigger.end;
          const nextScroll = start + (end - start) * targetProgress;
          window.scrollTo({ top: nextScroll, behavior: "auto" });

          window.setTimeout(() => {
            trigger.enable(false);
            isProgrammaticFly.current = false;
            onNavStateChange("SCROLL_SCRUB");
            coordinator.deactivate("programmatic-fly");
          }, 90);
        },
      });

      if (source === "jump") {
        trackLandingEvent("landing_portal_click", { chapter: id });
      }
    },
    [applyCameraFromProgress, coordinator, onNavStateChange],
  );

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: scrollElement,
      start: "top top",
      end: "bottom bottom",
      scrub: false,
      onUpdate: (self) => {
        if (isProgrammaticFly.current) return;
        const chapter = chapterFromProgress(self.progress);
        if (chapter === activeChapterRef.current) return;
        flyToChapter(chapter, "scroll");
      },
    });

    scrollTriggerRef.current = trigger;
    applyCameraFromProgress(0);
    trackLandingEvent("landing_chapter_view", { chapter: "home" });

    return () => {
      trigger.kill(false, false);
      scrollTriggerRef.current = null;
    };
  }, [applyCameraFromProgress, flyToChapter, scrollElement]);

  const jumpToChapter = useCallback(
    (id: LandingChapterId) => {
      flyToChapter(id, "jump");
    },
    [flyToChapter],
  );

  const setFocusTarget = useMemo(
    () => ({
      enter: (id: LandingChapterId, point: Vector3) => {
        focusRef.current.point.copy(point);
        coordinator.activate("focus-target");
        gsap.to(focusRef.current, {
          mix: 0.32,
          duration: 0.22,
          ease: "power2.out",
          onUpdate: () => applyCameraFromProgress(progressRef.current),
          onComplete: () => {
            trackLandingEvent("landing_portal_hover", { chapter: id });
          },
        });
      },
      leave: () => {
        gsap.to(focusRef.current, {
          mix: 0,
          duration: 0.22,
          ease: "power2.out",
          onUpdate: () => applyCameraFromProgress(progressRef.current),
          onComplete: () => coordinator.deactivate("focus-target"),
        });
      },
    }),
    [applyCameraFromProgress, coordinator],
  );

  return {
    jumpToChapter,
    applyCameraFromProgress,
    setFocusTarget,
    isProgrammaticFly,
  };
}
