const mockApp = { name: 'fake-express-app' };

jest.mock('express', () => jest.fn(() => mockApp));
jest.mock('../server', () => ({ start: jest.fn() }));

describe('app entrypoint', () => {
    it('creates an express app and starts the server with it', () => {
        const express = require('express');
        const { start } = require('../server');

        require('../app');

        expect(express).toHaveBeenCalledTimes(1);
        expect(start).toHaveBeenCalledWith(mockApp);
    });
});
