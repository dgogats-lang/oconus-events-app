import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand ────────────────────────────────────────────────────────────
        brand: {
          navy: "#0C2340",   // Primary brand — headings, active tab, primary pills
          gold: "#D4A853",   // Warm accent — meet callouts, highlights
          red:  "#D92D27",   // Destructive / alert
        },

        // ── Surfaces ─────────────────────────────────────────────────────────
        surface: {
          page:  "#EEF2F7",  // App background (replaces bg-gray-50)
          card:  "#FFFFFF",  // Card / white panel background
          raised:"#F8FAFC",  // Subtly elevated rows, hover states
          chip:  "#F1F5F9",  // Filter chips, tags, secondary pills
        },

        // ── Ink (text) ───────────────────────────────────────────────────────
        ink: {
          DEFAULT:       "#0C2340",  // Headings, strong labels (= brand.navy)
          secondary:     "#64748B",  // Body text, descriptions
          muted:         "#94A3B8",  // Timestamps, eyebrow labels, hints
          inverse:       "#FFFFFF",  // Text on navy backgrounds
          "inverse-muted":"#7AAACF", // Muted text on navy (nav labels, sub-stats)
        },

        // ── Lines (borders & dividers) ────────────────────────────────────────
        line: {
          DEFAULT: "#E2E8F0",  // Card borders
          subtle:  "#F1F5F9",  // Row dividers inside cards
          strong:  "#CBD5E1",  // Emphasized borders
        },

        // ── Status ────────────────────────────────────────────────────────────
        status: {
          "ok-bg":     "#EAF3DE",  // Confirmed / success backgrounds
          "ok-text":   "#3B6D11",  // Confirmed / success text
          "warn-bg":   "#FEF3C7",  // Warning / pending backgrounds
          "warn-text": "#B45309",  // Warning / pending text
          "gold-bg":   "#FBF4E4",  // Meet callout background (light surfaces)
          "gold-text": "#D4A853",  // Meet callout text (= brand.gold)
        },

        // ── Legacy alias (keep for backward compat — prefer surface.chip) ────
        chip: "#F1F5F9",
      },

      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },

      borderRadius: {
        // Named aliases on top of Tailwind defaults
        card:   "1rem",    // rounded-2xl equivalent — all cards
        panel:  "0.75rem", // rounded-xl — inner panels, callouts
        pill:   "9999px",  // rounded-full — all pills
      },
    },
  },
  plugins: [],
};

export default config;
