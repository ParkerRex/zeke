import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "media", // or 'class' for manual control
  theme: {
    extend: {
      colors: {
        // Mozilla Neon Brand Colors
        "moz-cyan": "var(--color-moz-neon-blue)",
        "moz-green": "var(--color-moz-neon-green)",
        "moz-yellow": "var(--color-moz-lemon-yellow)",
        "moz-red": "var(--color-moz-warm-red)",
        "moz-purple": "var(--color-moz-dark-purple)",
        "moz-dark-green": "var(--color-moz-dark-green)",
        "moz-dark-blue": "var(--color-moz-dark-blue)",

        // Primary color scale
        primary: {
          50: "var(--color-blue-50)",
          100: "var(--color-blue-100)",
          200: "var(--color-blue-200)",
          300: "var(--color-blue-300)",
          400: "var(--color-blue-400)",
          500: "var(--color-blue-500)",
          600: "var(--color-blue-600)",
          700: "var(--color-blue-700)",
          800: "var(--color-blue-800)",
          900: "var(--color-blue-900)",
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-foreground)",
        },

        // Secondary color scale (Violet)
        secondary: {
          50: "var(--color-violet-50)",
          100: "var(--color-violet-100)",
          200: "var(--color-violet-200)",
          300: "var(--color-violet-300)",
          400: "var(--color-violet-400)",
          500: "var(--color-violet-500)",
          600: "var(--color-violet-600)",
          700: "var(--color-violet-700)",
          800: "var(--color-violet-800)",
          900: "var(--color-violet-900)",
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-secondary-foreground)",
        },

        // Green scale
        green: {
          50: "var(--color-green-50)",
          100: "var(--color-green-100)",
          200: "var(--color-green-200)",
          300: "var(--color-green-300)",
          400: "var(--color-green-400)",
          500: "var(--color-green-500)",
          600: "var(--color-green-600)",
          700: "var(--color-green-700)",
          800: "var(--color-green-800)",
          900: "var(--color-green-900)",
        },

        // Purple scale
        purple: {
          50: "var(--color-purple-50)",
          100: "var(--color-purple-100)",
          200: "var(--color-purple-200)",
          300: "var(--color-purple-300)",
          400: "var(--color-purple-400)",
          500: "var(--color-purple-500)",
          600: "var(--color-purple-600)",
          700: "var(--color-purple-700)",
          800: "var(--color-purple-800)",
          900: "var(--color-purple-900)",
        },

        // Red scale
        red: {
          50: "var(--color-red-50)",
          100: "var(--color-red-100)",
          200: "var(--color-red-200)",
          300: "var(--color-red-300)",
          400: "var(--color-red-400)",
          500: "var(--color-red-500)",
          600: "var(--color-red-600)",
          700: "var(--color-red-700)",
          800: "var(--color-red-800)",
          900: "var(--color-red-900)",
        },

        // Yellow scale
        yellow: {
          50: "var(--color-yellow-50)",
          100: "var(--color-yellow-100)",
          200: "var(--color-yellow-200)",
          300: "var(--color-yellow-300)",
          400: "var(--color-yellow-400)",
          500: "var(--color-yellow-500)",
          600: "var(--color-yellow-600)",
          700: "var(--color-yellow-700)",
          800: "var(--color-yellow-800)",
          900: "var(--color-yellow-900)",
        },

        // Gray scales
        gray: {
          50: "var(--color-light-gray-50)",
          100: "var(--color-light-gray-100)",
          200: "var(--color-light-gray-200)",
          300: "var(--color-light-gray-300)",
          400: "var(--color-light-gray-400)",
          500: "var(--color-light-gray-500)",
          600: "var(--color-light-gray-600)",
          700: "var(--color-light-gray-700)",
          800: "var(--color-light-gray-800)",
          900: "var(--color-light-gray-900)",
        },

        "dark-gray": {
          50: "var(--color-dark-gray-50)",
          100: "var(--color-dark-gray-100)",
          200: "var(--color-dark-gray-200)",
          300: "var(--color-dark-gray-300)",
          400: "var(--color-dark-gray-400)",
          500: "var(--color-dark-gray-500)",
          600: "var(--color-dark-gray-600)",
          700: "var(--color-dark-gray-700)",
          800: "var(--color-dark-gray-800)",
          900: "var(--color-dark-gray-900)",
        },

        // Semantic colors
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        card: "var(--color-card)",
        "card-foreground": "var(--color-card-foreground)",
        border: "var(--color-border)",
        input: "var(--color-input)",
        ring: "var(--color-ring)",

        // Semantic states
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",

        // Link colors
        link: "var(--color-link)",
        "link-hover": "var(--color-link-hover)",
      },

      fontFamily: {
        "mozilla-headline": ["var(--font-heading)"],
        "mozilla-text": ["var(--font-body)"],
        firefox: ["var(--font-firefox)"],
        heading: ["var(--font-heading)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },

      fontSize: {
        // Mozilla type scale with responsive sizing
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1.16" }],
        "6xl": ["3.75rem", { lineHeight: "1.1" }],
        "7xl": ["4.5rem", { lineHeight: "1.1" }],
        "8xl": ["6rem", { lineHeight: "1" }],
        "9xl": ["8rem", { lineHeight: "1" }],

        // Display sizes for Mozilla Headline
        "display-xs": ["2rem", { lineHeight: "1.3", letterSpacing: "-0.02em" }],
        "display-sm": [
          "2.5rem",
          { lineHeight: "1.2", letterSpacing: "-0.02em" },
        ],
        "display-md": ["3rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        "display-lg": ["4rem", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
        "display-xl": ["5rem", { lineHeight: "1", letterSpacing: "-0.03em" }],
        "display-2xl": ["6rem", { lineHeight: "1", letterSpacing: "-0.03em" }],
      },

      spacing: {
        // Component spacing (small units)
        "0.5": "var(--spacing-xs)",
        "1": "var(--spacing-xs)",
        "1.5": "calc(var(--spacing-xs) * 1.5)",
        "2": "var(--spacing-sm)",
        "2.5": "calc(var(--spacing-sm) * 1.25)",
        "3": "calc(var(--spacing-sm) * 1.5)",
        "3.5": "calc(var(--spacing-sm) * 1.75)",
        "4": "var(--spacing-md)",
        "5": "calc(var(--spacing-md) * 1.25)",
        "6": "var(--spacing-lg)",
        "7": "calc(var(--spacing-lg) * 1.17)",
        "8": "var(--spacing-xl)",
        "9": "calc(var(--spacing-xl) * 1.125)",
        "10": "calc(var(--spacing-xl) * 1.25)",
        "11": "calc(var(--spacing-xl) * 1.375)",
        "12": "var(--spacing-2xl)",

        // Layout spacing (large units)
        "14": "calc(var(--layout-2xs) * 3.5)",
        "16": "var(--layout-lg)",
        "18": "calc(var(--layout-lg) * 1.125)",
        "20": "calc(var(--layout-lg) * 1.25)",
        "24": "var(--layout-xl)",
        "28": "calc(var(--layout-xl) * 1.17)",
        "32": "calc(var(--layout-xl) * 1.33)",
        "36": "calc(var(--layout-xl) * 1.5)",
        "40": "calc(var(--layout-xl) * 1.67)",
        "44": "calc(var(--layout-xl) * 1.83)",
        "48": "var(--layout-2xl)",
        "52": "calc(var(--layout-2xl) * 1.08)",
        "56": "calc(var(--layout-2xl) * 1.17)",
        "60": "calc(var(--layout-2xl) * 1.25)",
        "64": "calc(var(--layout-2xl) * 1.33)",
        "72": "calc(var(--layout-2xl) * 1.5)",
        "80": "calc(var(--layout-2xl) * 1.67)",
        "88": "calc(var(--layout-2xl) * 1.83)",
        "96": "calc(var(--layout-2xl) * 2)",
      },

      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "calc(var(--radius-lg) * 1.5)",
        "2xl": "calc(var(--radius-lg) * 2)",
        "3xl": "calc(var(--radius-lg) * 3)",
      },

      boxShadow: {
        "mozilla-sm":
          "0 8px 12px 1px rgba(29, 17, 51, .04), 0 3px 16px 2px rgba(9, 32, 77, .12), 0 5px 10px -3px rgba(29, 17, 51, .12)",
        "mozilla-md":
          "0 16px 24px 2px rgba(29, 17, 51, .04), 0 6px 32px 4px rgba(9, 32, 77, .12), 0 8px 12px -5px rgba(29, 17, 51, .12)",
        "mozilla-lg":
          "0 24px 38px 3px rgba(29, 17, 51, .04), 0 10px 48px 8px rgba(9, 32, 77, .12), 0 12px 16px -6px rgba(29, 17, 51, .12)",
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        DEFAULT:
          "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
        none: "none",
      },

      animation: {
        "fade-in": "fadeIn var(--transition-slow) ease-out",
        "slide-up": "slideUp var(--transition-base) ease-out",
        "scale-in": "scaleIn var(--transition-fast) ease-out",
        "spin-slow": "spin 3s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-slow": "bounce 2s infinite",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },

      screens: {
        xs: "320px",
        sm: "480px",
        md: "768px",
        lg: "1024px",
        xl: "1312px",
        "2xl": "1536px",
      },

      maxWidth: {
        "content-xs": "var(--content-xs)",
        "content-sm": "var(--content-sm)",
        "content-md": "var(--content-md)",
        "content-lg": "var(--content-lg)",
        "content-xl": "var(--content-xl)",
        "content-max": "var(--content-max)",
      },

      transitionDuration: {
        fast: "150ms",
        base: "200ms",
        slow: "300ms",
        slower: "500ms",
      },

      transitionTimingFunction: {
        in: "cubic-bezier(0.4, 0, 1, 1)",
        out: "cubic-bezier(0, 0, 0.2, 1)",
        "in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [
    // Add any necessary plugins here
    // Example: require('@tailwindcss/forms'),
    // Example: require('@tailwindcss/typography'),
  ],
};

export default config;
