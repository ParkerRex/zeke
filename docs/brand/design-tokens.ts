// biome-ignore-all lint: example
// Design tokens for type-safe access to Mozilla design system values
export const tokens = {
  colors: {
    // Mozilla Brand Colors
    mozilla: {
      cyan: "#00ffff",
      green: "#54ffbd",
      yellow: "#fff44f",
      red: "#ff4f5e",
      darkPurple: "#6e008b",
      darkGreen: "#005e5e",
      darkBlue: "#00458b",
    },

    // Color Scales
    green: {
      50: "#e3fff3",
      100: "#d1ffee",
      200: "#b3ffe3",
      300: "#88ffd1",
      400: "#54ffbd",
      500: "#3fe1b0",
      600: "#2ac3a2",
      700: "#008787",
      800: "#005e5e",
      900: "#08403f",
    },

    blue: {
      50: "#aaf2ff",
      100: "#80ebff",
      200: "#00ddff",
      300: "#00b3f4",
      400: "#0090ed",
      500: "#0060df",
      600: "#0250bb",
      700: "#054096",
      800: "#073072",
      900: "#09204d",
    },

    violet: {
      50: "#e7dfff",
      100: "#d9bfff",
      200: "#cb9eff",
      300: "#c689ff",
      400: "#ab71ff",
      500: "#9059ff",
      600: "#7542e5",
      700: "#592acb",
      800: "#45278d",
      900: "#321c64",
    },

    purple: {
      50: "#f7e2ff",
      100: "#f6b8ff",
      200: "#f68fff",
      300: "#f770ff",
      400: "#d74cf0",
      500: "#b833e1",
      600: "#952bb9",
      700: "#722291",
      800: "#4e1a69",
      900: "#2b1141",
    },

    red: {
      50: "#ffdfe7",
      100: "#ffbdc5",
      200: "#ff9aa2",
      300: "#ff848b",
      400: "#ff6a75",
      500: "#ff4f5e",
      600: "#e22850",
      700: "#c50042",
      800: "#810220",
      900: "#440306",
    },

    yellow: {
      50: "#ffffcc",
      100: "#ffff98",
      200: "#ffea80",
      300: "#ffd567",
      400: "#ffbd4f",
      500: "#ffa436",
      600: "#e27f2e",
      700: "#c45a27",
      800: "#a7341f",
      900: "#960e18",
    },

    gray: {
      light: {
        50: "#ffffff",
        100: "#f9f9fb",
        200: "#f0f0f4",
        300: "#e0e0e6",
        400: "#cfcfd8",
        500: "#bfbfc9",
        600: "#afafba",
        700: "#9f9fad",
        800: "#8f8f9e",
        900: "#80808f",
      },
      dark: {
        50: "#5b5b66",
        100: "#52525e",
        200: "#4a4a55",
        300: "#42414d",
        400: "#3a3944",
        500: "#32313c",
        600: "#2b2a33",
        700: "#23222b",
        800: "#1c1b22",
        900: "#15141a",
      },
    },

    // Semantic colors
    semantic: {
      background: "#ffffff",
      foreground: "#15141a",
      card: "#ffffff",
      cardForeground: "#15141a",
      border: "#e0e0e6",
      input: "#f9f9fb",
      ring: "#0060df",
      primary: "#0060df",
      primaryForeground: "#ffffff",
      secondary: "#9059ff",
      secondaryForeground: "#ffffff",
      success: "#2ac3a2",
      warning: "#e27f2e",
      error: "#e22850",
      link: "#0060df",
      linkHover: "#0250bb",
      linkVisited: "#b833e1",
      linkVisitedHover: "#952bb9",
    },
  },

  typography: {
    fonts: {
      heading:
        "'Mozilla Headline', 'Inter', system-ui, -apple-system, sans-serif",
      body: "'Mozilla Text', 'Inter', system-ui, -apple-system, sans-serif",
      firefox: "'Metropolis', 'Inter', system-ui, -apple-system, sans-serif",
      mono: "'Consolas', 'Monaco', 'Andale Mono', 'Ubuntu Mono', monospace",
    },

    sizes: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
      "5xl": "3rem", // 48px
      "6xl": "3.75rem", // 60px
      "7xl": "4.5rem", // 72px
      "8xl": "6rem", // 96px
      "9xl": "8rem", // 128px
    },

    lineHeights: {
      none: 1,
      tight: 1.1,
      snug: 1.2,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },

    weights: {
      thin: 100,
      extralight: 200,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
  },

  spacing: {
    // Component-level spacing (small units)
    component: {
      xs: "4px",
      sm: "8px",
      md: "16px",
      lg: "24px",
      xl: "32px",
      "2xl": "48px",
    },

    // Layout-level spacing (large units)
    layout: {
      "2xs": "16px",
      xs: "24px",
      sm: "32px",
      md: "48px",
      lg: "64px",
      xl: "96px",
      "2xl": "192px",
    },

    // Numeric scale for compatibility
    0: "0px",
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    7: "28px",
    8: "32px",
    9: "36px",
    10: "40px",
    11: "44px",
    12: "48px",
    14: "56px",
    16: "64px",
    20: "80px",
    24: "96px",
    28: "112px",
    32: "128px",
    36: "144px",
    40: "160px",
    44: "176px",
    48: "192px",
    52: "208px",
    56: "224px",
    60: "240px",
    64: "256px",
    72: "288px",
    80: "320px",
    96: "384px",
  },

  borderRadius: {
    xs: "2px",
    sm: "4px",
    md: "8px",
    lg: "16px",
    xl: "24px",
    "2xl": "32px",
    "3xl": "48px",
    full: "9999px",
  },

  shadows: {
    sm: "0 8px 12px 1px rgba(29, 17, 51, .04), 0 3px 16px 2px rgba(9, 32, 77, .12), 0 5px 10px -3px rgba(29, 17, 51, .12)",
    md: "0 16px 24px 2px rgba(29, 17, 51, .04), 0 6px 32px 4px rgba(9, 32, 77, .12), 0 8px 12px -5px rgba(29, 17, 51, .12)",
    lg: "0 24px 38px 3px rgba(29, 17, 51, .04), 0 10px 48px 8px rgba(9, 32, 77, .12), 0 12px 16px -6px rgba(29, 17, 51, .12)",
  },

  breakpoints: {
    xs: "320px",
    sm: "480px",
    md: "768px",
    lg: "1024px",
    xl: "1312px",
    "2xl": "1536px",
  },

  containers: {
    xs: "304px",
    sm: "432px",
    md: "688px",
    lg: "928px",
    xl: "1152px",
    max: "1440px",
  },

  animation: {
    durations: {
      fast: "150ms",
      base: "200ms",
      slow: "300ms",
      slower: "500ms",
    },

    easings: {
      linear: "linear",
      in: "cubic-bezier(0.4, 0, 1, 1)",
      out: "cubic-bezier(0, 0, 0.2, 1)",
      inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },
} as const;

// Type exports for TypeScript support
export type DesignTokens = typeof tokens;
export type ColorToken = keyof typeof tokens.colors;
export type SpacingToken =
  | keyof typeof tokens.spacing.component
  | keyof typeof tokens.spacing.layout;
export type TypographySize = keyof typeof tokens.typography.sizes;
export type BreakpointToken = keyof typeof tokens.breakpoints;
export type AnimationDuration = keyof typeof tokens.animation.durations;

// Utility functions
export const getColor = (path: string): string => {
  const keys = path.split(".");
  let value: any = tokens.colors;

  for (const key of keys) {
    value = value?.[key];
  }

  return value || "";
};

export const getSpacing = (size: SpacingToken): string => {
  return (
    tokens.spacing.component[size as keyof typeof tokens.spacing.component] ||
    tokens.spacing.layout[size as keyof typeof tokens.spacing.layout] ||
    "0px"
  );
};

export const getFontSize = (size: TypographySize): string => {
  return tokens.typography.sizes[size] || "1rem";
};

export const getBreakpoint = (size: BreakpointToken): string => {
  return tokens.breakpoints[size] || "768px";
};

// CSS variable generator
export const generateCSSVariables = (): string => {
  const variables: string[] = [];

  // Colors
  Object.entries(tokens.colors.mozilla).forEach(([key, value]) => {
    variables.push(`--color-moz-${key}: ${value};`);
  });

  // Color scales
  Object.entries(tokens.colors).forEach(([scale, values]) => {
    if (
      typeof values === "object" &&
      scale !== "mozilla" &&
      scale !== "semantic"
    ) {
      Object.entries(values).forEach(([shade, color]) => {
        if (typeof color === "string") {
          variables.push(`--color-${scale}-${shade}: ${color};`);
        } else if (typeof color === "object") {
          // Handle nested objects like gray.light and gray.dark
          Object.entries(color).forEach(([nestedShade, nestedColor]) => {
            variables.push(
              `--color-${scale}-${shade}-${nestedShade}: ${nestedColor};`
            );
          });
        }
      });
    }
  });

  // Semantic colors
  Object.entries(tokens.colors.semantic).forEach(([key, value]) => {
    variables.push(`--color-${key}: ${value};`);
  });

  // Spacing
  Object.entries(tokens.spacing.component).forEach(([key, value]) => {
    variables.push(`--spacing-${key}: ${value};`);
  });

  Object.entries(tokens.spacing.layout).forEach(([key, value]) => {
    variables.push(`--layout-${key}: ${value};`);
  });

  // Border radius
  Object.entries(tokens.borderRadius).forEach(([key, value]) => {
    variables.push(`--radius-${key}: ${value};`);
  });

  return variables.join("\n  ");
};
