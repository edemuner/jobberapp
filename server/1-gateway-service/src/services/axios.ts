import axios from 'axios';
import { sign } from 'jsonwebtoken';
import { jobberConfig } from '@gateway/config';

export class AxiosService {
    public axios: ReturnType<typeof axios.create>;

    constructor(baseUrl: string, serviceName: string) {
        this.axios = this.axiosCreateInstance(baseUrl, serviceName);
    }

     public axiosCreateInstance(baseUrl: string, serviceName?: string): ReturnType<typeof axios.create> {
        let gatewayToken = '';
        if(serviceName){
            gatewayToken = sign({ id: serviceName }, `${jobberConfig.GATEWAY_JWT_TOKEN}`);
        }

        const instance: ReturnType<typeof axios.create> = axios.create({
            baseURL: baseUrl,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                gatewayToken
            }, 
            withCredentials: true
        });

        return instance;
     }
}

// const axiosTest = new AxiosService( `${jobberConfig.AUTH_BASE_URL}/api/v1/auth`, 'auth');