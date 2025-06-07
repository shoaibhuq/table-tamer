"use client";

import { Theme } from "@/lib/themes";

interface ThemedBackgroundProps {
  theme: Theme;
}

export function ThemedBackground({ theme }: ThemedBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base orbs for all themes */}
      {theme.decorations?.orbs && (
        <>
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-white/10 to-white/5 rounded-full blur-xl animate-pulse"></div>
          <div
            className="absolute top-32 right-20 w-48 h-48 bg-gradient-to-r from-white/8 to-white/3 rounded-full blur-2xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-white/10 to-white/5 rounded-full blur-xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </>
      )}

      {/* Particles */}
      {theme.decorations?.particles && (
        <>
          <div
            className="absolute top-1/4 left-1/3 w-2 h-2 bg-white/20 rounded-full animate-bounce"
            style={{ animationDelay: "0.5s" }}
          ></div>
          <div
            className="absolute top-2/3 right-1/4 w-1 h-1 bg-white/15 rounded-full animate-bounce"
            style={{ animationDelay: "1.5s" }}
          ></div>
          <div
            className="absolute bottom-1/3 left-1/5 w-3 h-3 bg-white/20 rounded-full animate-bounce"
            style={{ animationDelay: "2.5s" }}
          ></div>
        </>
      )}

      {/* Enchanted Garden Flora */}
      {theme.decorations?.flora && (
        <>
          {/* Floating leaves */}
          <div className="absolute top-20 left-20 text-4xl opacity-30 flora-leaf">
            🍃
          </div>
          <div
            className="absolute top-40 right-32 text-3xl opacity-25 flora-leaf"
            style={{ animationDelay: "1s" }}
          >
            🌿
          </div>
          <div
            className="absolute bottom-32 left-16 text-5xl opacity-20 flora-leaf"
            style={{ animationDelay: "2s" }}
          >
            🍃
          </div>

          {/* Floating flowers */}
          <div className="absolute top-1/3 right-1/5 text-3xl opacity-40 flora-flower">
            🌸
          </div>
          <div
            className="absolute bottom-1/4 right-1/3 text-2xl opacity-35 flora-flower"
            style={{ animationDelay: "1.5s" }}
          >
            🌺
          </div>
          <div
            className="absolute top-2/3 left-1/4 text-4xl opacity-30 flora-flower"
            style={{ animationDelay: "3s" }}
          >
            🌼
          </div>

          {/* Vine-like decorations */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-green-300/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-emerald-300/20 to-transparent"></div>
        </>
      )}

      {/* Geometric shapes for elegant themes */}
      {theme.decorations?.shapes && (
        <>
          <div className="absolute top-16 right-16 w-8 h-8 bg-white/10 rotate-45 animate-pulse"></div>
          <div
            className="absolute bottom-24 left-24 w-6 h-6 bg-white/8 rounded-full animate-pulse"
            style={{ animationDelay: "0.8s" }}
          ></div>
          <div
            className="absolute top-1/2 right-1/6 w-4 h-16 bg-white/6 rounded-full animate-pulse"
            style={{ animationDelay: "1.8s" }}
          ></div>

          {/* Sparkle effects for golden theme */}
          {theme.id === "golden-elegance" && (
            <>
              <div className="absolute top-1/4 left-1/6 text-2xl opacity-60 animate-sparkle">
                ✨
              </div>
              <div
                className="absolute bottom-1/3 right-1/5 text-xl opacity-50 animate-sparkle"
                style={{ animationDelay: "1s" }}
              >
                ⭐
              </div>
              <div
                className="absolute top-3/4 left-1/3 text-3xl opacity-40 animate-sparkle"
                style={{ animationDelay: "2s" }}
              >
                💫
              </div>
            </>
          )}
        </>
      )}

      {/* Ocean wave effects */}
      {theme.id === "ocean-breeze" && (
        <>
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-cyan-900/20 to-transparent animate-wave"></div>
          <div
            className="absolute bottom-8 left-0 w-full h-16 bg-gradient-to-t from-blue-800/15 to-transparent animate-wave"
            style={{ animationDelay: "1s" }}
          ></div>

          {/* Wave icons */}
          <div className="absolute bottom-20 left-1/4 text-3xl opacity-30 animate-wave">
            🌊
          </div>
          <div
            className="absolute bottom-16 right-1/3 text-2xl opacity-25 animate-wave"
            style={{ animationDelay: "0.5s" }}
          >
            💧
          </div>
        </>
      )}

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50"></div>
    </div>
  );
}
