"use client";

import React from "react";

/**
 * DELIBERATE CANARY PAGE FOR HARNESS SELF-VERIFICATION (H1)
 * This page intentionally contains violations of G1, G2, G3, G4, D2, and D4
 * to prove that the test harness correctly detects every type of defect.
 */
export default function CanaryTestPage() {
  return (
    <div className="p-6 space-y-8 min-h-screen">
      <h1 className="text-xl font-bold">Harness Self-Verification Canary Page</h1>
      <p className="text-xs text-neutral-500">
        Intentional defects below. The test runner MUST detect every single one.
      </p>

      {/* G1 Violation: Forces document horizontal overflow */}
      <div
        id="canary-g1"
        data-canary="G1"
        style={{ width: "3000px", height: "4px", background: "#ff0000" }}
      />

      {/* G2 Violation: Extends past the right edge of viewport */}
      <div
        id="canary-g2"
        data-canary="G2"
        style={{
          position: "relative",
          left: "90vw",
          width: "350px",
          height: "20px",
          background: "#ff5500",
        }}
      />

      {/* G3 Violation: Card boundary containment failure */}
      <div
        id="canary-g3-parent"
        data-canary="G3-parent"
        style={{
          width: "200px",
          height: "60px",
          border: "2px solid red",
          position: "relative",
        }}
      >
        <div
          id="canary-g3-child"
          data-canary="G3"
          style={{
            position: "absolute",
            top: "80px",
            left: "50px",
            width: "180px",
            height: "40px",
            background: "#ffa0a0",
          }}
        >
          Overflowing text escaping parent card
        </div>
      </div>

      {/* G4 Violation: Overlapping siblings on same container */}
      <div
        id="canary-g4-container"
        data-canary="G4-container"
        style={{ position: "relative", height: "120px" }}
      >
        <div
          id="canary-g4-card1"
          data-canary="G4-1"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "150px",
            height: "100px",
            background: "rgba(255, 0, 0, 0.4)",
          }}
        >
          Card 1
        </div>
        <div
          id="canary-g4-card2"
          data-canary="G4-2"
          style={{
            position: "absolute",
            top: "20px",
            left: "50px",
            width: "150px",
            height: "100px",
            background: "rgba(0, 0, 255, 0.4)",
          }}
        >
          Card 2 (Intersects Card 1)
        </div>
      </div>

      {/* D2 Violation: Off-palette unapproved hex color */}
      <div
        id="canary-d2"
        data-canary="D2"
        style={{ color: "#8A2BE2", backgroundColor: "#FF007F", padding: "8px" }}
      >
        Off-palette Neon Color
      </div>

      {/* D4 Violation: Invalid currency formatting */}
      <div id="canary-d4" data-canary="D4" className="text-sm">
        Invalid currency: Rs. 150000.00
      </div>
    </div>
  );
}

