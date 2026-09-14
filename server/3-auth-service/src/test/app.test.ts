const mockApp = { name: 'fake-express-app' };

jest.mock('express', () => jest.fn(() => mockApp));
jest.mock('../server', () => ({ start: jest.fn() }));
jest.mock('../database', () => ({ databaseConnection: jest.fn() }));

describe('app entrypoint', () => {
    it('creates an express app, connects to the database, and starts the server with it', () => {
        const express = require('express');
        const { start } = require('../server');
        const { databaseConnection } = require('../database');

        require('../app');

        expect(express).toHaveBeenCalledTimes(1);
        expect(databaseConnection).toHaveBeenCalledTimes(1);
        expect(start).toHaveBeenCalledWith(mockApp);
    });
});
