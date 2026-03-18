import { useMemo, useRef } from "react";
import { Color, ShaderMaterial, type Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import { Icosahedron, Line } from "@react-three/drei";
import { LANDING_PALETTE } from "../config";
import type { PerformanceTier } from "../types";

interface NeuralCoreProps {
  pointerX: number;
  pointerY: number;
  tier: PerformanceTier;
}

export function NeuralCore({ pointerX, pointerY, tier }: NeuralCoreProps) {
  const meshRef = useRef<Mesh>(null);
  const ringRef = useRef<Mesh>(null);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        uniforms: {
          uTime: { value: 0 },
          uPrimary: { value: new Color(LANDING_PALETTE.primary) },
          uAccent: { value: new Color(LANDING_PALETTE.secondary) },
          uWarm: { value: new Color(LANDING_PALETTE.accent) },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uPrimary;
          uniform vec3 uAccent;
          uniform vec3 uWarm;
          varying vec3 vNormal;
          varying vec3 vPosition;

          void main() {
            float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.1);
            float wave = 0.5 + 0.5 * sin(uTime * 1.45 + vPosition.y * 2.3);
            vec3 cool = mix(uPrimary, uAccent, 0.5 + 0.5 * sin(uTime * 0.75 + vPosition.x * 1.8));
            vec3 finalColor = mix(cool, uWarm, fresnel * 0.3);
            gl_FragColor = vec4(finalColor * (0.64 + wave * 0.36), 0.88);
          }
        `,
      }),
    [],
  );

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
      meshRef.current.rotation.x = pointerY * 0.12;
      meshRef.current.rotation.z = pointerX * 0.09;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.22;
      ringRef.current.rotation.y -= delta * 0.16;
    }
    material.uniforms.uTime.value += delta;
  });

  const detailLevel = tier === "high" ? 8 : tier === "medium" ? 7 : 6;

  return (
    <group position={[0, 0.8, 0]}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.52, detailLevel]} />
        <primitive object={material} attach="material" />
      </mesh>

      <mesh ref={ringRef} rotation={[Math.PI / 2.6, 0, 0]}>
        <torusGeometry args={[2.3, 0.035, 18, 120]} />
        <meshBasicMaterial color={LANDING_PALETTE.primary} transparent opacity={0.6} />
      </mesh>

      <mesh rotation={[Math.PI / 2.2, 0.45, 0.7]}>
        <torusGeometry args={[2.72, 0.018, 14, 90]} />
        <meshBasicMaterial color={LANDING_PALETTE.secondary} transparent opacity={0.34} />
      </mesh>

      <Line
        points={[
          [-1.65, -0.48, 0.26],
          [0.12, 1.72, -0.35],
          [1.52, -0.42, 0.21],
        ]}
        color={LANDING_PALETTE.accent}
        lineWidth={1}
        transparent
        opacity={0.35}
      />

      <Icosahedron args={[0.075, 1]} position={[1.2, 1.02, 0.85]}>
        <meshStandardMaterial
          color={LANDING_PALETTE.primary}
          emissive={LANDING_PALETTE.primary}
          emissiveIntensity={0.42}
        />
      </Icosahedron>
    </group>
  );
}
