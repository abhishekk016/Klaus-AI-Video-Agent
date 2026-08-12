import React from "react";

const HEIGHTS = [30, 55, 40, 75, 50, 90, 35, 65, 45, 80, 38, 58, 70, 42, 60, 32, 85, 48, 66, 40];

export default function Waveform({ idle = false, label = "SIGNAL", counter = "00:00" }) {
  return (
    <div className={`scope${idle ? " idle" : ""}`}>
      <div className="scope-label">
        <span>{label}</span>
        <span className="scope-counter">{counter}</span>
      </div>
      <div className="bars" aria-hidden="true">
        {HEIGHTS.map((h, i) => (
          <div
            key={i}
            className="bar"
            style={{
              height: `${h}%`,
              animationDelay: `${(i % 7) * 0.09}s`,
            }}
          />
        ))}
      </div>
      <div className="scope-label">
        <span>{idle ? "standing by" : "reading tape"}</span>
        <span>ch. 1 / mono</span>
      </div>
    </div>
  );
}
