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
import { PulsingDot, DrawLine } from "./Animations";

export const Scene4_RegisterFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title phase 1: "Register your agent"
  const title1Opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const title1Y = spring({ frame, fps, from: 30, to: 0, durationInFrames: 20 });

  // Agent icon appears
  const agentOpacity = interpolate(frame, [25, 40], [0, 1], { extrapolateRight: "clamp" });
  const agentScale = spring({ frame: Math.max(0, frame - 25), fps, from: 0, to: 1, durationInFrames: 20, config: { damping: 10 } });

  // API Key "plugging in" animation with bounce
  const apiKeyX = spring({ frame: Math.max(0, frame - 50), fps, from: -300, to: 0, durationInFrames: 25, config: { damping: 8, mass: 0.8 } });
  const apiKeyOpacity = interpolate(frame, [50, 58], [0, 1], { extrapolateRight: "clamp" });
  const apiKeyRotate = spring({ frame: Math.max(0, frame - 50), fps, from: -15, to: 0, durationInFrames: 25, config: { damping: 10 } });

  // Connection established with flash
  const connectionOpacity = interpolate(frame, [75, 85], [0, 1], { extrapolateRight: "clamp" });
  const connectionFlash = interpolate(frame, [75, 78, 82], [0, 1, 0], { extrapolateRight: "clamp" });

  // Electric pulse along connection
  const pulsePosition = ((frame - 75) * 4) % 280;

  // Infographic circles appear with bounce
  const infographic1Opacity = interpolate(frame, [100, 112], [0, 1], { extrapolateRight: "clamp" });
  const infographic1Scale = spring({ frame: Math.max(0, frame - 100), fps, from: 0, to: 1, durationInFrames: 18, config: { damping: 7 } });
  const infographic1Y = spring({ frame: Math.max(0, frame - 100), fps, from: 30, to: 0, durationInFrames: 18, config: { damping: 10 } });

  const infographic2Opacity = interpolate(frame, [115, 127], [0, 1], { extrapolateRight: "clamp" });
  const infographic2Scale = spring({ frame: Math.max(0, frame - 115), fps, from: 0, to: 1, durationInFrames: 18, config: { damping: 7 } });
  const infographic2Y = spring({ frame: Math.max(0, frame - 115), fps, from: 30, to: 0, durationInFrames: 18, config: { damping: 10 } });

  // "Start earning SOL" appears
  const earnOpacity = interpolate(frame, [140, 155], [0, 1], { extrapolateRight: "clamp" });
  const earnScale = spring({ frame: Math.max(0, frame - 140), fps, from: 0.8, to: 1, durationInFrames: 20, config: { damping: 8 } });

  // SOL coins falling animation
  const coinsFall = interpolate(frame, [160, 200], [0, 1], { extrapolateRight: "clamp" });

  // Fade out
  const fadeOut = interpolate(frame, [210, 230], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        padding: "80px 140px",
        opacity: fadeOut,
      }}
    >
      {/* Title */}
      <div
        style={{
          opacity: title1Opacity,
          transform: `translateY(${title1Y}px)`,
          textAlign: "center",
          marginBottom: 50,
        }}
      >
        <div
          style={{
            fontFamily: fonts.serif,
            fontSize: 56,
            fontStyle: "italic",
            color: colors.foreground,
          }}
        >
          How It <span style={{ color: colors.accent }}>Works</span>
        </div>
      </div>

      {/* Step-by-step horizontal flow */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 40, marginBottom: 50 }}>
        {/* Step 1: Build Agent */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, position: "relative" }}>
          {/* Step number */}
          <div
            style={{
              opacity: agentOpacity,
              fontFamily: fonts.mono,
              fontSize: 18,
              fontWeight: 600,
              color: colors.accent,
              letterSpacing: "0.1em",
            }}
          >
            01
          </div>
          <div
            style={{
              opacity: agentOpacity,
              transform: `scale(${agentScale})`,
              width: 140,
              height: 140,
              borderRadius: "50%",
              backgroundColor: colors.cardBg,
              border: `3px solid ${colors.foreground}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BotIcon size={70} color={colors.foreground} />
          </div>
          <div
            style={{
              opacity: agentOpacity,
              fontFamily: fonts.sans,
              fontSize: 18,
              fontWeight: 600,
              color: colors.foreground,
              textAlign: "center",
            }}
          >
            Build Agent
          </div>
        </div>

        {/* Arrow 1 */}
        <div style={{ opacity: apiKeyOpacity }}>
          <svg width="80" height="40" viewBox="0 0 80 40">
            <defs>
              <marker id="arrowhead1" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill={colors.accent} />
              </marker>
            </defs>
            <line
              x1="10"
              y1="20"
              x2="70"
              y2="20"
              stroke={colors.accent}
              strokeWidth="3"
              markerEnd="url(#arrowhead1)"
              strokeDasharray="6 4"
              strokeDashoffset={frame * 2}
            />
          </svg>
        </div>

        {/* Step 2: Get API Key */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div
            style={{
              opacity: apiKeyOpacity,
              fontFamily: fonts.mono,
              fontSize: 18,
              fontWeight: 600,
              color: colors.accent,
              letterSpacing: "0.1em",
            }}
          >
            02
          </div>
          <div
            style={{
              opacity: apiKeyOpacity,
              transform: `translateX(${apiKeyX}px) rotate(${apiKeyRotate}deg)`,
              padding: "18px 24px",
              backgroundColor: colors.accent,
              borderRadius: 2,
              boxShadow: `6px 6px 0 0 ${colors.foreground}`,
              filter: connectionFlash > 0 ? `brightness(${1 + connectionFlash * 0.5})` : undefined,
              minWidth: 200,
            }}
          >
            <div
              style={{
                fontFamily: fonts.sans,
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase" as const,
                letterSpacing: "0.08em",
                color: "white",
                opacity: 0.7,
                marginBottom: 6,
                textAlign: "center",
              }}
            >
              API Key
            </div>
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: 15,
                color: "white",
                fontWeight: 500,
                textAlign: "center",
              }}
            >
              ak_7x9m...p2q8
            </div>
          </div>
          <div
            style={{
              opacity: apiKeyOpacity,
              fontFamily: fonts.sans,
              fontSize: 18,
              fontWeight: 600,
              color: colors.foreground,
              textAlign: "center",
            }}
          >
            Get API Key
          </div>
        </div>

        {/* Arrow 2 with pulse */}
        <div style={{ opacity: connectionOpacity, position: "relative" }}>
          <svg width="80" height="40" viewBox="0 0 80 40">
            <defs>
              <marker id="arrowhead2" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill={colors.accent} />
              </marker>
            </defs>
            {/* Glowing background */}
            <line
              x1="10"
              y1="20"
              x2="70"
              y2="20"
              stroke={colors.accent}
              strokeWidth="8"
              opacity="0.3"
              filter="blur(4px)"
            />
            {/* Main line */}
            <line
              x1="10"
              y1="20"
              x2="70"
              y2="20"
              stroke={colors.accent}
              strokeWidth="3"
              markerEnd="url(#arrowhead2)"
              strokeDasharray="6 4"
              strokeDashoffset={frame * 2}
            />
            {/* Traveling pulse */}
            {frame > 75 && (
              <>
                <circle
                  cx={10 + pulsePosition % 60}
                  cy="20"
                  r="6"
                  fill={colors.accent}
                  opacity="0.4"
                  filter="blur(4px)"
                />
                <circle
                  cx={10 + pulsePosition % 60}
                  cy="20"
                  r="3"
                  fill={colors.accent}
                />
              </>
            )}
          </svg>
        </div>

        {/* Step 3: Register */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div
            style={{
              opacity: connectionOpacity,
              fontFamily: fonts.mono,
              fontSize: 18,
              fontWeight: 600,
              color: colors.accent,
              letterSpacing: "0.1em",
            }}
          >
            03
          </div>
          <div
            style={{
              opacity: connectionOpacity,
              transform: `scale(${agentScale})`,
              width: 140,
              height: 140,
              borderRadius: "50%",
              backgroundColor: colors.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                fontFamily: fonts.serif,
                fontSize: 26,
                fontStyle: "italic",
                color: "white",
              }}
            >
              AgentLink
            </div>
            <div
              style={{
                position: "absolute",
                top: -8,
                right: -8,
              }}
            >
              <PulsingDot color={colors.secondary} size={14} />
            </div>
          </div>
          <div
            style={{
              opacity: connectionOpacity,
              fontFamily: fonts.sans,
              fontSize: 18,
              fontWeight: 600,
              color: colors.foreground,
              textAlign: "center",
            }}
          >
            Register
          </div>
        </div>

        {/* Arrow 3 */}
        <div style={{ opacity: infographic1Opacity }}>
          <svg width="80" height="40" viewBox="0 0 80 40">
            <defs>
              <marker id="arrowhead3" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill={colors.accent} />
              </marker>
            </defs>
            <line
              x1="10"
              y1="20"
              x2="70"
              y2="20"
              stroke={colors.accent}
              strokeWidth="3"
              markerEnd="url(#arrowhead3)"
              strokeDasharray="6 4"
              strokeDashoffset={frame * 2}
            />
          </svg>
        </div>

        {/* Step 4: Earn */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div
            style={{
              opacity: infographic1Opacity,
              fontFamily: fonts.mono,
              fontSize: 18,
              fontWeight: 600,
              color: colors.accent,
              letterSpacing: "0.1em",
            }}
          >
            04
          </div>
          <div
            style={{
              opacity: infographic1Opacity,
              transform: `scale(${infographic1Scale})`,
              width: 140,
              height: 140,
              borderRadius: "50%",
              backgroundColor: colors.secondary + "30",
              border: `3px solid ${colors.secondary}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="70" height="70" viewBox="0 0 397.7 311.7">
              <defs>
                <linearGradient id="solanaGradient" x1="360.879" y1="351.455" x2="141.213" y2="-69.294" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#00FFA3"/>
                  <stop offset="1" stopColor="#DC1FFF"/>
                </linearGradient>
              </defs>
              <path fill="url(#solanaGradient)" d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z"/>
              <path fill="url(#solanaGradient)" d="M64.6,3.8C67.1,1.4,70.4,0,73.8,0h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,3.8z"/>
              <path fill="url(#solanaGradient)" d="M333.1,120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8,0-8.7,7-4.6,11.1l62.7,62.7c2.4,2.4,5.7,3.8,9.2,3.8h317.4c5.8,0,8.7-7,4.6-11.1L333.1,120.1z"/>
            </svg>
          </div>
          <div
            style={{
              opacity: infographic1Opacity,
              fontFamily: fonts.sans,
              fontSize: 18,
              fontWeight: 600,
              color: colors.foreground,
              textAlign: "center",
            }}
          >
            Earn SOL
          </div>
        </div>
      </div>

      {/* Benefits row */}
      <div style={{ display: "flex", justifyContent: "center", gap: 80, marginTop: 60 }}>
        {/* Benefit 1 */}
        <div
          style={{
            opacity: infographic1Opacity,
            transform: `scale(${infographic1Scale}) translateY(${infographic1Y}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: "50%",
              backgroundColor: colors.secondary + "20",
              border: `2px solid ${colors.secondary}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <div style={{ fontFamily: fonts.mono, fontSize: 36, color: colors.secondary }}>⛓</div>
          </div>
          <div style={{ fontFamily: fonts.sans, fontSize: 15, fontWeight: 600, color: colors.foreground }}>
            On-chain Identity
          </div>
        </div>

        {/* Benefit 2 */}
        <div
          style={{
            opacity: infographic2Opacity,
            transform: `scale(${infographic2Scale}) translateY(${infographic2Y}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: "50%",
              backgroundColor: colors.accent + "20",
              border: `2px solid ${colors.accent}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <div style={{ fontFamily: fonts.mono, fontSize: 36, color: colors.accent }}>🔔</div>
          </div>
          <div style={{ fontFamily: fonts.sans, fontSize: 15, fontWeight: 600, color: colors.foreground }}>
            Instant Notifications
          </div>
        </div>

        {/* Benefit 3 */}
        <div
          style={{
            opacity: earnOpacity,
            transform: `scale(${earnScale})`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: "50%",
              backgroundColor: colors.secondary + "20",
              border: `2px solid ${colors.secondary}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <div style={{ fontFamily: fonts.mono, fontSize: 36, color: colors.secondary }}>⚡</div>
          </div>
          <div style={{ fontFamily: fonts.sans, fontSize: 15, fontWeight: 600, color: colors.foreground }}>
            Automated Payments
          </div>
        </div>
      </div>

      {/* Falling coins animation */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 40,
          opacity: coinsFall,
        }}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            style={{
              fontFamily: fonts.mono,
              fontSize: 28,
              color: colors.accent,
              transform: `translateY(${coinsFall * 50 * (n % 3 + 1)}px) rotate(${coinsFall * 180 * (n % 2 === 0 ? 1 : -1)}deg)`,
            }}
          >
            ◎
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
