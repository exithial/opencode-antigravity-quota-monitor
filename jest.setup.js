import { jest } from "@jest/globals";

// Mock global fetch
global.fetch = jest.fn();

// Mock console methods to keep tests clean
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});