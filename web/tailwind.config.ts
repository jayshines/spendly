import type { Config } from "tailwindcss";

// Theme colours are CSS variables (space-separated RGB) so they swap with the
// theme and still support opacity modifiers, e.g. bg-accent/10.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        surface: token("surface"),
        "surface-2": token("surface-2"),
        line: token("line"),
        fg: token("fg"),
        muted: token("muted"),
        faint: token("faint"),
        accent: token("accent"),
        "accent-fg": token("accent-fg"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -12px rgb(0 0 0 / 0.08)",
        pop: "0 24px 60px -20px rgb(0 0 0 / 0.35)",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "none" },
        },
        fade: { from: { opacity: "0" }, to: { opacity: "1" } },
        sheet: {
          from: { opacity: "0", transform: "translateY(24px) scale(0.98)" },
          to: { opacity: "1", transform: "none" },
        },
        shimmer: {
          to: { transform: "translateX(100%)" },
        },
      },
      animation: {
        rise: "rise 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both",
        fade: "fade 0.2s ease-out both",
        sheet: "sheet 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) both",
      },
    },
  },
  plugins: [],
};
export default config;
