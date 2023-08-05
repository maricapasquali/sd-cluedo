import {Request} from 'express';
import {ITokensManager} from '@utils/tokens-manager';
import {Server} from 'socket.io';

export function catchableHandlerRequestPromise(
  fun: () => number | void | any
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const returnValue = fun();
      if (!returnValue) resolve();
    } catch (err: any) {
      reject(err);
    }
  });
}

export namespace AppGetter {
  export function tokensManger(req: Request): ITokensManager {
    const tokensManager: ITokensManager = req.app.get('tokensManager');
    if (!tokensManager) throw new Error('"tokensManager" is not set');
    return tokensManager;
  }
  export function socketServer(req: Request): Server {
    return req.app.get('socket');
  }
}

export namespace HeadersFormatter {
  export function clientIp(req: Request): string | undefined {
    const xForwardedFor = req.headers['x-forwarded-for'] as string;
    const ip = xForwardedFor?.split(',')[0].trim();
    return ip && ip.length > 0 ? ip : undefined;
  }

  export function authorization(req: Request): {
    scheme: string;
    parameters: string | any;
  } {
    const authorization = req.headers.authorization;
    const authorizationSplit = authorization?.split(' ') || ['', ''];
    return {
      scheme: authorizationSplit[0],
      parameters: authorizationSplit[1],
    };
  }
}
