import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Los componentes copiados del template Spotlight (components/) conservan
  // su estilo original (`let`, refs y setState en efectos, como en Next 15) para
  // poder diferenciarlos contra el sitio sin ruido.
  {
    files: ["components/**"],
    rules: { "prefer-const": "off", "react-hooks/refs": "off", "react-hooks/set-state-in-effect": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
