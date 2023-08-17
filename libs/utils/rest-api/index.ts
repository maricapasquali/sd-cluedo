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
  /**
   * Retrieve a tokens manager from express request.
   * @param req express request.
   * @throws Error when a tokens manager is not set.
   */
  export function tokensManger(req: Request): ITokensManager {
    const tokensManager: ITokensManager = req.app.get('tokensManager');
    if (!tokensManager) throw new Error('"tokensManager" is not set');
    return tokensManager;
  }
  /**
   * Retrieve a socket server from express request, if it is present.
   * @param req express request
   */
  export function socketServer(req: Request): Server {
    return req.app.get('socket');
  }
}

export namespace HeadersFormatter {
  /**
   * Retrieve the client ip from header '_x-forwarded-for_' of express request,
   * otherwise return _undefined_.
   * @param req express request.
   */
  export function clientIp(req: Request): string | undefined {
    const xForwardedFor = req.headers['x-forwarded-for'] as string;
    const ip = xForwardedFor?.split(',')[0].trim();
    return ip && ip.length > 0 ? ip : undefined;
  }

  /**
   * Retrieve the authorization from express request header and
   * split it into the scheme value and the parameters value.
   * @param req express request.
   */
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
