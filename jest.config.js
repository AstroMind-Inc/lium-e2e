export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  collectCoverageFrom: [
    "shared/**/*.ts",
    "ui/**/*.ts",
    "!shared/**/*.d.ts",
    "!shared/**/index.ts",
    "!**/*.test.ts",
    // Exclude Playwright-specific browser automation (tested via E2E)
    "!synthetic/auth-setup/**/*.ts",
    "!shared/auth/auth0-helper.ts", // Browser automation - tested via E2E
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageDirectory: "<rootDir>/coverage",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
};
