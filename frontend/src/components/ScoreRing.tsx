import { useEffect, useRef, useState } from "react";

interface ScoreRingProps {
  score: number; // 0–100
  size?: number; // px diameter
  strokeWidth?: number;
  label?: string;
  animate?: boolean;
}

/**
 * Animated SVG ring showing a 0–100 score.
 * Uses CSS transition on stroke-dashoffset for smooth entrance.
 * Reduces to opacity-only fade for prefers-reduced-motion.
 */
export default function ScoreRing({
  score,
  size = 120,
  strokeWidth = 8,
  label = "Follow-Through",
  animate = true,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const [offset, setOffset] = useState(circumference);
  const prevScore = useRef(0);

  useEffect(() => {
    const target = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
    if (animate) {
      // Trigger CSS transition by setting new value after a frame
      const raf = requestAnimationFrame(() => {
        setOffset(target);
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setOffset(target);
    }
    prevScore.current = score;
  }, [score, circumference, animate]);

  // Color based on score brackets
  const color =
    score >= 75 ? "oklch(0.65 0.18 160)" // green
    : score >= 50 ? "oklch(0.72 0.15 85)" // amber
    : "oklch(0.58 0.17 25)"; // red

  return (
    <div
      className="score-ring"
      style={{ width: size, height: size, position: "relative" }}
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label}: ${score} out of 100`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="oklch(0.25 0.005 240)"
          strokeWidth={strokeWidth}
        />
        {/* Foreground arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: animate
              ? "stroke-dashoffset 800ms cubic-bezier(0.25, 1, 0.5, 1)"
              : "none",
          }}
        />
      </svg>
      {/* Center label */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontSize: size * 0.22,
            fontWeight: 700,
            lineHeight: 1,
            color,
          }}
        >
          {score}
        </span>
        <span
          style={{
            fontSize: size * 0.1,
            color: "oklch(0.65 0.01 240)",
            marginTop: 2,
          }}
        >
          {label}
        </span>
      </div>

      {/* Reduced motion fallback (CSS handles the switch) */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .score-ring circle:last-child {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}