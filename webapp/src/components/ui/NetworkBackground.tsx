'use client';

import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Points, PointMaterial, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// Premium Minimalist Canvas Palette:
// Sleek Platinum & Silver
const PRIMARY_COLOR = "#A1A1AA"; // Platinum 400
const ACCENT_COLOR = "#71717A"; // Platinum 500
const SECONDARY_COLOR = "#D4D4D8"; // Marble 300

function CameraRig() {
  const vec = new THREE.Vector3();
  useFrame((state) => {
    state.camera.position.lerp(vec.set(state.pointer.x * 0.5, state.pointer.y * 0.5, 5), 0.02);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

function ParticleSwarm({ count = 5000, color = PRIMARY_COLOR, radiusMultiplier = 1 }) {
  const points = useRef<THREE.Points>(null);

  // Generate a random spatial distribution only once on mount
  const [positions] = useState(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Random spherical distribution
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos((Math.random() * 2) - 1);
      // Radius expands outward thinly - increased dispersion
      const r = (3 + Math.random() * 15) * radiusMultiplier;
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta); // x
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta); // y
      pos[i * 3 + 2] = r * Math.cos(phi); // z
    }
    return pos;
  });

  // Subtle rotation animation based on time
  useFrame((state, delta) => {
    if (points.current) {
      points.current.rotation.x -= delta / 40;
      points.current.rotation.y -= delta / 50;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={points} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color={color}
          size={0.05}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

export default function NetworkBackground() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }} gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}>
          <CameraRig />
          <ambientLight intensity={0.2} />
          
          <Float speed={1.2} rotationIntensity={0.5} floatIntensity={1}>
            {/* Inner dense core */}
            <ParticleSwarm count={4000} color={SECONDARY_COLOR} radiusMultiplier={0.8} />
            {/* Outer sparse majestic platinum halo */}
            <ParticleSwarm count={1500} color={ACCENT_COLOR} radiusMultiplier={1.5} />
            {/* Background distant stars */}
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          </Float>

          <EffectComposer>
            <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.5} />
          </EffectComposer>
        </Canvas>
    </div>
  );
}
