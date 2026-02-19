"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// --- SHADERS ---

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  
  varying vec2 vUv;

  // --- NOISE & RANDOM ---
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  // 2D Noise
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    // 1. Setup Coordinates & Aspect Ratio
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    uv.x *= aspect;
    vec2 mouse = uMouse;
    mouse.x *= aspect;

    // 2. Base Colors (Dark Cyber Space)
    vec3 bgCol = vec3(0.01, 0.02, 0.03); // Deepest green/black
    vec3 gridCol = vec3(0.13, 0.83, 0.93); // Neon Cyan
    vec3 accentCol = vec3(0.66, 0.33, 0.97); // Neon Purple

    // 3. Fake 3D Perspective (Tilt the UVs backward)
    // We remap Y to create depth
    float depth = clamp(vUv.y, 0.01, 1.0);
    vec2 gridUv = vec2(uv.x / depth, 1.0 / depth);
    
    // Animate the grid moving "forward"
    gridUv.y -= uTime * 0.5;

    // 4. Draw the Grid
    float gridSize = 10.0;
    vec2 gridPos = fract(gridUv * gridSize);
    
    // Smooth grid lines
    float lineThickness = 0.05 * depth; // Lines get thinner in distance
    float lineX = smoothstep(lineThickness, 0.0, gridPos.x) + smoothstep(1.0 - lineThickness, 1.0, gridPos.x);
    float lineY = smoothstep(lineThickness, 0.0, gridPos.y) + smoothstep(1.0 - lineThickness, 1.0, gridPos.y);
    float lines = max(lineX, lineY);

    // 5. Interactive "Radar Ping" around Mouse
    float distToMouse = distance(uv, mouse);
    
    // Pulsing radar ring
    float radarRadius = fract(uTime * 0.5) * 2.0; 
    float radarThickness = 0.05;
    float radar = smoothstep(radarThickness, 0.0, abs(distToMouse - radarRadius));
    // Fade radar out as it gets bigger
    radar *= 1.0 - (radarRadius / 2.0);
    // Only show radar near mouse
    float mouseGlow = smoothstep(0.8, 0.0, distToMouse);
    radar *= mouseGlow;

    // 6. Data Nodes (Random dots that light up near the grid intersections)
    float nodeNoise = noise(floor(gridUv * gridSize));
    // Only show nodes occasionally, and light them up when radar hits them
    float isNode = smoothstep(0.7, 0.8, nodeNoise); 
    float activeNode = isNode * smoothstep(0.2, 0.0, distToMouse) * 2.0;

    // 7. Compose Final Color
    vec3 finalColor = bgCol;
    
    // Add grid (fade out in distance)
    float distanceFade = smoothstep(0.0, 0.5, vUv.y);
    finalColor = mix(finalColor, gridCol * 0.3, lines * distanceFade);
    
    // Add mouse glow
    finalColor += gridCol * mouseGlow * 0.15;
    
    // Add radar ping
    finalColor += gridCol * radar;
    
    // Add Active Nodes
    finalColor += mix(gridCol, accentCol, sin(uTime)*0.5+0.5) * activeNode;

    // 8. Screen Artifacts (CRT Scanlines & Vignette)
    float scanline = sin(vUv.y * 800.0) * 0.02;
    finalColor -= scanline;
    
    // Darken edges
    float vignette = length(vUv - 0.5);
    finalColor *= 1.0 - smoothstep(0.4, 1.2, vignette);

    // Subtle overall noise
    finalColor += random(uv * uTime) * 0.03;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const CyberGrid = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport, size } = useThree();

  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const targetMouseRef = useRef({ x: 0.5, y: 0.5 });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
    }),
    [size]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Map screen coordinates to UV space (0 to 1)
      targetMouseRef.current.x = e.clientX / window.innerWidth;
      // Invert Y because WebGL UV origin is bottom-left, DOM is top-left
      targetMouseRef.current.y = 1.0 - (e.clientY / window.innerHeight);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.getElapsedTime();

      // Smoothly interpolate mouse position for a "laggy/heavy" scanner feel
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * 0.1;
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * 0.1;

      material.uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y);
    }
  });

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={false}
      />
    </mesh>
  );
};

const Background = () => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1, // Keep it behind everything
        pointerEvents: "none", // Let clicks pass through to the UI
        background: "#020502", // Fallback color
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 1] }}
        dpr={[1, 2]} // Optimize for high DPI screens
        gl={{ 
          antialias: false, 
          alpha: false, 
          powerPreference: "high-performance" 
        }}
      >
        <CyberGrid />
      </Canvas>
    </div>
  );
};

export default Background;