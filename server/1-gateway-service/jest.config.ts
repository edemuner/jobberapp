import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: true,
    coverageDirectory: 'coverage',
    collectCoverage: true,
    testPathIgnorePatterns: ['/node_modules'],
    transform: {
        '^.+\\. ts?$':'ts-jest',   
    },
    testMatch: ['<rootDir>/src/**/test/*.ts'],
    collectCoverageFrom: ['src/**/*.ts', '!src/**/test/*.ts?(x)', '!**/node_modules/**'],
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100
        },
    },
    coverageReporters: ['text-summary', 'lcov'],
    moduleNameMapper: {
        '@gateway/(.*)': ['<rootDir>/src/$1']
    }

}

export default config;