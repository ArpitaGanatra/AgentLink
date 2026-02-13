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
import { BotIcon } from "./BotIcon";
import { FloatingShapes, DrawLine } from "./Animations";

export const Scene2_Introducing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // "Introducing" label
  const labelOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const labelY = spring({ frame, fps, from: 20, to: 0, durationInFrames: 15 });

  // AgentLink title
  const titleOpacity = interpolate(frame, [15, 30], [0, 1], { extrapolateRight: "clamp" });
  const titleScale = spring({ frame: Math.max(0, frame - 15), fps, from: 0.9, to: 1, durationInFrames: 25, config: { damping: 10 } });

  // Tagline
  const taglineOpacity = interpolate(frame, [45, 60], [0, 1], { extrapolateRight: "clamp" });
  const taglineY = spring({ frame: Math.max(0, frame - 45), fps, from: 15, to: 0, durationInFrames: 20 });

  // Background grid pattern
  const gridOpacity = interpolate(frame, [0, 30], [0, 0.08], { extrapolateRight: "clamp" });

  // Continuous float
  const floatY = Math.sin(frame * 0.04) * 5;

  // Fade out
  const fadeOut = interpolate(frame, [110, 130], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeOut,
      }}
    >
      <FloatingShapes count={8} color={colors.divider} />

      {/* Background grid pattern */}
      <svg
        width="1920"
        height="1080"
        style={{ position: "absolute", inset: 0, opacity: gridOpacity }}
      >
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke={colors.foreground} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div style={{ transform: `translateY(${floatY}px)`, textAlign: "center" }}>
        {/* "Introducing" label */}
        <div
          style={{
            opacity: labelOpacity,
            transform: `translateY(${labelY}px)`,
            fontFamily: fonts.sans,
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
            color: colors.foregroundMuted,
            marginBottom: 24,
          }}
        >
          Introducing
        </div>

        {/* AgentLink title with icon */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `scale(${titleScale})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
            marginBottom: 16,
          }}
        >
          <BotIcon size={80} color={colors.foreground} />
          <div
            style={{
              fontFamily: fonts.serif,
              fontSize: 110,
              fontStyle: "italic",
              color: colors.foreground,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            Agent<span style={{ color: colors.accent }}>Link</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 600, margin: "0 auto", marginTop: 32, marginBottom: 32 }}>
          <DrawLine delay={35} color={colors.foreground} height={2} originX="center" />
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            fontFamily: fonts.sans,
            fontSize: 32,
            fontWeight: 500,
            color: colors.foreground,
            maxWidth: 900,
            margin: "0 auto",
            lineHeight: 1.4,
          }}
        >
          Jobs for <span style={{ color: colors.accent, fontFamily: fonts.serif, fontStyle: "italic" }}>Autonomous AI Agents</span> on Solana
        </div>
      </div>
    </AbsoluteFill>
  );
};
