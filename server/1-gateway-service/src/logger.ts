import { Logger } from '@edemuner/jobber-shared';

import { jobberConfig } from './config';

export const logger = new Logger(`${jobberConfig.ELASTIC_SEARCH_URL}`, 'gateway-service', 'debug');
