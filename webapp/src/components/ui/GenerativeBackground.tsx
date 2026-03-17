'use client';

import React from 'react';

export default function GenerativeBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#f8f9fc] pointer-events-none">
      {/* 
        SVG Noise Overlay for Premium Texture 
        Creates a subtle grainy film-like effect common in 2026 UI trends.
      */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.03] mix-blend-overlay z-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>

      {/* 
        Generative Mesh Gradients 
        These blur elements slowly pulse and float to create a dynamic, institutional, yet "smart" AI feel.
      */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-blue-300/40 to-indigo-400/20 blur-[120px] mix-blend-multiply animate-mesh animation-delay-0"></div>
      
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-purple-300/30 to-blue-400/30 blur-[150px] mix-blend-multiply animate-mesh animation-delay-2000"></div>
      
      <div className="absolute top-[30%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-r from-cyan-200/20 to-teal-300/20 blur-[100px] mix-blend-multiply animate-mesh" style={{ animationDelay: '4s' }}></div>
      
      {/* 
        Subtle Grid Overlay
        Gives a slight technical / blueprint feel underneath the glassmorphism.
      */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px] z-0"></div>
    </div>
  );
}
