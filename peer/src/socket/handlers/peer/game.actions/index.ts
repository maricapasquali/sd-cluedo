import {logger} from '@utils/logger';
import {AdditionalArgs, receiverName} from '../../utils';
import {MongoDBGamesManager} from '../../../../managers/games/mongoose';
import {Clients} from '../../../server/clients';
import {getStartedCluedoGame} from '../../../../utils';
import {CluedoGameEvent} from '../../../events';
import {Server} from 'socket.io';
import {Socket as PeerClient} from 'socket.io/dist/socket';
import {Socket as PeerServer} from 'socket.io-client';
import GameActionEvent = CluedoGameEvent.GameActionEvent;
import {GameManager} from '../../../../managers/games';
import {MongooseError} from 'mongoose';
import {CSuggestion} from '@model/checker';

type ExtendedAdditionalArgs = AdditionalArgs & {
  gameManager: GameManager;
};
export function onStartGame(
  server: Server,
  socket: PeerClient | PeerServer,
  startedGame: CluedoGameMessage,
  {peer}: AdditionalArgs
) {
  logger.info(
    receiverName(server, socket, peer) +
      'receive STARTED game' +
      JSON.stringify(startedGame)
  );
  MongoDBGamesManager.createGame(startedGame)
    .then(() => {
      Clients.real(server).forEach(s => {
        const _startedGamed = getStartedCluedoGame(
          startedGame,
          s.handshake.auth.gamerId
        );
        s.emit(
          CluedoGameEvent.GameActionEvent.CLUEDO_START.action(
            startedGame.identifier
          ),
          _startedGamed as CluedoGameMessage
        );
      });
    })
    .catch(err => logger.error(err));
}

export function onRollDice(
  server: Server,
  socket: PeerClient | PeerServer,
  message: RollDiceMessage,
  {peer, gameManager}: ExtendedAdditionalArgs
) {
  logger.info(
    receiverName(server, socket, peer) +
      'receive ROLL DIE message ' +
      JSON.stringify(message)
  );
  gameManager
    .moveCharacterIn(message.gamer, message.housePart)
    .then(() => {
      Clients.gamer(server, gameManager.gameId).forEach(s =>
        s.emit(
          GameActionEvent.CLUEDO_ROLL_DIE.action(gameManager.gameId),
          message
        )
      );
    })
    .catch(err => logger.error(err));
}

export function onTakeNotes(
  server: Server,
  socket: PeerClient | PeerServer,
  message: TakeNotesMessage,
  {peer, gameManager}: ExtendedAdditionalArgs
) {
  const receiver = receiverName(server, socket, peer);
  logger.info(receiver + 'receive TAKE NOTES game' + JSON.stringify(message));
  gameManager
    .takeNote(message.gamer, message.note)
    .then(() => {
      logger.debug(`${receiver}: Save notes of gamer ${message.gamer}`);
    })
    .catch(err => logger.error(err));
}

export function onMakeAssumption(
  server: Server,
  socket: PeerClient | PeerServer,
  message: SuggestionMessage,
  {peer, gameManager}: ExtendedAdditionalArgs
) {
  const receiver = receiverName(server, socket, peer);
  logger.info(
    receiver + 'receive MAKE ASSUMPTION message ' + JSON.stringify(message)
  );
  const sendToClients = () => {
    Clients.gamer(server, gameManager.gameId).forEach(s =>
      s.emit(
        GameActionEvent.CLUEDO_MAKE_ASSUMPTION.action(gameManager.gameId),
        message
      )
    );
  };
  gameManager
    .makeAssumption(message.suggestion)
    .then(() => {
      sendToClients();
    })
    .catch((err: MongooseError) => {
      //VersionError: it should only happen during testing
      if (err.name === 'VersionError') {
        sendToClients();
      } else {
        logger.error(err, 'MAKE ASSUMPTION');
      }
    });
}

export function onMakeAccusation(
  server: Server,
  socket: PeerClient | PeerServer,
  message: AccusationMessage,
  {peer, gameManager}: ExtendedAdditionalArgs
) {
  const receiver = receiverName(server, socket, peer);
  logger.info(
    receiver + 'receive MAKE ACCUSATION message ' + JSON.stringify(message)
  );
  gameManager
    .makeAccusation(message.suggestion)
    .then(() => {
      Clients.gamer(server, gameManager.gameId).forEach(s =>
        s.emit(
          GameActionEvent.CLUEDO_MAKE_ACCUSATION.action(gameManager.gameId),
          message
        )
      );
    })
    .catch(err => logger.error(err, 'MAKE ACCUSATION'));
}

