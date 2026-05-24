"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function GithubLogo3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    const width = 160;
    const height = 160;

    // ── 1. Scene setup ───────────────────────────────────
    const scene = new THREE.Scene();

    // ── 2. Camera setup ──────────────────────────────────
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.5);

    // ── 3. Renderer setup ────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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
    
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center(); // Center rotation origin

    // ── 6. Material with premium cyberpunk metallic glow ──
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xa855f7, // purple-500
      emissive: 0x2e1065, // dark purple glow
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

    // Front-Right Purple key light
    const purpleLight = new THREE.DirectionalLight(0xa855f7, 2.5);
    purpleLight.position.set(3, 4, 3);
    scene.add(purpleLight);

    // Back-Left Cyan fill light for beautiful rim reflection
    const cyanLight = new THREE.DirectionalLight(0x06b6d4, 2.5);
    cyanLight.position.set(-3, -2, 2);
    scene.add(cyanLight);

    // Subtle front white light for details
    const whiteLight = new THREE.PointLight(0xffffff, 1.5, 10);
    whiteLight.position.set(0, 0, 4);
    scene.add(whiteLight);

    // ── 8. Animation loop ────────────────────────────────
    let animationId: number;
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

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    // ── 9. Cleanup ───────────────────────────────────────
    return () => {
      cancelAnimationFrame(animationId);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (containerRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-40 h-40 flex items-center justify-center select-none pointer-events-none"
      aria-label="3D Rotating GitHub Logo"
    />
  );
}
