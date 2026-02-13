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
import { KineticText, PulsingDot } from "./Animations";

export const Scene2_Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Lines stagger in dramatically
  const line1Opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const line1X = spring({ frame, fps, from: -100, to: 0, durationInFrames: 20, config: { damping: 12 } });

  const line2Opacity = interpolate(frame, [20, 28], [0, 1], { extrapolateRight: "clamp" });
  const line2X = spring({ frame: Math.max(0, frame - 20), fps, from: -100, to: 0, durationInFrames: 20, config: { damping: 12 } });

  // Third line is big, dramatic, delayed
  const line3Opacity = interpolate(frame, [50, 60], [0, 1], { extrapolateRight: "clamp" });
  const line3Scale = spring({ frame: Math.max(0, frame - 50), fps, from: 1.3, to: 1, durationInFrames: 20, config: { damping: 8 } });
  const line3Y = spring({ frame: Math.max(0, frame - 50), fps, from: 30, to: 0, durationInFrames: 20 });

  // Strikethrough on first two lines after third appears
  const strikeWidth1 = interpolate(frame, [65, 80], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const strikeWidth2 = interpolate(frame, [70, 85], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Background subtle shift
  const bgShift = interpolate(frame, [0, 120], [0, -20], { extrapolateRight: "clamp" });

  // Fade out
  const fadeOut = interpolate(frame, [105, 120], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.foreground,
        justifyContent: "center",
        padding: "0 180px",
        opacity: fadeOut,
      }}
    >
      {/* Decorative large number */}
      <div
        style={{
          position: "absolute",
          right: 120,
          top: "50%",
          transform: `translateY(${-50 + bgShift}%)`,
          fontFamily: fonts.serif,
          fontSize: 400,
          color: colors.accent,
          opacity: 0.06,
          lineHeight: 1,
          pointerEvents: "none",
        }}
      >
        ?
      </div>

      {/* Line 1 */}
      <div style={{ opacity: line1Opacity, transform: `translateX(${line1X}px)`, marginBottom: 20, position: "relative" }}>
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 52,
            fontWeight: 500,
            color: colors.background,
            lineHeight: 1.3,
          }}
        >
          AI agents can think.
        </div>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            width: `${strikeWidth1}%`,
            height: 3,
            backgroundColor: colors.accent,
            transform: "translateY(-50%)",
          }}
        />
      </div>

      {/* Line 2 */}
      <div style={{ opacity: line2Opacity, transform: `translateX(${line2X}px)`, marginBottom: 32, position: "relative" }}>
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 52,
            fontWeight: 500,
            color: colors.background,
            lineHeight: 1.3,
          }}
        >
          AI agents can code.
        </div>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            width: `${strikeWidth2}%`,
            height: 3,
            backgroundColor: colors.accent,
            transform: "translateY(-50%)",
          }}
        />
      </div>

      {/* Line 3 — the punchline */}
      <div
        style={{
          opacity: line3Opacity,
          transform: `scale(${line3Scale}) translateY(${line3Y}px)`,
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <PulsingDot color={colors.accent} size={16} />
        <div
          style={{
            fontFamily: fonts.serif,
            fontSize: 76,
            fontStyle: "italic",
            color: colors.accent,
            lineHeight: 1.2,
          }}
        >
          But they can't get hired.
        </div>
      </div>
    </AbsoluteFill>
  );
};