export function onUseSecretPassage(
  server: Server,
  socket: PeerClient | PeerServer,
  message: ToRoomMessage,
  {peer, gameManager}: ExtendedAdditionalArgs
) {
  const receiver = receiverName(server, socket, peer);
  logger.info(
    receiver + 'receive USE SECRET PASSAGE message ' + JSON.stringify(message)
  );
  gameManager
    .moveCharacterIn(message.gamer, message.room)
    .then(() => {
      Clients.gamer(server, gameManager.gameId).forEach(s =>
        s.emit(
          GameActionEvent.CLUEDO_USE_SECRET_PASSAGE.action(gameManager.gameId),
          message
        )
      );
    })
    .catch(err => logger.error(err));
}

export function onConfutation(
  server: Server,
  socket: PeerClient | PeerServer,
  message: ConfutationMessage,
  {peer, gameManager}: ExtendedAdditionalArgs
) {
  const receiver = receiverName(server, socket, peer);
  logger.info(
    receiver + 'receive CONFUTATION ASSUMPTION  game' + JSON.stringify(message)
  );

  Clients.gamer(server, gameManager.gameId).forEach(s =>
    s.emit(
      GameActionEvent.CLUEDO_CONFUTATION_ASSUMPTION.action(gameManager.gameId),
      {
        refuterGamer: message.refuterGamer,
        roundGamer: message.roundGamer,
        card:
          s.handshake.auth.gamerId === message.roundGamer
            ? message.card
            : message.card.length > 0,
      } as ConfutationMessage
    )
  );
}

export function onStayInGame(
  server: Server,
  socket: PeerClient | PeerServer,
  message: StayGamerMessage,
  {peer, gameManager}: ExtendedAdditionalArgs
) {
  const receiver = receiverName(server, socket, peer);
  logger.info(receiver + 'receive STAY game ' + JSON.stringify(message));
  gameManager
    .silentGamerInRound()
    .then(() => {
      Clients.gamer(server, gameManager.gameId).forEach(s =>
        s.emit(GameActionEvent.CLUEDO_STAY.action(gameManager.gameId), message)
      );
    })
    .catch(err => logger.error(err));
}

export function onLeaveGame(
  server: Server,
  socket: PeerClient | PeerServer,
  message: LeaveMessage,
  {peer, gameManager}: ExtendedAdditionalArgs
) {
  const receiver = receiverName(server, socket, peer);
  logger.info(receiver + 'receive LEAVE game ' + JSON.stringify(message));
  gameManager
    .leave(message.gamer)
    .then(() => {
      Clients.gamer(server, gameManager.gameId).forEach(s => {
        const _leaveMessage: LeaveMessage = {
          ...message,
          newDisposition: message.newDisposition.filter(
            nD => nD.gamer === (s as PeerClient).handshake.auth.gamerId
          ),
        };
        s.emit(
          GameActionEvent.CLUEDO_LEAVE.action(gameManager.gameId),
          _leaveMessage
        );
      });
    })
    .catch(err => logger.error(err));
}

export function onEndRound(
  server: Server,
  socket: PeerClient | PeerServer,
  message: NextGamerMessage | Suggestion,
  {peer, gameManager}: ExtendedAdditionalArgs
) {
  const receiver = receiverName(server, socket, peer);
  logger.info(receiver + 'receive END ROUND game ' + JSON.stringify(message));
  const sendMessage = () => {
    Clients.gamer(server, gameManager.gameId).forEach(s =>
      s.emit(
        GameActionEvent.CLUEDO_END_ROUND.action(gameManager.gameId),
        message
      )
    );
  };
  const isSolution = (message: any) => {
    try {
      CSuggestion.check(message);
      return true;
    } catch (e) {
      return false;
    }
  };
  if (typeof message === 'string') {
    gameManager
      .game()
      .then(game => {
        game.roundGamer = message;
        return game.save();
      })
      .then(() => sendMessage())
      .catch(err => logger.error(err));
  } else if (isSolution(message)) {
    sendMessage();
  }
}

export function onStopGame(
  server: Server,
  socket: PeerClient | PeerServer,
  message: CluedoGameMessage,
  {peer, gameManager}: ExtendedAdditionalArgs
) {
  const receiver = receiverName(server, socket, peer);
  logger.info(receiver + 'receive STOP game' + JSON.stringify(message));
  gameManager
    .stopGame()
    .then(() => {
      Clients.real(server).forEach(s =>
        s.emit(
          GameActionEvent.CLUEDO_STOP_GAME.action(gameManager.gameId),
          message
        )
      );
    })
    .catch(err => logger.error(err));
}
