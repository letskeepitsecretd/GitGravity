"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface GithubLogo3DProps {
  width?: number;
  height?: number;
  color?: number; // hex color for mesh
  emissive?: number; // hex color for emission glow
  lightColor?: number; // hex color for directional key light
  rimColor?: number; // hex color for rim reflection light
  className?: string;
}

export function GithubLogo3D({
  width = 160,
  height = 160,
  color = 0x22c55e, // green-500
  emissive = 0x052e16, // dark green glow
  lightColor = 0x22c55e, // green key light
  rimColor = 0x10b981, // emerald rim light
  className = ""
}: GithubLogo3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let geometry: THREE.ExtrudeGeometry | null = null;
    let material: THREE.MeshPhysicalMaterial | null = null;
    let animationId: number | null = null;

    try {
      // ── 1. Scene setup ───────────────────────────────────
      const scene = new THREE.Scene();

      // ── 2. Camera setup ──────────────────────────────────
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 0, 4.5);

      // ── 3. Renderer setup ────────────────────────────────
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      containerRef.current.appendChild(renderer.domElement);

      // ── 4. Drawing GitHub Octocat 2D Shape ───────────────
      const shape = new THREE.Shape();
      
      // Starting from top-center edge
      shape.moveTo(0, 0.95);
      
      // Right ear curve
      shape.quadraticCurveTo(0.2, 0.95, 0.35, 1.15); // right ear outer curve
      shape.quadraticCurveTo(0.38, 1.2, 0.42, 1.2);  // ear tip
      shape.lineTo(0.48, 0.88); // inner ear corner
      
      // Right cheek curve
      shape.quadraticCurveTo(0.95, 0.7, 0.95, 0.0);
      shape.quadraticCurveTo(0.95, -0.65, 0.45, -0.9);
      
      // Body/Shoulders
      shape.lineTo(0.35, -0.9);
      shape.quadraticCurveTo(0.25, -1.15, 0.0, -1.15); // bottom center neck
      shape.quadraticCurveTo(-0.25, -1.15, -0.35, -0.9);
      shape.lineTo(-0.45, -0.9);
      
      // Left cheek curve
      shape.quadraticCurveTo(-0.95, -0.65, -0.95, 0.0);
      shape.quadraticCurveTo(-0.95, 0.7, -0.48, 0.88);
      
      // Left ear curve
      shape.lineTo(-0.42, 1.2);
      shape.quadraticCurveTo(-0.38, 1.2, -0.35, 1.15);
      shape.quadraticCurveTo(-0.2, 0.95, 0, 0.95);

      // ── 5. Extrude Geometry ──────────────────────────────
      const extrudeSettings = {
        steps: 1,
        depth: 0.28,
        bevelEnabled: true,
        bevelThickness: 0.04,
        bevelSize: 0.03,
        bevelSegments: 4,
      };
      
      geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geometry.center(); // Center rotation origin

      // ── 6. Material with premium cyberpunk metallic glow ──
      material = new THREE.MeshPhysicalMaterial({
        color: color,
        emissive: emissive,
        roughness: 0.15,
        metalness: 0.9,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        reflectivity: 1.0,
      });

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      // ── 7. Lighting ──────────────────────────────────────
      // Ambient fill
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
      scene.add(ambientLight);

      // Front-Right Green key light
      const keyLight = new THREE.DirectionalLight(lightColor, 2.5);
      keyLight.position.set(3, 4, 3);
      scene.add(keyLight);

      // Back-Left Rim reflection light
      const rimLight = new THREE.DirectionalLight(rimColor, 2.5);
      rimLight.position.set(-3, -2, 2);
      scene.add(rimLight);

      // Subtle front white light for details
      const whiteLight = new THREE.PointLight(0xffffff, 1.5, 10);
      whiteLight.position.set(0, 0, 4);
      scene.add(whiteLight);

      // ── 8. Animation loop ────────────────────────────────
      const startTime = Date.now();

      const animate = () => {
        const elapsedTime = (Date.now() - startTime) * 0.001;

        // Smooth continuous 3D rotation with subtle harmonic wobble
        mesh.rotation.y = elapsedTime * 1.5;
        mesh.rotation.x = Math.sin(elapsedTime * 1.2) * 0.2;
        mesh.rotation.z = Math.cos(elapsedTime * 0.8) * 0.1;

        // Scale pulse in synchronization with rotation
        const pulseScale = 1.0 + Math.sin(elapsedTime * 2.5) * 0.04;
        mesh.scale.set(pulseScale, pulseScale, pulseScale);

        if (renderer) {
          renderer.render(scene, camera);
        }
        animationId = requestAnimationFrame(animate);
      };

      animate();
    } catch (e) {
      console.warn("WebGL is not supported or failed to initialize", e);
      // Fallback: render a pulsing 2D SVG
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <svg role="img" viewBox="0 0 24 24" fill="currentColor" style="width: 80px; height: 80px; color: #22c55e; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
          </svg>
        `;
      }
      return;
    }

    // ── 9. Cleanup ───────────────────────────────────────
    return () => {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
      }
      if (geometry) geometry.dispose();
      if (material) material.dispose();
      if (renderer) renderer.dispose();
      if (containerRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        containerRef.current.innerHTML = "";
      }
    };
  }, [width, height, color, emissive, lightColor, rimColor]);

  return (
    <div 
      ref={containerRef} 
      className={`flex items-center justify-center select-none pointer-events-none ${className}`}
      aria-label="3D Rotating GitHub Logo"
      style={{ width, height }}
    />
  );
}
