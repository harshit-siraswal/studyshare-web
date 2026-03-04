import { useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { SceneCanvas } from "./SceneCanvas";
import { OverlayHUD } from "./ui/OverlayHUD";
import { MobileLandingFallback } from "./fallback/MobileLandingFallback";
import { useLandingPerformanceTier } from "./useLandingPerformanceTier";
import { LandingSceneProvider, useLandingSceneStore } from "./state/LandingSceneContext";
import { trackLandingEvent } from "./analytics";
import type { SpatialLandingProps } from "./types";

const ANDROID_APK_PATH = "/downloads/studyshare-android.apk";

interface SpatialLandingShellProps extends SpatialLandingProps {
  sceneReady: boolean;
  setSceneReady: (ready: boolean) => void;
}

function SpatialLandingShell({ onContinue, onDownload, sceneReady, setSceneReady }: SpatialLandingShellProps) {
  const { tier, loading } = useLandingPerformanceTier();
  const reducedMotion = useReducedMotion();
  const { activeChapter, navState, jumpToChapter } = useLandingSceneStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fallback = !loading && tier === "fallback";

  const showScene = useMemo(() => !loading && !fallback, [fallback, loading]);

  if (fallback) {
    return <MobileLandingFallback onContinue={onContinue} onDownload={onDownload} />;
  }

  return (
    <div className="relative min-h-[500svh] bg-[radial-gradient(circle_at_20%_10%,hsl(218,58%,16%),transparent_42%),radial-gradient(circle_at_80%_80%,hsl(27,65%,18%),transparent_36%),hsl(224,52%,8%)] text-foreground">
      {showScene && (
        <SceneCanvas
          tier={tier}
          reducedMotion={Boolean(reducedMotion)}
          scrollRef={scrollRef}
          onSceneReady={() => setSceneReady(true)}
        />
      )}

      <OverlayHUD
        activeChapter={activeChapter}
        navState={navState}
        sceneReady={sceneReady}
        onJumpChapter={(chapter) => jumpToChapter(chapter)}
        onContinue={onContinue}
        onDownload={onDownload}
      />

      <div ref={scrollRef} className="pointer-events-none absolute left-0 top-0 h-[500svh] w-full" aria-hidden="true" />
    </div>
  );
}

export function SpatialLanding() {
  const navigate = useNavigate();
  const [sceneReady, setSceneReady] = useState(false);
  const reducedMotion = useReducedMotion();

  const handleContinue = () => {
    trackLandingEvent("landing_continue_click", { chapter: "global" });
    navigate("/select-college");
  };

  const handleDownload = () => {
    trackLandingEvent("landing_download_click", { chapter: "global" });
    const anchor = document.createElement("a");
    anchor.href = ANDROID_APK_PATH;
    anchor.download = "";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  return (
    <LandingSceneProvider reducedMotion={Boolean(reducedMotion)}>
      <SpatialLandingShell
        onContinue={handleContinue}
        onDownload={handleDownload}
        sceneReady={sceneReady}
        setSceneReady={setSceneReady}
      />
    </LandingSceneProvider>
  );
}
