module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 89,
      functions: 95,
      lines: 90,
      statements: 90
    }
  },
  moduleNameMapper: {
    '^@rgs/storage/(.*)$': '<rootDir>/src/$1'
  }
};
