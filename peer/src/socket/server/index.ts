import {Server, Socket} from 'socket.io';
import {Socket as ClientSocket} from 'socket.io-client';
import {logger} from '@utils/logger';
import {registerGameEventHandlers} from '../handlers';
import {Peers} from '@model';
import {PeerServerManager} from '../../managers/peers-servers';
import {DiscoveryPeerEvent} from '@discovery-peers-routes';
import {RestAPIRouteName} from '../../routes/routesNames';
import {QueryParameters} from '../../routes/parameters';
import Action = QueryParameters.Action;
import {createAxiosInstance} from '@utils/axios';
import {ResponseStatus} from '@utils/rest-api/responses';
import {GamersSocket} from './clients';
import {getAuth} from '../utils';

function leaveGame(peer: Peer, socketServer: Server, socket: Socket) {
  const auth = getAuth(socket);
  if (GamersSocket.isUnregistered(auth)) {
    const gameId = auth.gameId;
    const gamerId = auth.gamerId;
    const accessToken = auth.accessToken;
    logger.info(`Gamer ${gamerId} disconnects`);
    const axiosInstance = createAxiosInstance({
      baseURL: Peers.url(peer),
      headers: {
        authorization: accessToken,
      },
      params: {
        gamer: gamerId,
      },
      timeout: 3000,
    });
    axiosInstance
      .patch(RestAPIRouteName.GAME.replace(':id', gameId), null, {
        params: {
          action: Action.LEAVE,
        },
      })
      .then(() => {
        logger.info('Leave performed');
        GamersSocket.remove(auth);
        axiosInstance
          .patch(RestAPIRouteName.GAME.replace(':id', gameId), null, {
            params: {
              action: Action.END_ROUND,
            },
          })
          .then(response => {
            logger.info('End round performed');
            if (typeof response.data !== 'string') {
              axiosInstance
                .patch(RestAPIRouteName.GAME.replace(':id', gameId), null, {
                  params: {
                    action: Action.STOP_GAME,
                  },
                })
                .then(() => logger.info(`Game ${gameId} is finished.`))
                .catch(err => logger.error(err.response));
            }
          })
          .catch(err => logger.error(err.response));
      })
      .catch(err => {
        if (
          err.response.status === ResponseStatus.FORBIDDEN ||
          err.response.status === ResponseStatus.GONE
        ) {
          axiosInstance
            .delete(
              RestAPIRouteName.GAMER.replace(':id', gameId).replace(
                ':gamerId',
                gamerId
              ),
              {
                headers: {
                  authorization: accessToken,
                },
              }
            )
            .then(() => {
              GamersSocket.remove(auth);
              logger.info('Remove Gamer performed');
            })
            .catch(() => logger.error(err.response));
        } else logger.error(err.response);
      });
  }
}

type AdditionalArg = {
  peerServerManager: PeerServerManager;
  discoveryServerSocketClient?: ClientSocket;
};
export default function createPeerClientStub(
  peer: Peer,
  {peerServerManager, discoveryServerSocketClient}: AdditionalArg
): (server: Server) => void {
  return (socketServer: Server) => {
    let nDevices = 0;
    const peerAddress = Peers.url(peer);
    socketServer.on('connection', (socket: Socket) => {
      const auth = getAuth(socket);
      logger.info(
        '%s: Socket ID = %s connects. %s',
        peerAddress,
        socket.id,
        JSON.stringify(auth)
      );
      nDevices++;
      discoveryServerSocketClient?.emit(
        DiscoveryPeerEvent.PEER_DEVICES,
        nDevices
      );
      logger.debug('%s: #devices = %s', peerAddress, nDevices);
      if (auth.gameId && auth.gamerId && auth.accessToken) {
        GamersSocket.register(auth);
      }

      registerGameEventHandlers(socketServer, socket, {
        peer,
        peerServerManager,
      });

      socket.on('disconnect', reason => {
        logger.info(
          'Peer (%s): Socket ID = %s disconnects. Reason = %s',
          peerAddress,
          socket.id,
          reason
        );

        if (auth.gameId && auth.gamerId && auth.accessToken) {
          GamersSocket.unregister(auth);
          setTimeout(() => leaveGame(peer, socketServer, socket), 5000); //TODO: REVIEW THE TIME (secs) OF REAL DISCONNECTION: 5 seconds ??
        }

        nDevices--;
        discoveryServerSocketClient?.emit(
          DiscoveryPeerEvent.PEER_DEVICES,
          nDevices
        );
        logger.debug('%s: #devices = %s', peerAddress, nDevices);
      });
    });
  };
}
