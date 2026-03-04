import { Suspense, lazy, useEffect } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

const Spline = lazy(() => import("@splinetool/react-spline"));

const ROBOT_SCENE_URL = "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";

export default function CursorFollowSplineRobot() {
  const reduceMotion = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const x = useSpring(rawX, {
    stiffness: reduceMotion ? 420 : 180,
    damping: reduceMotion ? 45 : 22,
    mass: 0.25,
  });

  const y = useSpring(rawY, {
    stiffness: reduceMotion ? 420 : 180,
    damping: reduceMotion ? 45 : 22,
    mass: 0.25,
  });

  useEffect(() => {
    const setDefaultPosition = () => {
      rawX.set(window.innerWidth - 170);
      rawY.set(window.innerHeight - 170);
    };

    setDefaultPosition();

    const handleMove = (event: MouseEvent) => {
      rawX.set(event.clientX + 24);
      rawY.set(event.clientY + 24);
    };

    const handleLeave = () => setDefaultPosition();

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseout", handleLeave);
    window.addEventListener("blur", handleLeave);
    window.addEventListener("resize", handleLeave);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseout", handleLeave);
      window.removeEventListener("blur", handleLeave);
      window.removeEventListener("resize", handleLeave);
    };
  }, [rawX, rawY]);

  return (
    <motion.div
      className="pointer-events-none fixed z-[70] hidden lg:block"
      style={{ x, y }}
      initial={{ opacity: 0, scale: 0.86 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
    >
      <div className="relative h-28 w-28 rounded-2xl border border-border/70 bg-card/75 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.35)] overflow-hidden">
        <Suspense
          fallback={
            <div className="h-full w-full animate-pulse bg-gradient-to-br from-primary/20 to-accent/20" />
          }
        >
          <Spline scene={ROBOT_SCENE_URL} className="h-full w-full scale-[1.15]" />
        </Suspense>
      </div>
    </motion.div>
  );
}
