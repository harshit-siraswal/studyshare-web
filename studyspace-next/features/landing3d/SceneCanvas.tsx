import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Vector2, type Group, type PerspectiveCamera } from "three";
import { useCameraTimeline } from "./camera/useCameraTimeline";
import { PERFORMANCE_TIER_CONFIG } from "./config";
import { RenderInvalidationCoordinator } from "./RenderInvalidationCoordinator";
import { useLandingSceneStore } from "./state/LandingSceneContext";
import { DepthEnvironment } from "./world/DepthEnvironment";
import { NeuralCore } from "./world/NeuralCore";
import { PortalNodes } from "./world/PortalNodes";
import { FloatingCards } from "./physics/FloatingCards";
import type { LandingChapterId, PerformanceTier } from "./types";

interface SceneCanvasProps {
  tier: PerformanceTier;
  reducedMotion: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  onSceneReady: () => void;
  debugInvalidation?: boolean;
}

interface SceneRootProps {
  tier: PerformanceTier;
  reducedMotion: boolean;
  scrollElement: HTMLElement;
  coordinator: RenderInvalidationCoordinator;
  onSceneReady: () => void;
}

function SceneRoot({ tier, reducedMotion, scrollElement, coordinator, onSceneReady }: SceneRootProps) {
  const { camera, invalidate } = useThree();
  const { activeChapter, setScrollProgress, setDragActive, registerJumpHandler, setNavState } = useLandingSceneStore();

  const pointerTarget = useRef(new Vector2(0, 0));
  const pointerSmoothed = useRef(new Vector2(0, 0));
  const worldGroupRef = useRef<Group>(null);
  const dragState = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
    velocityX: 0,
    velocityY: 0,
    rotX: 0,
    rotY: 0,
  });

  const sceneReadyRef = useRef(false);

  const { jumpToChapter, setFocusTarget, isProgrammaticFly } = useCameraTimeline({
    camera: camera as PerspectiveCamera,
    scrollElement,
    coordinator,
    onProgress: (progress) => setScrollProgress(progress),
    onNavStateChange: (state) => setNavState(state),
  });

  useEffect(() => {
    coordinator.setInvalidator(invalidate);
    if (tier === "low") coordinator.pulse("scene-boot", 500);
    else coordinator.activate("ambient-motion");

    if (!sceneReadyRef.current) {
      sceneReadyRef.current = true;
      onSceneReady();
    }

    return () => {
      coordinator.deactivate("ambient-motion");
      coordinator.destroy();
    };
  }, [coordinator, invalidate, onSceneReady, tier]);

  useEffect(() => {
    registerJumpHandler(jumpToChapter);
  }, [jumpToChapter, registerJumpHandler]);

  useFrame((_, delta) => {
    pointerSmoothed.current.lerp(pointerTarget.current, 0.08);

    const drag = dragState.current;
    if (!drag.dragging) {
      drag.velocityX *= 0.9;
      drag.velocityY *= 0.9;
      drag.rotY += drag.velocityX * delta;
      drag.rotX += drag.velocityY * delta;
    }

    drag.rotX = Math.max(-0.34, Math.min(0.34, drag.rotX));
    drag.rotY = Math.max(-0.7, Math.min(0.7, drag.rotY));

    if (worldGroupRef.current) {
      worldGroupRef.current.rotation.x = drag.rotX;
      worldGroupRef.current.rotation.y = drag.rotY;
    }
  });

  const pointerX = pointerSmoothed.current.x;
  const pointerY = pointerSmoothed.current.y;

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    const native = event.nativeEvent as PointerEvent;
    pointerTarget.current.set((native.clientX / window.innerWidth - 0.5) * 2, -(native.clientY / window.innerHeight - 0.5) * 2);

    if (!dragState.current.dragging || isProgrammaticFly.current) return;
    const dx = native.clientX - dragState.current.lastX;
    const dy = native.clientY - dragState.current.lastY;

    dragState.current.lastX = native.clientX;
    dragState.current.lastY = native.clientY;
    dragState.current.velocityX = dx * 0.0025;
    dragState.current.velocityY = dy * 0.0025;
    dragState.current.rotY += dragState.current.velocityX;
    dragState.current.rotX += dragState.current.velocityY;
  };

  return (
    <group
      ref={worldGroupRef}
      onPointerMove={handlePointerMove}
      onPointerDown={(event) => {
        if (reducedMotion || isProgrammaticFly.current) return;
        const native = event.nativeEvent as PointerEvent;
        dragState.current.dragging = true;
        dragState.current.lastX = native.clientX;
        dragState.current.lastY = native.clientY;
        setDragActive(true);
        coordinator.activate("drag-orbit");
      }}
      onPointerUp={() => {
        dragState.current.dragging = false;
        setDragActive(false);
        coordinator.deactivate("drag-orbit");
      }}
      onPointerLeave={() => {
        dragState.current.dragging = false;
        setDragActive(false);
        coordinator.deactivate("drag-orbit");
      }}
    >
      <DepthEnvironment pointer={pointerSmoothed.current} tier={tier} />
      <NeuralCore pointerX={pointerX} pointerY={pointerY} tier={tier} />
      <PortalNodes
        activeChapter={activeChapter}
        disabled={isProgrammaticFly.current}
        onSelectChapter={(id: LandingChapterId) => jumpToChapter(id)}
        onFocusChapter={(id, point) => setFocusTarget.enter(id, point)}
        onBlurChapter={() => setFocusTarget.leave()}
      />
      <FloatingCards activeChapter={activeChapter} enabled={PERFORMANCE_TIER_CONFIG[tier].physicsEnabled} />
    </group>
  );
}

export function SceneCanvas({ tier, reducedMotion, scrollRef, onSceneReady, debugInvalidation = false }: SceneCanvasProps) {
  const coordinator = useMemo(() => new RenderInvalidationCoordinator(), []);
  const [activeReasonCount, setActiveReasonCount] = useState(0);
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);
  const dprConfig = PERFORMANCE_TIER_CONFIG[tier];

  useEffect(() => {
    setScrollElement(scrollRef.current);
  }, [scrollRef]);

  useEffect(() => {
    if (!debugInvalidation) {
      coordinator.setDebugListener(null);
      return;
    }
    coordinator.setDebugListener((reasons) => setActiveReasonCount(reasons));
  }, [coordinator, debugInvalidation]);

  if (!scrollElement) return null;

  return (
    <>
      <div className="fixed inset-0 z-20">
        <Canvas
          frameloop="demand"
          dpr={[dprConfig.dprMin, dprConfig.dprMax]}
          camera={{ position: [0, 1.8, 8], fov: 48, near: 0.1, far: 250 }}
          gl={{
            antialias: false,
            alpha: true,
            powerPreference: tier === "high" ? "high-performance" : "default",
            depth: true,
            stencil: false,
          }}
          onCreated={({ gl }) => {
            gl.setClearAlpha(1);
          }}
        >
          <SceneRoot
            tier={tier}
            reducedMotion={reducedMotion}
            scrollElement={scrollElement}
            coordinator={coordinator}
            onSceneReady={onSceneReady}
          />
        </Canvas>
      </div>
      {debugInvalidation && (
        <div className="fixed bottom-3 left-3 z-[70] rounded bg-black/65 px-2 py-1 text-xs text-emerald-300">
          invalidate reasons: {activeReasonCount}
        </div>
      )}
    </>
  );
}
