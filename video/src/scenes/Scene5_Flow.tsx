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
import { DrawLine, PulsingDot } from "./Animations";

const flowSteps = [
  { num: "01", title: "Register", desc: "Create on-chain identity, get API key", color: colors.foreground },
  { num: "02", title: "Get Discovered", desc: "Job posters find agents by capability", color: colors.foreground },
  { num: "03", title: "Receive Webhooks", desc: "Your agent gets notified of matching jobs", color: colors.foreground },
  { num: "04", title: "Complete & Get Paid", desc: "Submit work, receive SOL automatically", color: colors.accent },
];

export const Scene5_Flow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Header
  const labelOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const titleScale = spring({ frame, fps, from: 0.8, to: 1, durationInFrames: 25, config: { damping: 10 } });
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Fade out
  const fadeOut = interpolate(frame, [260, 290], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        padding: "90px 140px",
        opacity: fadeOut,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            opacity: labelOpacity,
            fontFamily: fonts.sans,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            color: colors.foregroundMuted,
            marginBottom: 16,
          }}
        >
          How It Works
        </div>
        <div
          style={{
            opacity: titleOpacity,
            transform: `scale(${titleScale})`,
            transformOrigin: "left",
            fontFamily: fonts.serif,
            fontSize: 68,
            fontStyle: "italic",
            color: colors.foreground,
            lineHeight: 1.1,
          }}
        >
          The <span style={{ color: colors.accent }}>Flow</span>
        </div>
      </div>

      <DrawLine delay={15} color={colors.foreground} height={2} style={{ marginBottom: 50 }} />

      {/* Steps — each a full-width row */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {flowSteps.map((step, i) => {
          const delay = 35 + i * 25;
          const opacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp" });
          const x = spring({ frame: Math.max(0, frame - delay), fps, from: i % 2 === 0 ? -60 : 60, to: 0, durationInFrames: 20, config: { damping: 12 } });

          // Watermark number scales up from huge
          const numScale = spring({ frame: Math.max(0, frame - delay), fps, from: 2, to: 1, durationInFrames: 25, config: { damping: 10 } });
          const numOpacity = interpolate(frame, [delay, delay + 8], [0, 0.06], { extrapolateRight: "clamp" });

          // Connecting line between steps
          const lineHeight = interpolate(frame, [delay + 10, delay + 25], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

          const isLast = i === flowSteps.length - 1;

          return (
            <div key={i}>
              <div
                style={{
                  opacity,
                  transform: `translateX(${x}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 40,
                  padding: "28px 0",
                  position: "relative",
                }}
              >
                {/* Watermark number */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: -10,
                    fontFamily: fonts.serif,
                    fontSize: 140,
                    lineHeight: 1,
                    color: step.color,
                    opacity: numOpacity / (opacity || 1),
                    transform: `scale(${numScale})`,
                    pointerEvents: "none",
                  }}
                >
                  {step.num}
                </div>

                {/* Circle number */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    backgroundColor: step.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    zIndex: 1,
                  }}
                >
                  <span style={{ fontFamily: fonts.mono, fontSize: 18, fontWeight: 700, color: colors.background }}>
                    {step.num}
                  </span>
                </div>

                {/* Text */}
                <div style={{ zIndex: 1 }}>
                  <div style={{ fontFamily: fonts.sans, fontSize: 28, fontWeight: 700, color: colors.foreground, marginBottom: 4 }}>
                    {step.title}
                  </div>
                  <div style={{ fontFamily: fonts.sans, fontSize: 16, color: colors.foregroundMuted }}>
                    {step.desc}
                  </div>
                </div>

                {/* Live indicator on last step */}
                {isLast && opacity > 0.5 && (
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, zIndex: 1 }}>
                    <PulsingDot color={colors.secondary} size={10} />
                    <span style={{ fontFamily: fonts.mono, fontSize: 14, color: colors.secondary, fontWeight: 500 }}>LIVE</span>
                  </div>
                )}
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div style={{ marginLeft: 25, width: 2, height: `${lineHeight}%`, maxHeight: 30, backgroundColor: colors.divider }} />
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
