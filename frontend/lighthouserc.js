module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run dev',
      startServerReadyPattern: 'Local:',
      url: ['http://localhost:5173/', 'http://localhost:5173/portfolio', 'http://localhost:5173/debt', 'http://localhost:5173/retirement', 'http://localhost:5173/recommendations'],
      numberOfRuns: 1,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.85 }],
        'categories:seo': ['error', { minScore: 0.7 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 5000 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.15 }],
        'total-blocking-time': ['warn', { maxNumericValue: 500 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};