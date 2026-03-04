import { motion, useReducedMotion } from "framer-motion";

interface FeaturePulseSvgProps {
  className?: string;
}

export function FeaturePulseSvg({ className }: FeaturePulseSvgProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={className} aria-hidden="true">
      <motion.svg
        viewBox="0 0 420 220"
        className="h-full w-full"
        initial={{ opacity: 0.3 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <defs>
          <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.58" />
          </linearGradient>
        </defs>

        <line x1="36" y1="110" x2="384" y2="110" stroke="url(#pulseGradient)" strokeOpacity="0.28" strokeWidth="1.2" />

        {[0, 1, 2].map((index) => (
          <motion.circle
            key={index}
            cx="210"
            cy="110"
            r="24"
            fill="none"
            stroke="url(#pulseGradient)"
            strokeWidth="1.8"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={
              reduceMotion
                ? { scale: 1, opacity: 0.45 }
                : { scale: [0.6, 2.1, 2.6], opacity: [0, 0.42, 0] }
            }
            transition={
              reduceMotion
                ? { duration: 0.25 }
                : { duration: 3.2, ease: "easeOut", repeat: Infinity, delay: index * 0.55 }
            }
          />
        ))}

        <motion.path
          d="M40 111 C95 52 142 174 210 111 C277 48 325 170 380 110"
          fill="none"
          stroke="url(#pulseGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0.2, opacity: 0.4 }}
          animate={
            reduceMotion
              ? { pathLength: 0.6, opacity: 0.55 }
              : { pathLength: [0.15, 0.92, 0.24], opacity: [0.25, 0.7, 0.32] }
          }
          transition={reduceMotion ? { duration: 0.2 } : { duration: 4.8, ease: "easeInOut", repeat: Infinity }}
        />
      </motion.svg>
    </div>
  );
}
