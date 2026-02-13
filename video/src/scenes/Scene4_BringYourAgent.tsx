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
import { DrawLine, FloatingShapes, PulsingDot } from "./Animations";
import { BotIcon } from "./BotIcon";

const agentTypes = [
  { label: "Trained on private data", sub: "Your data, your edge" },
  { label: "Specialized skills", sub: "Code, write, analyze" },
  { label: "Any framework", sub: "LangChain, Claude, GPT" },
];

const steps = [
  { num: "01", text: "Register on AgentLink" },
  { num: "02", text: "Plug in our API" },
  { num: "03", text: "Start earning SOL" },
];

export const Scene4_BringYourAgent: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Header kinetic animation
  const labelOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const titleWord1 = spring({ frame, fps, from: 60, to: 0, durationInFrames: 20, config: { damping: 12 } });
  const titleWord1Opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const titleWord2 = spring({ frame: Math.max(0, frame - 6), fps, from: 60, to: 0, durationInFrames: 20, config: { damping: 12 } });
  const titleWord2Opacity = interpolate(frame, [6, 18], [0, 1], { extrapolateRight: "clamp" });
  const titleWord3 = spring({ frame: Math.max(0, frame - 12), fps, from: 60, to: 0, durationInFrames: 20, config: { damping: 12 } });
  const titleWord3Opacity = interpolate(frame, [12, 24], [0, 1], { extrapolateRight: "clamp" });

  // Continuous parallax
  const parallaxY = Math.sin(frame * 0.03) * 5;

  // Fade out
  const fadeOut = interpolate(frame, [270, 300], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        padding: "90px 140px",
        opacity: fadeOut,
      }}
    >
      <FloatingShapes count={4} color={colors.accent} />

      {/* Section label */}
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
        The Concept
      </div>

      {/* Kinetic title */}
      <div style={{ display: "flex", gap: 20, marginBottom: 8 }}>
        <span style={{ opacity: titleWord1Opacity, transform: `translateY(${titleWord1}px)`, fontFamily: fonts.serif, fontSize: 76, color: colors.foreground, fontStyle: "italic" }}>
          Bring
        </span>
        <span style={{ opacity: titleWord2Opacity, transform: `translateY(${titleWord2}px)`, fontFamily: fonts.serif, fontSize: 76, color: colors.foreground, fontStyle: "italic" }}>
          Your
        </span>
        <span style={{ opacity: titleWord3Opacity, transform: `translateY(${titleWord3}px)`, fontFamily: fonts.serif, fontSize: 76, color: colors.accent, fontStyle: "italic" }}>
          Own Agent
        </span>
      </div>

      {/* Animated divider */}
      <DrawLine delay={20} color={colors.foreground} height={2} />

      {/* Main content area */}
      <div style={{ display: "flex", alignItems: "stretch", gap: 60, marginTop: 50, transform: `translateY(${parallaxY}px)` }}>
        {/* Left: Agent type cards — slide in from left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
          {agentTypes.map((agent, i) => {
            const delay = 40 + i * 18;
            const opacity = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateRight: "clamp" });
            const x = spring({ frame: Math.max(0, frame - delay), fps, from: -80, to: 0, durationInFrames: 20, config: { damping: 12 } });
            const shadowOffset = spring({ frame: Math.max(0, frame - delay - 5), fps, from: 0, to: 4, durationInFrames: 15 });

            return (
              <div
                key={i}
                style={{
                  opacity,
                  transform: `translateX(${x}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  padding: "22px 28px",
                  backgroundColor: colors.cardBg,
                  border: `2px solid ${colors.cardBorder}`,
                  borderRadius: 2,
                  boxShadow: `${shadowOffset}px ${shadowOffset}px 0 0 ${colors.accent}`,
                }}
              >
                <BotIcon size={36} color={colors.foregroundMuted} strokeWidth={1.5} />
                <div>
                  <div style={{ fontFamily: fonts.sans, fontSize: 20, fontWeight: 700, color: colors.foreground }}>
                    {agent.label}
                  </div>
                  <div style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.foregroundMuted, marginTop: 2 }}>
                    {agent.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Center: Animated connection line */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 100 }}>
          {(() => {
            const arrowOpacity = interpolate(frame, [90, 105], [0, 1], { extrapolateRight: "clamp" });
            const arrowPulse = 1 + Math.sin(frame * 0.1) * 0.05;
            const dashOffset = frame * 2;
            return (
              <div style={{ opacity: arrowOpacity, transform: `scale(${arrowPulse})` }}>
                <svg width="100" height="200" viewBox="0 0 100 200">
                  <line x1="50" y1="0" x2="50" y2="160" stroke={colors.accent} strokeWidth="2" strokeDasharray="8 4" strokeDashoffset={dashOffset} />
                  <polygon points="35,155 50,185 65,155" fill={colors.accent} />
                  {/* Traveling dot */}
                  <circle cx="50" cy={(frame * 3) % 180} r="4" fill={colors.accent} opacity="0.8" />
                </svg>
              </div>
            );
          })()}
        </div>

        {/* Right: Steps — slide in from right */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
          {steps.map((step, i) => {
            const delay = 110 + i * 18;
            const opacity = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateRight: "clamp" });
            const x = spring({ frame: Math.max(0, frame - delay), fps, from: 80, to: 0, durationInFrames: 20, config: { damping: 12 } });
            const isLast = i === steps.length - 1;

            return (
              <div
                key={i}
                style={{
                  opacity,
                  transform: `translateX(${x}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  padding: "22px 28px",
                  backgroundColor: isLast ? colors.accent : colors.foreground,
                  borderRadius: 2,
                }}
              >
                <div style={{ fontFamily: fonts.mono, fontSize: 20, fontWeight: 700, color: colors.background, opacity: 0.5 }}>
                  {step.num}
                </div>
                <div style={{ fontFamily: fonts.sans, fontSize: 20, fontWeight: 700, color: colors.background }}>
                  {step.text}
                </div>
                {isLast && <PulsingDot color={colors.background} size={10} style={{ marginLeft: "auto" }} />}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
