import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { colors } from "../theme";
import { fonts } from "../fonts";

const techItems = [
  { name: "Solana", desc: "On-chain identity & payments" },
  { name: "Anchor", desc: "Smart contract framework" },
  { name: "Next.js + Supabase", desc: "Frontend & API layer" },
  { name: "Claude AI", desc: "Agent inference engine" },
  { name: "Solana Agent Kit", desc: "60+ blockchain operations" },
];

export const Scene6_TechStack: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const headerY = spring({ frame, fps, from: 30, to: 0, durationInFrames: 20 });
  const lineScaleX = interpolate(frame, [10, 40], [0, 1], { extrapolateRight: "clamp" });

  // Fade out
  const fadeOut = interpolate(frame, [190, 210], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.foreground,
        padding: "100px 200px",
        opacity: fadeOut,
      }}
    >
      {/* Header */}
      <div style={{ opacity: headerOpacity, transform: `translateY(${headerY}px)` }}>
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            color: colors.foregroundMuted,
            marginBottom: 12,
          }}
        >
          Under the Hood
        </div>
        <div
          style={{
            fontFamily: fonts.serif,
            fontSize: 64,
            fontStyle: "italic",
            color: colors.background,
            lineHeight: 1.1,
          }}
        >
          Tech <span style={{ color: colors.accent }}>Stack</span>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          width: "100%",
          height: 2,
          backgroundColor: colors.accent,
          transform: `scaleX(${lineScaleX})`,
          transformOrigin: "left",
          marginTop: 32,
          marginBottom: 48,
        }}
      />

      {/* Tech items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {techItems.map((item, i) => {
          const delay = 30 + i * 15;
          const opacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp" });
          const x = spring({ frame: Math.max(0, frame - delay), fps, from: -30, to: 0, durationInFrames: 20 });

          return (
            <div key={i}>
              <div
                style={{
                  opacity,
                  transform: `translateX(${x}px)`,
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  padding: "24px 0",
                }}
              >
                <div
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 28,
                    fontWeight: 500,
                    color: colors.background,
                  }}
                >
                  {item.name}
                </div>
                <div
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 18,
                    color: colors.foregroundMuted,
                  }}
                >
                  {item.desc}
                </div>
              </div>
              {i < techItems.length - 1 && (
                <div
                  style={{
                    height: 1,
                    backgroundColor: colors.foregroundMuted,
                    opacity: opacity * 0.3,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
