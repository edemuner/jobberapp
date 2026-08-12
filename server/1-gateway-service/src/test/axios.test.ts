jest.mock('axios', () => ({
    create: jest.fn(() => 'axiosInstance')
}));
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'signed-token')
}));
jest.mock('@gateway/config', () => ({
    jobberConfig: { GATEWAY_JWT_TOKEN: 'test-gateway-secret' }
}));

import axios from 'axios';
import { sign } from 'jsonwebtoken';
import { AxiosService } from '../services/axios';

const mockCreate = axios.create as jest.Mock;
const mockSign = sign as jest.Mock;

describe('AxiosService', () => {
    afterEach(() => jest.clearAllMocks());

    it('signs a gateway token for the given service and creates an axios instance with it', () => {
        const service = new AxiosService('http://auth:4001', 'auth');

        expect(mockSign).toHaveBeenCalledWith({ id: 'auth' }, 'test-gateway-secret');
        expect(mockCreate).toHaveBeenCalledWith({
            baseURL: 'http://auth:4001',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                gatewayToken: 'signed-token'
            },
            withCredentials: true
        });
        expect(service.axios).toBe('axiosInstance');
    });

    it('leaves the gateway token empty when no service name is provided', () => {
        const service = new AxiosService('http://auth:4001', 'auth');
        jest.clearAllMocks();

        service.axiosCreateInstance('http://auth:4001');

        expect(mockSign).not.toHaveBeenCalled();
        expect(mockCreate).toHaveBeenCalledWith({
            baseURL: 'http://auth:4001',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                gatewayToken: ''
            },
            withCredentials: true
        });
    });
});
