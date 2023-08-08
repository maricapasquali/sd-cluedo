import {logger} from '@utils/logger';
import {MongoDBGamesManager} from '../../../managers/games/mongoose';
import {Clients} from '../../server/clients';
import {Server, Socket} from 'socket.io';
import {CluedoGameEvent} from '../../events';
import GameActionEvent = CluedoGameEvent.GameActionEvent;
import {AdditionalArgs, receiverName} from '../utils';

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
