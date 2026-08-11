import { Client } from '@elastic/elasticsearch';
import { jobberConfig } from './config';
import { logger } from '@gateway/logger';
import { ClusterHealthResponse } from '@elastic/elasticsearch/lib/api/types';


const log = logger.for('apiGatewayElasticConnection');

class ElasticSearch {
    private elasticSearchClient: Client;

    constructor(){
        this.elasticSearchClient = new Client({
            node: `${jobberConfig.ELASTIC_SEARCH_URL}`
        })
    }

    public async checkConnection(): Promise<void> {
        let isConnected = false;

        while(!isConnected){
            log.info('GatewayService connecting to Elasticsearch');
            try {
                const health: ClusterHealthResponse = await this.elasticSearchClient.cluster.health({});
                log.info(`GatewayService Elasticsearch health status = ${health.status}`);
                isConnected = true;
            } catch(error){
                log.error('Connection to ElasticSearch failed, Retrying...');
                log.log('error', 'GatewayService checkConnection() method error: ', error);
            }
        }
    } 
}

export const elasticSearch: ElasticSearch = new ElasticSearch();