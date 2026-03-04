import { useMemo, useState } from "react";
import { Sphere, Text } from "@react-three/drei";
import { Vector3 } from "three";
import { LANDING_PALETTE, PORTAL_NODES } from "../config";
import type { LandingChapterId } from "../types";

interface PortalNodesProps {
  activeChapter: LandingChapterId;
  onSelectChapter: (id: LandingChapterId) => void;
  onFocusChapter: (id: LandingChapterId, focusPoint: Vector3) => void;
  onBlurChapter: () => void;
  disabled: boolean;
}

export function PortalNodes({
  activeChapter,
  onSelectChapter,
  onFocusChapter,
  onBlurChapter,
  disabled,
}: PortalNodesProps) {
  const [hoveredChapter, setHoveredChapter] = useState<LandingChapterId | null>(null);

  const nodes = useMemo(() => PORTAL_NODES, []);

  return (
    <group>
      {nodes.map((node) => {
        const isActive = activeChapter === node.id;
        const isHovered = hoveredChapter === node.id;
        const emissiveIntensity = isActive ? 0.95 : isHovered ? 0.7 : 0.4;

        return (
          <group key={node.id} position={node.position}>
            <Sphere
              args={[0.68, 18, 18]}
              onPointerEnter={() => {
                if (disabled) return;
                setHoveredChapter(node.id);
                onFocusChapter(node.id, new Vector3(...node.position));
              }}
              onPointerLeave={() => {
                if (disabled) return;
                setHoveredChapter(null);
                onBlurChapter();
              }}
              onClick={() => {
                if (disabled) return;
                onSelectChapter(node.id);
              }}
            >
              <meshStandardMaterial
                color={isActive ? LANDING_PALETTE.primary : LANDING_PALETTE.backgroundMid}
                emissive={isActive ? LANDING_PALETTE.secondary : LANDING_PALETTE.accent}
                emissiveIntensity={emissiveIntensity}
                roughness={0.36}
                metalness={0.52}
              />
            </Sphere>

            <Text
              position={[0, -1.18, 0]}
              fontSize={0.35}
              color={isActive ? LANDING_PALETTE.primary : LANDING_PALETTE.textSoft}
              anchorX="center"
              anchorY="middle"
            >
              {node.label}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
