import pino from 'pino';
import pinoHttp, {HttpLogger} from 'pino-http';

const nodeEnv: string = process.env.NODE_ENV || 'development';

const loggerLevel: string = nodeEnv === 'development' ? 'debug' : 'silent';

export const loggerHttp: HttpLogger = pinoHttp({
  level: loggerLevel,
});

export const logger: pino.Logger = loggerHttp.logger;
