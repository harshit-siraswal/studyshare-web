import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { chapterFromProgress } from "../config";
import type { LandingChapterId, LandingSceneStore, SceneNavState } from "../types";

type JumpHandler = (id: LandingChapterId) => void;

interface LandingSceneContextValue extends LandingSceneStore {
  registerJumpHandler: (handler: JumpHandler) => void;
  setNavState: (state: SceneNavState) => void;
  scrollProgress: number;
}

const LandingSceneContext = createContext<LandingSceneContextValue | null>(null);

export function LandingSceneProvider({ children, reducedMotion }: { children: ReactNode; reducedMotion: boolean }) {
  const [activeChapter, setActiveChapter] = useState<LandingChapterId>("home");
  const [scrollProgress, setScrollProgressState] = useState(0);
  const [navState, setNavStateState] = useState<SceneNavState>(reducedMotion ? "REDUCED_MOTION" : "SCROLL_SCRUB");
  const jumpHandlerRef = useRef<JumpHandler | null>(null);

  const setScrollProgress = useCallback((progress: number) => {
    setScrollProgressState(progress);
    setActiveChapter(chapterFromProgress(progress));
  }, []);

  const setDragActive = useCallback((isDragging: boolean) => {
    setNavStateState((current) => {
      if (current === "PROGRAMMATIC_FLY") return current;
      return isDragging ? "DRAG_ORBIT" : reducedMotion ? "REDUCED_MOTION" : "SCROLL_SCRUB";
    });
  }, [reducedMotion]);

  const jumpToChapter = useCallback((id: LandingChapterId) => {
    setActiveChapter(id);
    jumpHandlerRef.current?.(id);
  }, []);

  const registerJumpHandler = useCallback((handler: JumpHandler) => {
    jumpHandlerRef.current = handler;
  }, []);

  const setNavState = useCallback((state: SceneNavState) => {
    setNavStateState(state);
  }, []);

  const value = useMemo<LandingSceneContextValue>(
    () => ({
      activeChapter,
      navState,
      jumpToChapter,
      setScrollProgress,
      setDragActive,
      registerJumpHandler,
      setNavState,
      scrollProgress,
    }),
    [activeChapter, jumpToChapter, navState, registerJumpHandler, scrollProgress, setDragActive, setNavState, setScrollProgress],
  );

  return <LandingSceneContext.Provider value={value}>{children}</LandingSceneContext.Provider>;
}

export function useLandingSceneStore() {
  const context = useContext(LandingSceneContext);
  if (!context) {
    throw new Error("useLandingSceneStore must be used inside LandingSceneProvider");
  }
  return context;
}
