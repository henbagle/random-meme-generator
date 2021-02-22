module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    collectCoverage: true,
    coverageDirectory: "coverage",
    verbose: true,
    testPathIgnorePatterns: ["/node_modules/"],
    roots: ["<rootDir>/src"],
};
