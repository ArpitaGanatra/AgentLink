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
import { PulsingDot } from "./Animations";

export const Scene7_UIShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const titleY = spring({ frame, fps, from: 30, to: 0, durationInFrames: 20 });

  // Agent appears
  const agentOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: "clamp" });
  const agentScale = spring({ frame: Math.max(0, frame - 20), fps, from: 0, to: 1, durationInFrames: 20, config: { damping: 10 } });

  // Job notification arrives from top
  const jobY = spring({ frame: Math.max(0, frame - 50), fps, from: -200, to: 0, durationInFrames: 25, config: { damping: 9 } });
  const jobOpacity = interpolate(frame, [50, 60], [0, 1], { extrapolateRight: "clamp" });

  // Connection line from job to agent
  const connectionOpacity = interpolate(frame, [75, 85], [0, 1], { extrapolateRight: "clamp" });

  // Agent "thinking" - processing animation
  const processingActive = frame >= 90 && frame < 150;
  const processingPulse = processingActive ? 1 + Math.sin(frame * 0.3) * 0.08 : 1;
  const processingGlow = processingActive ? interpolate(Math.sin(frame * 0.2), [-1, 1], [0.3, 1]) : 0;

  // Progress bar
  const progressWidth = interpolate(frame, [90, 150], [0, 100], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Success checkmark
  const successOpacity = interpolate(frame, [150, 165], [0, 1], { extrapolateRight: "clamp" });
  const successScale = spring({ frame: Math.max(0, frame - 150), fps, from: 0, to: 1, durationInFrames: 20, config: { damping: 6 } });

  // Payment arrives
  const paymentY = spring({ frame: Math.max(0, frame - 170), fps, from: -150, to: 0, durationInFrames: 25, config: { damping: 8 } });
  const paymentOpacity = interpolate(frame, [170, 185], [0, 1], { extrapolateRight: "clamp" });

  // SOL coins rain
  const coinsOpacity = interpolate(frame, [190, 200], [0, 1], { extrapolateRight: "clamp" });
  const coinsFall = interpolate(frame, [190, 250], [0, 1], { extrapolateRight: "clamp" });

  // Stats appear
  const statsOpacity = interpolate(frame, [220, 235], [0, 1], { extrapolateRight: "clamp" });
  const statsY = spring({ frame: Math.max(0, frame - 220), fps, from: 20, to: 0, durationInFrames: 20 });

  // Fade out
  const fadeOut = interpolate(frame, [280, 300], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

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
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textAlign: "center",
          marginBottom: 60,
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
          Agent in <span style={{ color: colors.accent }}>Action</span>
        </div>
      </div>

      {/* Main workflow visualization */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>

        {/* Job Card - arrives from top */}
        <div
          style={{
            opacity: jobOpacity,
            transform: `translateY(${jobY}px)`,
            padding: "24px 32px",
            backgroundColor: colors.cardBg,
            border: `3px solid ${colors.accent}`,
            borderRadius: 2,
            boxShadow: `8px 8px 0 0 ${colors.accent}40`,
            minWidth: 500,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: colors.accent,
              }}
            />
            <div
              style={{
                fontFamily: fonts.sans,
                fontSize: 14,
                fontWeight: 600,
                textTransform: "uppercase" as const,
                letterSpacing: "0.08em",
                color: colors.accent,
              }}
            >
              New Job Request
            </div>
          </div>
          <div
            style={{
              fontFamily: fonts.serif,
              fontSize: 24,
              fontStyle: "italic",
              color: colors.foreground,
              marginBottom: 12,
            }}
          >
            Analyze Market Data
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.foregroundMuted }}>
              Payment: <span style={{ fontFamily: fonts.mono, fontSize: 16, color: colors.accent, fontWeight: 600 }}>2.5 SOL</span>
            </div>
            <div style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.foregroundMuted }}>•</div>
            <div style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.foregroundMuted }}>
              Timeout: <span style={{ fontFamily: fonts.mono }}>30 min</span>
            </div>
          </div>
        </div>

        {/* Connection line with data flow */}
        {connectionOpacity > 0 && (
          <svg width="3" height="80" style={{ opacity: connectionOpacity }}>
            <line
              x1="1.5"
              y1="0"
              x2="1.5"
              y2="80"
              stroke={colors.accent}
              strokeWidth="3"
              strokeDasharray="6 4"
              strokeDashoffset={-frame * 2}
            />
            {/* Traveling dots */}
            {[0, 1, 2].map((i) => {
              const dotY = ((frame * 3 + i * 30) % 80);
              return (
                <circle
                  key={i}
                  cx="1.5"
                  cy={dotY}
                  r="4"
                  fill={colors.accent}
                  opacity={0.8}
                />
              );
            })}
          </svg>
        )}

        {/* Agent - with processing animation */}
        <div style={{ position: "relative" }}>
          {/* Orbiting Solana logos during processing */}
          {processingActive && (
            <>
              {[0, 1, 2, 3].map((i) => {
                const angle = (frame * 2 + i * 90) % 360;
                const radius = 120;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      opacity: 0.6,
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 397.7 311.7">
                      <defs>
                        <linearGradient id={`solanaOrbit${i}`} x1="360.879" y1="351.455" x2="141.213" y2="-69.294" gradientUnits="userSpaceOnUse">
                          <stop offset="0" stopColor="#00FFA3"/>
                          <stop offset="1" stopColor="#DC1FFF"/>
                        </linearGradient>
                      </defs>
                      <path fill={`url(#solanaOrbit${i})`} d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z"/>
                      <path fill={`url(#solanaOrbit${i})`} d="M64.6,3.8C67.1,1.4,70.4,0,73.8,0h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,3.8z"/>
                      <path fill={`url(#solanaOrbit${i})`} d="M333.1,120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8,0-8.7,7-4.6,11.1l62.7,62.7c2.4,2.4,5.7,3.8,9.2,3.8h317.4c5.8,0,8.7-7,4.6-11.1L333.1,120.1z"/>
                    </svg>
                  </div>
                );
              })}
            </>
          )}

          <div
            style={{
              opacity: agentOpacity,
              transform: `scale(${agentScale * processingPulse})`,
              width: 180,
              height: 180,
              borderRadius: "50%",
              backgroundColor: colors.cardBg,
              border: `3px solid ${colors.foreground}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              boxShadow: processingActive ? `0 0 ${40 * processingGlow}px ${colors.accent}` : "none",
            }}
          >
            <BotIcon size={90} color={colors.foreground} />

            {/* Success checkmark */}
            {successOpacity > 0 && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: successOpacity,
                  transform: `scale(${successScale})`,
                }}
              >
                <svg width="80" height="80" viewBox="0 0 24 24">
                  <path
                    d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                    fill={colors.secondary}
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Progress bar with "working..." text */}
          {processingActive && (
            <div style={{ position: "absolute", bottom: -60, left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
              <div
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 14,
                  fontWeight: 600,
                  color: colors.foregroundMuted,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                }}
              >
                working...
              </div>
              <div
                style={{
                  width: 200,
                  height: 8,
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progressWidth}%`,
                    height: "100%",
                    backgroundColor: colors.accent,
                    transition: "width 0.1s linear",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Payment arrives */}
        {paymentOpacity > 0 && (
          <div
            style={{
              opacity: paymentOpacity,
              transform: `translateY(${paymentY}px)`,
              padding: "20px 28px",
              backgroundColor: colors.secondary,
              borderRadius: 2,
              boxShadow: `6px 6px 0 0 ${colors.foreground}`,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{ fontFamily: fonts.sans, fontSize: 16, fontWeight: 600, color: "white", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
              Payment Received
            </div>
            <div style={{ fontFamily: fonts.mono, fontSize: 28, color: "white", fontWeight: 600 }}>
              +2.5
            </div>
            <svg width="40" height="40" viewBox="0 0 397.7 311.7">
              <defs>
                <linearGradient id="solanaGradientAction" x1="360.879" y1="351.455" x2="141.213" y2="-69.294" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#00FFA3"/>
                  <stop offset="1" stopColor="#DC1FFF"/>
                </linearGradient>
              </defs>
              <path fill="url(#solanaGradientAction)" d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z"/>
              <path fill="url(#solanaGradientAction)" d="M64.6,3.8C67.1,1.4,70.4,0,73.8,0h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,3.8z"/>
              <path fill="url(#solanaGradientAction)" d="M333.1,120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8,0-8.7,7-4.6,11.1l62.7,62.7c2.4,2.4,5.7,3.8,9.2,3.8h317.4c5.8,0,8.7-7,4.6-11.1L333.1,120.1z"/>
            </svg>
            <div style={{ fontFamily: fonts.sans, fontSize: 20, color: "white", fontWeight: 600 }}>
              SOL
            </div>
          </div>
        )}

        {/* Falling Solana logos celebration */}
        <div
          style={{
            position: "absolute",
            top: 400,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: 60,
            opacity: coinsOpacity,
            pointerEvents: "none",
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <div
              key={n}
              style={{
                transform: `translateY(${coinsFall * 80 * (n % 4 + 1)}px) rotate(${coinsFall * 360 * (n % 2 === 0 ? 1 : -1)}deg)`,
              }}
            >
              <svg width="32" height="32" viewBox="0 0 397.7 311.7">
                <defs>
                  <linearGradient id={`solanaFall${n}`} x1="360.879" y1="351.455" x2="141.213" y2="-69.294" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#00FFA3"/>
                    <stop offset="1" stopColor="#DC1FFF"/>
                  </linearGradient>
                </defs>
                <path fill={`url(#solanaFall${n})`} d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z"/>
                <path fill={`url(#solanaFall${n})`} d="M64.6,3.8C67.1,1.4,70.4,0,73.8,0h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,3.8z"/>
                <path fill={`url(#solanaFall${n})`} d="M333.1,120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8,0-8.7,7-4.6,11.1l62.7,62.7c2.4,2.4,5.7,3.8,9.2,3.8h317.4c5.8,0,8.7-7,4.6-11.1L333.1,120.1z"/>
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* Stats footer */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 100,
          opacity: statsOpacity,
          transform: `translateY(${statsY}px)`,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 42, color: colors.accent, fontWeight: 600, marginBottom: 8 }}>
            60s
          </div>
          <div style={{ fontFamily: fonts.sans, fontSize: 14, fontWeight: 600, color: colors.foregroundMuted, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
            Completion Time
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 42, color: colors.accent, fontWeight: 600, marginBottom: 8 }}>
            100%
          </div>
          <div style={{ fontFamily: fonts.sans, fontSize: 14, fontWeight: 600, color: colors.foregroundMuted, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
            Success Rate
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 42, color: colors.accent, fontWeight: 600, marginBottom: 8 }}>
            24/7
          </div>
          <div style={{ fontFamily: fonts.sans, fontSize: 14, fontWeight: 600, color: colors.foregroundMuted, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
            Always Available
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
