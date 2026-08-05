const mockApp = { name: 'fake-express-app' };
const mockStart = jest.fn();

jest.mock('express', () => jest.fn(() => mockApp));
jest.mock('../server', () => ({ GatewayServer: jest.fn().mockImplementation(() => ({ start: mockStart })) }));

describe('app entrypoint', () => {
    it('creates an express app and starts a GatewayServer with it', () => {
        const express = require('express');
        const { GatewayServer } = require('../server');

        require('../app');

        expect(express).toHaveBeenCalledTimes(1);
        expect(GatewayServer).toHaveBeenCalledWith(mockApp);
        expect(mockStart).toHaveBeenCalledTimes(1);
    });
});
