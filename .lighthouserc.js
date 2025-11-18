module.exports = {
  ci: {
    collect: {
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/feed",
        "http://localhost:3000/offline",
      ],
      numberOfRuns: 3,
      startServerCommand: "pnpm start",
      startServerReadyPattern: "Ready on",
      startServerReadyTimeout: 10000,
    },
    assert: {
      assertions: {
        "categories:pwa": ["error", { minScore: 0.9 }],
        "categories:performance": ["warn", { minScore: 0.7 }],
        "categories:accessibility": ["warn", { minScore: 0.8 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./lighthouse-reports",
    },
  },
};

