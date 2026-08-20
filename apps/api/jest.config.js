/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json', isolatedModules: true }] },
  moduleNameMapper: {
    '^@campus-bytes/types$': '<rootDir>/../../packages/types/src/index.ts',
  },
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.ts'],
};
