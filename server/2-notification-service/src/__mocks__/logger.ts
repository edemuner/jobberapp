const mockChildLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    log: jest.fn()
};

export const logger = {
    for: jest.fn(() => mockChildLogger)
};
