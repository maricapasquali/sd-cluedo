import {logger} from '@utils/logger';
import {MongoDBGamesManager} from '../../../managers/games/mongoose';
import {Clients, GamersSocket} from '../../server/clients';
import {Server, Socket} from 'socket.io';
import {CluedoGameEvent} from '../../events';
import GameActionEvent = CluedoGameEvent.GameActionEvent;
import {AdditionalArgs, receiverName} from '../utils';
import {getAuth} from '../../utils';
import {createAxiosInstance} from '@utils/axios';
import {Peers} from '@model';
import {RestAPIRouteName} from '../../../routes/routesNames';
import {ResponseStatus} from '@utils/rest-api/responses';
import {QueryParameters} from '../../../routes/parameters';
import Action = QueryParameters.Action;

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
export function onDisconnection(
  peer: Peer,
  socketServer: Server,
  socket: Socket
): void {
  GamersSocket.unregister(getAuth(socket));
  setTimeout(() => leaveGame(peer, socketServer, socket), 5000); //TODO: REVIEW THE TIME (secs) OF REAL DISCONNECTION: 5 seconds ??
}

export default function registerGamerHandlers(
  server: Server,
  socket: Socket,
  gameId: string,
  {peer, peerServerManager}: AdditionalArgs
) {
  const receiver = receiverName(server, socket, peer);
  socket.on(
    GameActionEvent.CLUEDO_TAKE_NOTES.action(gameId),
    (message: TakeNotesMessage, ack: Function) => {
      logger.info(
        receiver + 'receive TAKE NOTES game' + JSON.stringify(message)
      );
      MongoDBGamesManager.gameManagers(gameId)
        .takeNote(message.gamer, message.note)
        .then(() => {
          logger.debug(`${receiver}: Save notes of gamer ${message.gamer}`);
          [...Clients.peer(server), ...peerServerManager.sockets()].forEach(s =>
            s.emit(GameActionEvent.CLUEDO_TAKE_NOTES.action(gameId), message)
          );
          if (typeof ack === 'function') ack();
        })
        .catch(err => logger.error(err));
    }
  );
}
