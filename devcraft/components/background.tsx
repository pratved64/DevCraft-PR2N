"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// --- SHADERS ---
// (Vertex shader remains simple)
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// (Fragment shader with improved lighting and fluid physics)
const fragmentShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform float uHoverState;
  
  varying vec2 vUv;

  // --- NOISE UTILS ---
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 st) {
    float value = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amp * snoise(st);
      st *= 2.0;
      amp *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;
    
    // Fix aspect ratio so ripples are circular
    float aspect = uResolution.x / uResolution.y;
    uv.x *= aspect;
    
    vec2 mouse = uMouse;
    mouse.x *= aspect;
    
    // --- INTERACTION ---
    float dist = distance(uv, mouse);
    // Gravity well radius
    float strength = smoothstep(0.15, 0.0, dist);
    
    // --- FLUID PHYSICS ---
    float t = uTime * 0.15;
    
    // Layer 1 (Base Flow)
    vec2 q = vec2(0.);
    q.x = fbm(uv + 0.05 * t);
    q.y = fbm(uv + vec2(1.0) - 0.05 * t);

    // Layer 2 (Turbulence)
    vec2 r = vec2(0.);
    // The uHoverState adds "chaos" to the second layer when moving fast
    r.x = fbm(uv + 1.0 * q + vec2(1.7, 9.2) + 0.15 * t + (strength * 1.5 * uHoverState));
    r.y = fbm(uv + 1.0 * q + vec2(8.3, 2.8) + 0.126 * t);

    float f = fbm(uv + r);

  // --- NORDIC DEEP COLORS ---
vec3 c1 = vec3(0.02, 0.04, 0.06); // Dark Slate
vec3 c2 = vec3(0.1, 0.25, 0.22);  // Muted Emerald/Teal
vec3 c3 = vec3(0.7, 0.85, 0.8);   // Frosted Mint Highlight

    vec3 col = mix(c1, c2, smoothstep(0.0, 0.6, f));
    col = mix(col, c3, smoothstep(0.6, 1.1, f));

    // --- LIGHTING ---
    // Bump map normals
    float n1 = fbm(uv + r + vec2(0.01, 0.0));
    float n2 = fbm(uv + r + vec2(0.0, 0.01));
    vec3 normal = normalize(vec3(n1 - f, n2 - f, 0.1));
    
    // Specular shine
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    
    col += vec3(0.6) * spec;

    // --- POST PROCESSING ---
    // Chromatic aberration at edges of ripples
    float aber = strength * 0.015 * uHoverState;
    col.r += fbm(uv + r - aber) * 0.15;
    col.b += fbm(uv + r + aber) * 0.15;

    // Vignette
    col *= 1.0 - smoothstep(0.4, 1.5, length(vUv - 0.5));
    
    gl_FragColor = vec4(col, 1.0);
  }
`;

const FluidPlane = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const { viewport, size } = useThree();

    // We use references to track mouse state without re-rendering
    const mouseRef = useRef({ x: 0.5, y: 0.5 });
    const mouseSpeedRef = useRef(0);
    const lastMousePos = useRef({ x: 0.5, y: 0.5 });

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2(0.5, 0.5) },
            uResolution: { value: new THREE.Vector2(size.width, size.height) },
            uHoverState: { value: 0 },
        }),
        [size]
    );

    // GLOBAL EVENT LISTENER
    // This ensures we track the mouse even over HTML buttons/navbar
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Normalize to 0..1 (UV coordinates)
            // (0,0) bottom-left in standard GL, but we usually want (0,0) top-left match for UI
            // Here we map: x=0..1, y=1..0 to match WebGL Texture coords
            mouseRef.current.x = e.clientX / window.innerWidth;
            mouseRef.current.y = 1.0 - (e.clientY / window.innerHeight);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    useFrame((state) => {
        if (meshRef.current) {
            const material = meshRef.current.material as THREE.ShaderMaterial;
            material.uniforms.uTime.value = state.clock.getElapsedTime();

            // --- CALCULATE VELOCITY ---
            const dx = mouseRef.current.x - lastMousePos.current.x;
            const dy = mouseRef.current.y - lastMousePos.current.y;
            // Distance moved this frame
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Add impulse to speed
            mouseSpeedRef.current += dist * 15.0; // Sensitivity
            // Decay speed (friction)
            mouseSpeedRef.current *= 0.95;

            // Update uniforms
            // 1. Smoothly move the liquid focal point to mouse position
            material.uniforms.uMouse.value.lerp(
                new THREE.Vector2(mouseRef.current.x, mouseRef.current.y),
                0.1 // Drag/Latency
            );

            // 2. Update turbulence intensity
            material.uniforms.uHoverState.value = THREE.MathUtils.lerp(
                material.uniforms.uHoverState.value,
                Math.min(mouseSpeedRef.current, 1.0),
                0.1
            );

            // Store position for next frame velocity calc
            lastMousePos.current = { ...mouseRef.current };
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
                zIndex: -1,
                // Critical: Allows clicks to pass through to your UI
                pointerEvents: "none",
                background: "#020617",
            }}
        >
            <Canvas
                camera={{ position: [0, 0, 1] }}
                dpr={[1, 2]}
                gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
            >
                <FluidPlane />
            </Canvas>
        </div>
    );
};

export default Background;