import { useMemo, useRef } from "react";
import { Color, Mesh, Vector2 } from "three";
import { useFrame } from "@react-three/fiber";
import { LANDING_PALETTE } from "../config";
import type { PerformanceTier } from "../types";

interface DepthEnvironmentProps {
  pointer: Vector2;
  tier: PerformanceTier;
}

export function DepthEnvironment({ pointer, tier }: DepthEnvironmentProps) {
  const nearLayerRef = useRef<Mesh>(null);
  const midLayerRef = useRef<Mesh>(null);
  const farLayerRef = useRef<Mesh>(null);

  const particleCount = tier === "high" ? 450 : tier === "medium" ? 260 : 120;
  const particlePositions = useMemo(() => {
    const points = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      const i3 = i * 3;
      points[i3] = (Math.random() - 0.5) * 120;
      points[i3 + 1] = (Math.random() - 0.5) * 60;
      points[i3 + 2] = -Math.random() * 90 - 10;
    }
    return points;
  }, [particleCount]);

  useFrame((_, delta) => {
    if (nearLayerRef.current) {
      nearLayerRef.current.position.x = pointer.x * 0.85;
      nearLayerRef.current.position.y = pointer.y * 0.45;
      nearLayerRef.current.rotation.z += delta * 0.01;
    }
    if (midLayerRef.current) {
      midLayerRef.current.position.x = pointer.x * 0.5;
      midLayerRef.current.position.y = pointer.y * 0.26;
      midLayerRef.current.rotation.z -= delta * 0.006;
    }
    if (farLayerRef.current) {
      farLayerRef.current.position.x = pointer.x * 0.25;
      farLayerRef.current.position.y = pointer.y * 0.15;
    }
  });

  return (
    <group>
      <ambientLight intensity={0.3} />
      <pointLight position={[9, 7, 9]} intensity={0.95} color={new Color(LANDING_PALETTE.primary)} />
      <pointLight position={[-8, 4, -5]} intensity={0.75} color={new Color(LANDING_PALETTE.secondary)} />
      <pointLight position={[22, 3, 2]} intensity={0.35} color={new Color(LANDING_PALETTE.accent)} />
      <hemisphereLight intensity={0.42} color={"hsl(210, 40%, 95%)"} groundColor={"hsl(223, 52%, 10%)"} />

      <mesh ref={farLayerRef} position={[0, 0, -28]} rotation={[0.06, 0.12, 0]}>
        <planeGeometry args={[170, 85]} />
        <meshBasicMaterial color={LANDING_PALETTE.backgroundDeep} transparent opacity={0.82} />
      </mesh>

      <mesh ref={midLayerRef} position={[5, -0.8, -16]} rotation={[0.04, -0.18, 0]}>
        <planeGeometry args={[94, 52]} />
        <meshBasicMaterial color={LANDING_PALETTE.secondary} transparent opacity={0.08} />
      </mesh>

      <mesh ref={nearLayerRef} position={[-4, 1.2, -8]} rotation={[-0.04, 0.15, 0]}>
        <planeGeometry args={[58, 34]} />
        <meshBasicMaterial color={LANDING_PALETTE.accent} transparent opacity={0.07} />
      </mesh>

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={LANDING_PALETTE.textSoft}
          size={tier === "high" ? 0.09 : 0.06}
          sizeAttenuation
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
