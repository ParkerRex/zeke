import desktopPlugin from "@zeke/desktop-client/desktop-variants";
import baseConfig from "@zeke/ui/tailwind.config";
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  presets: [baseConfig],
  plugins: [desktopPlugin],
} satisfies Config;
