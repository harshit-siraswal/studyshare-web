import { useCallback, useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Vector3, type PerspectiveCamera } from "three";
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
  const focusRef = useRef<FocusTarget>({
    point: new Vector3(0, 0, 0),
    mix: 0,
  });
  const activeChapterRef = useRef<LandingChapterId>("home");

  const applyCameraFromProgress = useCallback(
    (progress: number) => {
      progressRef.current = progress;
      const { from, to, alpha } = findFrameWindow(progress);

      const px = lerpNumber(from.position[0], to.position[0], alpha);
      const py = lerpNumber(from.position[1], to.position[1], alpha);
      const pz = lerpNumber(from.position[2], to.position[2], alpha);

      const tx = lerpNumber(from.target[0], to.target[0], alpha);
      const ty = lerpNumber(from.target[1], to.target[1], alpha);
      const tz = lerpNumber(from.target[2], to.target[2], alpha);

      const focusMix = focusRef.current.mix;
      const targetX = lerpNumber(tx, focusRef.current.point.x, focusMix);
      const targetY = lerpNumber(ty, focusRef.current.point.y, focusMix);
      const targetZ = lerpNumber(tz, focusRef.current.point.z, focusMix);

      camera.position.set(px, py, pz);
      camera.lookAt(targetX, targetY, targetZ);
      camera.fov = lerpNumber(from.fov, to.fov, alpha);
      camera.updateProjectionMatrix();

      const chapter = chapterFromProgress(progress);
      if (chapter !== activeChapterRef.current) {
        activeChapterRef.current = chapter;
        trackLandingEvent("landing_chapter_view", { chapter });
      }

      onProgress(progress);
      coordinator.pulse("camera-progress", 120);
    },
    [camera, coordinator, onProgress],
  );

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: scrollElement,
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      onUpdate: (self) => {
        if (isProgrammaticFly.current) return;
        onNavStateChange("SCROLL_SCRUB");
        applyCameraFromProgress(self.progress);
      },
    });

    scrollTriggerRef.current = trigger;
    applyCameraFromProgress(0);
    trackLandingEvent("landing_chapter_view", { chapter: "home" });

    return () => {
      trigger.kill(false, false);
      scrollTriggerRef.current = null;
    };
  }, [applyCameraFromProgress, onNavStateChange, scrollElement]);

  const jumpToChapter = useCallback(
    (id: LandingChapterId) => {
      const trigger = scrollTriggerRef.current;
      if (!trigger) return;

      const targetProgress = CHAPTER_PROGRESS[id];
      if (Math.abs(targetProgress - progressRef.current) < 0.001) return;

      isProgrammaticFly.current = true;
      onNavStateChange("PROGRAMMATIC_FLY");
      trigger.disable(false, false);
      coordinator.activate("programmatic-fly");

      const progressState = { value: progressRef.current };
      gsap.to(progressState, {
        value: targetProgress,
        duration: 0.7,
        ease: "power3.out",
        onUpdate: () => {
          applyCameraFromProgress(progressState.value);
        },
        onComplete: () => {
          const start = trigger.start;
          const end = trigger.end;
          const nextScroll = start + (end - start) * targetProgress;
          window.scrollTo({ top: nextScroll, behavior: "auto" });

          trigger.enable(false);
          isProgrammaticFly.current = false;
          onNavStateChange("SCROLL_SCRUB");
          coordinator.deactivate("programmatic-fly");
        },
      });

      trackLandingEvent("landing_portal_click", { chapter: id });
    },
    [applyCameraFromProgress, coordinator, onNavStateChange],
  );

  const setFocusTarget = useMemo(
    () => ({
      enter: (id: LandingChapterId, point: Vector3) => {
        focusRef.current.point.copy(point);
        coordinator.activate("focus-target");
        gsap.to(focusRef.current, {
          mix: 0.35,
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
          duration: 0.24,
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
