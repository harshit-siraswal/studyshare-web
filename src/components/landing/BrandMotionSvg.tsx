import { motion, useReducedMotion } from "framer-motion";

interface BrandMotionSvgProps {
  className?: string;
}

export function BrandMotionSvg({ className }: BrandMotionSvgProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={className} aria-hidden="true">
      <motion.svg
        viewBox="0 0 420 420"
        className="w-full h-full"
        initial={{ opacity: 0.5, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <defs>
          <linearGradient id="brandStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.92" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.44" />
          </linearGradient>
        </defs>

        <motion.g
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={reduceMotion ? undefined : { duration: 26, ease: "linear", repeat: Infinity }}
          style={{ originX: "50%", originY: "50%" }}
        >
          <circle cx="210" cy="210" r="154" stroke="url(#brandStroke)" strokeOpacity="0.35" strokeWidth="1.5" fill="none" />
          <circle cx="210" cy="210" r="124" stroke="url(#brandStroke)" strokeOpacity="0.25" strokeWidth="1.5" fill="none" />
        </motion.g>

        <motion.circle
          cx="210"
          cy="210"
          r="92"
          stroke="url(#brandStroke)"
          strokeWidth="2.5"
          fill="none"
          strokeDasharray="18 14"
          animate={reduceMotion ? undefined : { rotate: -360 }}
          transition={reduceMotion ? undefined : { duration: 18, ease: "linear", repeat: Infinity }}
          style={{ originX: "50%", originY: "50%" }}
        />

        <motion.path
          d="M72 278 C126 230 182 328 244 268 C292 224 326 246 356 274"
          stroke="hsl(var(--primary))"
          strokeOpacity="0.68"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0.15, opacity: 0.2 }}
          animate={
            reduceMotion
              ? { pathLength: 0.35, opacity: 0.5 }
              : { pathLength: [0.12, 0.9, 0.25], opacity: [0.2, 0.75, 0.25] }
          }
          transition={reduceMotion ? { duration: 0.3 } : { duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.path
          d="M58 152 C132 96 186 186 246 140 C292 108 336 124 366 154"
          stroke="hsl(var(--accent))"
          strokeOpacity="0.52"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0.1, opacity: 0.18 }}
          animate={
            reduceMotion
              ? { pathLength: 0.28, opacity: 0.45 }
              : { pathLength: [0.1, 0.85, 0.2], opacity: [0.18, 0.68, 0.2] }
          }
          transition={reduceMotion ? { duration: 0.3 } : { duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
      </motion.svg>
    </div>
  );
}
