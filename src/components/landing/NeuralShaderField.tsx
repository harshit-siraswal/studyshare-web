import { useEffect, useRef } from "react";
import * as THREE from "three";

interface NeuralShaderFieldProps {
  className?: string;
}

export function NeuralShaderField({ className }: NeuralShaderFieldProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2(0.72, 0.34) },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uPointer;
        varying vec2 vUv;

        float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        mat2 rotate(float a) {
          float s = sin(a);
          float c = cos(a);
          return mat2(c, -s, s, c);
        }

        void main() {
          vec2 uv = vUv;
          vec2 p = (uv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
          float t = uTime * 0.21;

          vec2 pointer = (uPointer - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
          float pointerGlow = exp(-6.8 * pow(length(p - pointer), 1.3));

          float flow = 0.0;
          for (int i = 0; i < 4; i++) {
            float fi = float(i);
            vec2 q = p * (1.25 + fi * 0.35);
            q *= rotate(t * (0.12 + fi * 0.05));
            q += vec2(sin(t * (0.7 + fi * 0.1)), cos(t * (0.53 + fi * 0.16))) * 0.22;
            float n = noise(q * 1.9 + t * (0.5 + fi * 0.08));
            flow += sin((q.x + q.y * 0.8) * 3.4 + n * 4.0 + t * 2.5 + fi * 0.8) * 0.22;
          }

          float band = 0.5 + 0.5 * sin(flow * 4.1 + t * 2.2);
          float mist = noise(p * 2.2 - t * 0.3) * 0.6 + noise(p * 4.9 + t * 0.6) * 0.4;

          vec3 base = vec3(0.016, 0.048, 0.078);
          vec3 emerald = vec3(0.112, 0.905, 0.582);
          vec3 cyan = vec3(0.141, 0.701, 0.953);
          vec3 amber = vec3(0.973, 0.768, 0.227);

          vec3 color = base;
          color += emerald * (band * 0.34 + mist * 0.06);
          color += cyan * ((1.0 - band) * 0.24 + mist * 0.09);
          color += amber * pow(max(0.0, sin((p.x * 4.0 - p.y * 2.8) - t * 1.8)), 4.0) * 0.18;
          color += emerald * pointerGlow * 0.42;
          color += cyan * pointerGlow * 0.25;

          float vignette = smoothstep(1.32, 0.36, length(p));
          color *= vignette + 0.2;

          gl_FragColor = vec4(color, 0.95);
        }
      `,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mountNode.clientWidth, mountNode.clientHeight);
    mountNode.appendChild(renderer.domElement);

    const pointerTarget = new THREE.Vector2(0.72, 0.34);
    const pointerCurrent = pointerTarget.clone();

    const onPointerMove = (event: MouseEvent) => {
      pointerTarget.set(event.clientX / window.innerWidth, 1 - event.clientY / window.innerHeight);
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 0) return;
      const touch = event.touches[0];
      pointerTarget.set(touch.clientX / window.innerWidth, 1 - touch.clientY / window.innerHeight);
    };

    const resize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      renderer.setSize(width, height);
      uniforms.uResolution.value.set(width, height);
    };

    const clock = new THREE.Clock();
    let frameId = 0;
    const render = () => {
      uniforms.uTime.value = clock.getElapsedTime();
      pointerCurrent.lerp(pointerTarget, 0.06);
      uniforms.uPointer.value.copy(pointerCurrent);
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(render);
    };

    resize();
    render();

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);

      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();

      if (mountNode.contains(renderer.domElement)) {
        mountNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}
