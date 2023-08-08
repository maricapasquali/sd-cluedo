import {Socket as PeerClient, Server} from 'socket.io';
import {Socket as PeerServer} from 'socket.io-client';
import {logger} from '@utils/logger';
import {CluedoGameEvent} from '../../events';
import {Clients} from '../../server/clients';
import {AdditionalArgs, receiverName} from '../utils';
import {
  onConfutation,
  onEndRound,
  onLeaveGame,
  onMakeAccusation,
  onMakeAssumption,
  onRollDice,
  onStartGame,
  onStayInGame,
  onStopGame,
  onTakeNotes,
  onUseSecretPassage,
} from './game.actions';
import {MongoDBGamesManager} from '../../../managers/games/mongoose';

export default function (
  server: Server,
  socket: PeerClient | PeerServer,
  {peer, peerServerManager}: AdditionalArgs
) {
  const receiver = receiverName(server, socket, peer);

  socket.onAny((eventName, ...args) => {
    logger.debug(
      `${receiver} - [onAny] receive event '${eventName}', args ${JSON.stringify(
        args
      )}`
    );
    const gameId: string = eventName.split('/')[1] || '';
    if (CluedoGameEvent.GameActionEvent.CLUEDO_START.check(eventName)) {
      onStartGame(server, socket, args[0] as CluedoGameMessage, {
        peer,
        peerServerManager,
      });
    } else if (
      CluedoGameEvent.GameActionEvent.CLUEDO_ROLL_DIE.check(eventName)
    ) {
      onRollDice(server, socket, args[0] as RollDiceMessage, {
        peer,
        peerServerManager,
        gameManager: MongoDBGamesManager.gameManagers(gameId),
      });
    } else if (
      CluedoGameEvent.GameActionEvent.CLUEDO_TAKE_NOTES.check(eventName)
    ) {
      onTakeNotes(server, socket, args[0] as TakeNotesMessage, {
        peer,
        peerServerManager,
        gameManager: MongoDBGamesManager.gameManagers(gameId),
      });
    } else if (
      CluedoGameEvent.GameActionEvent.CLUEDO_MAKE_ASSUMPTION.check(eventName)
    ) {
      onMakeAssumption(server, socket, args[0] as SuggestionMessage, {
        peer,
        peerServerManager,
        gameManager: MongoDBGamesManager.gameManagers(gameId),
      });
    } else if (
      CluedoGameEvent.GameActionEvent.CLUEDO_MAKE_ACCUSATION.check(eventName)
    ) {
      onMakeAccusation(server, socket, args[0] as AccusationMessage, {
        peer,
        peerServerManager,
        gameManager: MongoDBGamesManager.gameManagers(gameId),
      });
    } else if (
      CluedoGameEvent.GameActionEvent.CLUEDO_USE_SECRET_PASSAGE.check(eventName)
    ) {
      onUseSecretPassage(server, socket, args[0] as ToRoomMessage, {
        peer,
        peerServerManager,
        gameManager: MongoDBGamesManager.gameManagers(gameId),
      });
    } else if (
      CluedoGameEvent.GameActionEvent.CLUEDO_CONFUTATION_ASSUMPTION.check(
        eventName
      )
    ) {
      onConfutation(server, socket, args[0] as ConfutationMessage, {
        peer,
        peerServerManager,
        gameManager: MongoDBGamesManager.gameManagers(gameId),
      });
    } else if (CluedoGameEvent.GameActionEvent.CLUEDO_STAY.check(eventName)) {
      onStayInGame(server, socket, args[0] as StayGamerMessage, {
        peer,
        peerServerManager,
        gameManager: MongoDBGamesManager.gameManagers(gameId),
      });
    } else if (CluedoGameEvent.GameActionEvent.CLUEDO_LEAVE.check(eventName)) {
      onLeaveGame(server, socket, args[0] as LeaveMessage, {
        peer,
        peerServerManager,
        gameManager: MongoDBGamesManager.gameManagers(gameId),
      });
    } else if (
      CluedoGameEvent.GameActionEvent.CLUEDO_END_ROUND.check(eventName)
    ) {
      onEndRound(server, socket, args[0], {
        peer,
        peerServerManager,
        gameManager: MongoDBGamesManager.gameManagers(gameId),
      });
    } else if (
      CluedoGameEvent.GameActionEvent.CLUEDO_STOP_GAME.check(eventName)
    ) {
      onStopGame(server, socket, args[0] as CluedoGameMessage, {
        peer,
        peerServerManager,
        gameManager: MongoDBGamesManager.gameManagers(gameId),
      });
    }
  });

  socket
    .on(CluedoGameEvent.CLUEDO_NEW_GAME, (game: CluedoGameMessage) => {
      logger.info(receiver + 'receive new game' + JSON.stringify(game));
      MongoDBGamesManager.createGame(game)
        .then(() => {
          Clients.real(server).forEach(s =>
            s.emit(CluedoGameEvent.CLUEDO_NEW_GAME, game)
          );
        })
        .catch(err => logger.error(err, 'ADD NEW GAME'));
    })
    .on(CluedoGameEvent.CLUEDO_NEW_GAMER, (message: GamerMessage) => {
      logger.info(receiver + 'receive new gamer' + JSON.stringify(message));
      MongoDBGamesManager.gameManagers(message.game)
        .addGamer(message.gamer)
        .then(() => {
          Clients.real(server).forEach(s =>
            s.emit(CluedoGameEvent.CLUEDO_NEW_GAMER, message)
          );
        })
        .catch(err => logger.error(err, 'ADD NEW GAMER'));
    })
    .on(CluedoGameEvent.CLUEDO_REMOVE_GAMER, (message: ExitGamerMessage) => {
      logger.info(receiver + 'receive remove gamer' + JSON.stringify(message));
      MongoDBGamesManager.gameManagers(message.game)
        .removeGamer(message.gamer)
        .then(() => {
          Clients.real(server).forEach(s =>
            s.emit(CluedoGameEvent.CLUEDO_REMOVE_GAMER, message)
          );
        })
        .catch(err => logger.error(err, 'REMOVED GAMER'));
    });
}
