import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

interface LogoWheelTransitionProps {
  label?: string;
}

export function LogoWheelTransition({ label }: LogoWheelTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.5 });
  const reduceMotion = useReducedMotion();

  return (
    <div ref={containerRef} className="relative py-8 md:py-10">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <motion.div
        className="relative mx-auto h-16 w-16 rounded-full border border-primary/35 bg-background/80 backdrop-blur-md shadow-[0_0_28px_rgba(45,212,191,0.22)] flex items-center justify-center"
        initial={{ scale: 0.88, opacity: 0.7 }}
        animate={{ scale: isInView ? 1 : 0.92, opacity: 1 }}
        transition={{ duration: reduceMotion ? 0.15 : 0.4 }}
      >
        <motion.div
          className="absolute inset-[5px] rounded-full border border-primary/25 border-dashed"
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={reduceMotion ? undefined : { duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <motion.img
          src="/brand/logo-mark.png"
          alt="StudyShare logo"
          className="relative z-10 h-8 w-8 rounded-md"
          animate={reduceMotion ? undefined : { rotate: -360 }}
          transition={reduceMotion ? undefined : { duration: 6, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {label ? (
        <motion.p
          className="mt-3 text-center text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: isInView ? 1 : 0.65, y: 0 }}
          transition={{ duration: reduceMotion ? 0.12 : 0.25 }}
        >
          {label}
        </motion.p>
      ) : null}
    </div>
  );
}
