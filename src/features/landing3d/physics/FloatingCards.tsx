import { useMemo, useRef } from "react";
import { CuboidCollider, Physics, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { Text } from "@react-three/drei";
import type { LandingChapterId } from "../types";

interface FloatingCardsProps {
  activeChapter: LandingChapterId;
  enabled: boolean;
}

const CARD_DATA = [
  { id: "c1", title: "AI Summaries", position: [12, 3.5, 3] as [number, number, number] },
  { id: "c2", title: "Resource Search", position: [17, 2.6, -3] as [number, number, number] },
  { id: "c3", title: "Doubt Rooms", position: [26, 3.3, 2] as [number, number, number] },
  { id: "c4", title: "Prep Planner", position: [37, 2.2, 4] as [number, number, number] },
];

export function FloatingCards({ activeChapter, enabled }: FloatingCardsProps) {
  const rigidBodies = useRef<Record<string, RapierRigidBody | null>>({});
  const isInteractive = enabled;
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

  if (!enabled) return null;

  return (
    <Physics gravity={[0, -1.8, 0]}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[34, 0.2, 18]} position={[22, -1.6, 0]} />
      </RigidBody>

      {CARD_DATA.map((card, index) => {
        const isActive = index <= activeIndex;
        return (
          <RigidBody
            key={card.id}
            ref={(api) => {
              rigidBodies.current[card.id] = api;
            }}
            colliders={false}
            friction={0.8}
            restitution={0.6}
            linearDamping={1.8}
            angularDamping={2.2}
            position={card.position}
            rotation={[0, 0, 0.1 * (index % 2 === 0 ? 1 : -1)]}
          >
            <CuboidCollider args={[2.1, 1.25, 0.2]} />
            <mesh
              onPointerDown={() => {
                if (!isInteractive) return;
                const body = rigidBodies.current[card.id];
                body?.applyImpulse({ x: (Math.random() - 0.5) * 0.8, y: 0.9, z: (Math.random() - 0.5) * 0.8 }, true);
              }}
            >
              <boxGeometry args={[4.2, 2.5, 0.4]} />
              <meshStandardMaterial
                color={isActive ? "hsl(174, 72%, 56%)" : "hsl(222, 47%, 14%)"}
                emissive={isActive ? "hsl(174, 72%, 56%)" : "hsl(222, 47%, 14%)"}
                emissiveIntensity={isActive ? 0.22 : 0.06}
                metalness={0.4}
                roughness={0.42}
                transparent
                opacity={0.9}
              />
            </mesh>
            <Text
              position={[0, 0, 0.25]}
              fontSize={0.32}
              color={isActive ? "hsl(222, 47%, 6%)" : "hsl(210, 40%, 98%)"}
              maxWidth={3.6}
              anchorX="center"
              anchorY="middle"
            >
              {card.title}
            </Text>
          </RigidBody>
        );
      })}
    </Physics>
  );
}
