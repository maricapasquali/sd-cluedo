import pino from 'pino';
import pinoHttp, {HttpLogger} from 'pino-http';

const nodeEnv: string = process.env.NODE_ENV || 'development';

const loggerLevel: string =
  nodeEnv === 'production' ? 'info' : nodeEnv === 'test' ? 'error' : 'debug';

export const loggerHttp: HttpLogger = pinoHttp({
  level: loggerLevel,
});

export const logger: pino.Logger = loggerHttp.logger;

logger.debug('NODE_ENV = ' + nodeEnv);
