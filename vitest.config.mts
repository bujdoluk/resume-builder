import { configDefaults, coverageConfigDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    exclude: [...configDefaults.exclude, "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        ...coverageConfigDefaults.exclude,
        "e2e/**",
        "scripts/**",
        "supabase/**",
        "**/*.config.*",
        "app/**/layout.tsx",
        "app/**/page.tsx",
      ],
    },
  },
});
