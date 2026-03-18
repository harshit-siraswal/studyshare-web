import { useMemo, useRef } from "react";
import { Group } from "three";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { LANDING_PALETTE } from "../config";
import type { LandingChapterId } from "../types";

interface FloatingCardsProps {
  activeChapter: LandingChapterId;
  enabled: boolean;
}

const CARD_DATA = [
  { id: "c1", title: "AI Summaries", position: [11.2, 3.1, 2.8] as [number, number, number] },
  { id: "c2", title: "Resource Search", position: [18.4, 2.5, -2.4] as [number, number, number] },
  { id: "c3", title: "Doubt Rooms", position: [26.8, 3.2, 2.1] as [number, number, number] },
  { id: "c4", title: "Prep Planner", position: [36.4, 2.1, 4.2] as [number, number, number] },
];

export function FloatingCards({ activeChapter, enabled }: FloatingCardsProps) {
  const cardRefs = useRef<Record<string, Group | null>>({});
  const activeIndex = useMemo(() => {
    const chapterToIndex: Record<LandingChapterId, number> = {
      home: 0,
      features: 1,
      community: 2,
      pricing: 3,
      download: 3,
    };
    return chapterToIndex[activeChapter];
  }, [activeChapter]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    for (let index = 0; index < CARD_DATA.length; index += 1) {
      const ref = cardRefs.current[CARD_DATA[index].id];
      if (!ref) continue;
      const phase = index * 0.9;
      ref.position.y = CARD_DATA[index].position[1] + Math.sin(t * 0.9 + phase) * 0.16;
      ref.rotation.y = Math.sin(t * 0.5 + phase) * 0.12;
      ref.rotation.x = Math.cos(t * 0.45 + phase) * 0.05;
    }
  });

  if (!enabled) return null;

  return (
    <group>
      {CARD_DATA.map((card, index) => {
        const isActive = index <= activeIndex;
        return (
          <group
            key={card.id}
            ref={(api) => {
              cardRefs.current[card.id] = api;
            }}
            position={card.position}
            rotation={[0, 0, 0.04 * (index % 2 === 0 ? 1 : -1)]}
          >
            <mesh>
              <boxGeometry args={[4.1, 2.35, 0.28]} />
              <meshStandardMaterial
                color={isActive ? LANDING_PALETTE.primary : LANDING_PALETTE.backgroundMid}
                emissive={isActive ? LANDING_PALETTE.secondary : LANDING_PALETTE.backgroundDeep}
                emissiveIntensity={isActive ? 0.2 : 0.08}
                metalness={0.28}
                roughness={0.45}
                transparent
                opacity={0.92}
              />
            </mesh>
            <Text
              position={[0, 0, 0.2]}
              fontSize={0.3}
              color={isActive ? "hsl(220, 28%, 12%)" : LANDING_PALETTE.textSoft}
              maxWidth={3.6}
              anchorX="center"
              anchorY="middle"
            >
              {card.title}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
