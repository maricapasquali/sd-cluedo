import {logger} from '@utils/logger';

const internalPort: number = Number(process.env.PORT) || 3001;
const externalPort: number = Number(process.env.EXTERNAL_PORT) || internalPort;
const discoveryServerAddress: string =
  process.env.DISCOVERY_SERVER_ADDRESS || 'https://localhost:3000';
const mongodbAddress: string =
  process.env.MONGODB_ADDRESS || 'mongodb://localhost:27017';

logger.debug('Peer: index.ts');
logger.debug('internalPort = ' + internalPort);
logger.debug('externalPort = ' + externalPort);
logger.debug('discoveryServerAddress = ' + discoveryServerAddress);
logger.debug('mongodbAddress = ' + mongodbAddress);
