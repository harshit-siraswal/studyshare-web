import { useRef } from "react";
import { Color, Mesh, Vector2 } from "three";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import type { PerformanceTier } from "../types";

interface DepthEnvironmentProps {
  pointer: Vector2;
  tier: PerformanceTier;
}

export function DepthEnvironment({ pointer, tier }: DepthEnvironmentProps) {
  const nearLayerRef = useRef<Mesh>(null);
  const midLayerRef = useRef<Mesh>(null);
  const farLayerRef = useRef<Mesh>(null);

  useFrame(() => {
    if (nearLayerRef.current) {
      nearLayerRef.current.position.x = pointer.x * 0.8;
      nearLayerRef.current.position.y = pointer.y * 0.45;
    }
    if (midLayerRef.current) {
      midLayerRef.current.position.x = pointer.x * 0.45;
      midLayerRef.current.position.y = pointer.y * 0.25;
    }
    if (farLayerRef.current) {
      farLayerRef.current.position.x = pointer.x * 0.22;
      farLayerRef.current.position.y = pointer.y * 0.15;
    }
  });

  return (
    <group>
      <ambientLight intensity={0.35} />
      <pointLight position={[7, 9, 6]} intensity={1.05} color={new Color("hsl(174, 72%, 56%)")} />
      <pointLight position={[-6, 5, -8]} intensity={0.7} color={new Color("hsl(262, 83%, 68%)")} />
      <hemisphereLight intensity={0.45} color={"hsl(210, 40%, 98%)"} groundColor={"hsl(222, 47%, 8%)"} />

      <mesh ref={farLayerRef} position={[0, 0, -18]} rotation={[0.1, 0.2, 0]}>
        <planeGeometry args={[120, 60]} />
        <meshBasicMaterial color={"hsl(222, 47%, 8%)"} transparent opacity={0.7} />
      </mesh>

      <mesh ref={midLayerRef} position={[2, -1.2, -10]} rotation={[0.05, -0.2, 0]}>
        <planeGeometry args={[74, 42]} />
        <meshBasicMaterial color={"hsl(174, 72%, 56%)"} transparent opacity={0.07} />
      </mesh>

      <mesh ref={nearLayerRef} position={[-2, 1.2, -4]} rotation={[-0.03, 0.15, 0]}>
        <planeGeometry args={[44, 28]} />
        <meshBasicMaterial color={"hsl(262, 83%, 68%)"} transparent opacity={0.08} />
      </mesh>

      {tier !== "low" && (
        <Stars
          radius={120}
          depth={40}
          count={tier === "high" ? 2400 : 1300}
          factor={4}
          saturation={0}
          fade
          speed={0.5}
        />
      )}
    </group>
  );
}
