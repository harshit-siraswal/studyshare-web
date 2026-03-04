import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

const SECTION_STOPS = [0.04, 0.2, 0.35, 0.52, 0.68, 0.84, 0.96];

export function SectionScrollWheel() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();

  const markerTop = useTransform(scrollYProgress, [0, 1], ["0%", "86%"]);
  const markerRotate = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 880]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed right-3 top-1/2 z-40 hidden xl:block -translate-y-1/2">
      <div className="relative h-[68vh] w-14">
        <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 rounded-full bg-border/75" />

        {SECTION_STOPS.map((stop) => (
          <div
            key={stop}
            className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-border/80 bg-muted/85"
            style={{ top: `${Math.round(stop * 100)}%` }}
          />
        ))}

        <motion.div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: markerTop, rotate: markerRotate }}
          transition={{ type: "spring", stiffness: 200, damping: 24 }}
        >
          <div className="h-12 w-12 rounded-full border border-primary/40 bg-card/80 p-1 shadow-[0_14px_35px_hsl(var(--primary)/0.32)] backdrop-blur-sm">
            <img src="/brand/app-icon.png" alt="" className="h-full w-full rounded-full object-cover" loading="lazy" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
