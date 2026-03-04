import { useMemo, useRef } from "react";
import { Color, ShaderMaterial, type Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import { Icosahedron, Line, Trail } from "@react-three/drei";
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
          uPrimary: { value: new Color("hsl(174, 72%, 56%)") },
          uAccent: { value: new Color("hsl(262, 83%, 68%)") },
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
          varying vec3 vNormal;
          varying vec3 vPosition;

          void main() {
            float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.3);
            float pulse = 0.58 + 0.42 * sin(uTime * 1.7 + vPosition.y * 3.2);
            vec3 color = mix(uPrimary, uAccent, 0.5 + 0.5 * sin(uTime * 0.7 + vPosition.x * 2.1));
            color += fresnel * 0.35;
            gl_FragColor = vec4(color * pulse, 0.85);
          }
        `,
      }),
    [],
  );

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.22;
      meshRef.current.rotation.x = pointerY * 0.16;
      meshRef.current.rotation.z = pointerX * 0.14;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.3;
      ringRef.current.rotation.y -= delta * 0.22;
    }
    material.uniforms.uTime.value += delta;
  });

  const detailLevel = tier === "high" ? 9 : tier === "medium" ? 8 : 7;

  return (
    <group position={[0, 0.8, 0]}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.65, detailLevel]} />
        <primitive object={material} attach="material" />
      </mesh>

      <mesh ref={ringRef} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[2.4, 0.03, 24, 160]} />
        <meshBasicMaterial color={"hsl(174, 72%, 56%)"} transparent opacity={0.65} />
      </mesh>

      <mesh rotation={[Math.PI / 2.4, 0.4, 0.8]}>
        <torusGeometry args={[2.75, 0.02, 24, 150]} />
        <meshBasicMaterial color={"hsl(262, 83%, 68%)"} transparent opacity={0.38} />
      </mesh>

      <Trail
        width={1.2}
        length={8}
        color={"hsl(174, 72%, 56%)"}
        attenuation={(trailWidth) => trailWidth}
        decay={2.5}
      >
        <mesh position={[2.2, 0.4, 0]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshBasicMaterial color={"hsl(174, 72%, 56%)"} />
        </mesh>
      </Trail>

      <Line
        points={[
          [-1.8, -0.6, 0.3],
          [0.1, 1.9, -0.4],
          [1.6, -0.5, 0.2],
        ]}
        color={"hsl(262, 83%, 68%)"}
        lineWidth={1}
        transparent
        opacity={0.4}
      />

      <Icosahedron args={[0.07, 1]} position={[1.3, 1.1, 0.9]}>
        <meshStandardMaterial color={"hsl(174, 72%, 56%)"} emissive={"hsl(174, 72%, 56%)"} emissiveIntensity={0.5} />
      </Icosahedron>
    </group>
  );
}
