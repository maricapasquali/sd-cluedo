import PeersDevicesManager from '../../managers/peers/devices';
export * as restApi from './rest-api.controller';
import {NextFunction, Request, Response} from 'express';
import {logger} from '@utils/logger';
import {
  MessageError,
  NotFoundSender,
  ResponseStatus,
  ServerErrorSender,
} from '@utils/rest-api/responses';
import PeersManager from '../../managers/peers';
import {Peers} from '@model';
import {createAxiosInstance} from '@utils/axios';
import {AxiosError} from 'axios';

export function baseHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  async function _baseHandler(): Promise<string> {
    const messageError: MessageError = {
      message: 'No connected peer',
      code: ResponseStatus.NOT_FOUND,
    };
    if (Object.keys(PeersDevicesManager.numberOfPeerDevices).length === 0) {
      return Promise.reject(messageError);
    }
    const connectedPeers = PeersManager.peers
      .filter(p => p && p.status !== Peers.Status.OFFLINE)
      .map(p =>
        Object.assign(p, {
          nDevices: PeersDevicesManager.numberOfPeerDevices[p.identifier],
        })
      )
      .sort((p1, p2) => p1.nDevices - p2.nDevices);

    for (const connectedPeer of connectedPeers) {
      try {
        const url: string = Peers.url(connectedPeer);
        await createAxiosInstance({
          baseURL: url,
          timeout: 2000,
        }).head(url);
        return Promise.resolve(url);
      } catch (err: any) {
        if (!(err instanceof AxiosError)) {
          return Promise.reject(err);
        }
      }
    }
    return Promise.reject(messageError);
  }

  _baseHandler()
    .then(peerUrl => {
      return res.redirect(ResponseStatus.MOVED_PERMANENTLY, peerUrl);
    })
    .catch(err => {
      const messageError: MessageError = err;
      if (messageError.code === ResponseStatus.NOT_FOUND) {
        NotFoundSender.json(res, messageError);
      } else {
        next(err);
      }
    });
}

export function serverError(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error(err?.stack || err);
  ServerErrorSender.json(res, {
    message: 'Server Error',
    cause: err?.stack || err,
  });
}

export function pathNotFound(req: Request, res: Response): void {
  logger.debug(req);
  NotFoundSender.json(res, {
    message: req.method + ' ' + req.path + ' not found',
    cause: 'wrong path or wrong method',
  });
}
