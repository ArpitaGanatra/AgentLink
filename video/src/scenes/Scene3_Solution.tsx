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
import { FloatingShapes, DrawLine, CountUp } from "./Animations";

export const Scene3_Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Icon + title fly in from different sides
  const iconX = spring({ frame, fps, from: -200, to: 0, durationInFrames: 25, config: { damping: 12 } });
  const iconOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  const titleX = spring({ frame: Math.max(0, frame - 5), fps, from: 200, to: 0, durationInFrames: 25, config: { damping: 12 } });
  const titleOpacity = interpolate(frame, [5, 15], [0, 1], { extrapolateRight: "clamp" });

  const subtitleOpacity = interpolate(frame, [25, 40], [0, 1], { extrapolateRight: "clamp" });
  const subtitleY = spring({ frame: Math.max(0, frame - 25), fps, from: 20, to: 0, durationInFrames: 15 });

  // Continuous subtle float
  const floatY = Math.sin(frame * 0.05) * 3;

  // Fade out
  const fadeOut = interpolate(frame, [130, 150], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
        padding: 120,
        opacity: fadeOut,
      }}
    >
      <FloatingShapes count={5} color={colors.divider} />

      {/* Icon + Title row */}
      <div style={{ display: "flex", alignItems: "center", gap: 28, transform: `translateY(${floatY}px)` }}>
        <div style={{ opacity: iconOpacity, transform: `translateX(${iconX}px)` }}>
          <BotIcon size={72} color={colors.foreground} />
        </div>
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateX(${titleX}px)`,
            fontFamily: fonts.serif,
            fontSize: 88,
            fontStyle: "italic",
            color: colors.foreground,
            lineHeight: 1,
          }}
        >
          Agent<span style={{ color: colors.accent }}>Link</span>
        </div>
      </div>

      {/* Subtitle */}
      <div
        style={{
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY + floatY}px)`,
          fontFamily: fonts.sans,
          fontSize: 28,
          color: colors.foregroundMuted,
          textAlign: "center",
          marginTop: 16,
          letterSpacing: "0.01em",
        }}
      >
        Identity, Payments & Jobs for Autonomous AI Agents on Solana
      </div>

      {/* Animated divider */}
      <div style={{ marginTop: 48, marginBottom: 48, width: 800 }}>
        <DrawLine delay={35} color={colors.divider} height={2} originX="center" />
      </div>

      {/* Stats with counting animation */}
      <div style={{ display: "flex", gap: 100, alignItems: "center" }}>
        {[
          { value: "100%", label: "On-Chain" },
          { value: "0%", label: "Platform Fee" },
          { value: "∞", label: "Autonomy" },
        ].map((stat, i) => {
          const delay = 50 + i * 10;
          const opacity = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateRight: "clamp" });
          const scale = spring({ frame: Math.max(0, frame - delay), fps, from: 0.5, to: 1, durationInFrames: 15, config: { damping: 8 } });

          return (
            <React.Fragment key={i}>
              {i > 0 && (
                <div
                  style={{
                    width: 1,
                    height: 60,
                    backgroundColor: colors.divider,
                    opacity: interpolate(frame, [delay - 5, delay + 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                  }}
                />
              )}
              <div style={{ textAlign: "center", opacity, transform: `scale(${scale})` }}>
                <div
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 56,
                    fontWeight: 500,
                    color: colors.foreground,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase" as const,
                    color: colors.foregroundMuted,
                    marginTop: 8,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
