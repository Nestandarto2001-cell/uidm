/**
 * Jest setup file
 */

// Mock environment variables
process.env.ASSESS_WATCH_INTERVAL_MINUTES = '10';
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
