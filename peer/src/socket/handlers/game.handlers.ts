import {Socket as PeerClient, Server} from 'socket.io';
import {Socket as PeerServer} from 'socket.io-client';
import {logger} from '@utils/logger';
import {CluedoGameEvent} from '../events';
import GameActionEvent = CluedoGameEvent.GameActionEvent;
import {MongoDBGamesManager} from '../../managers/games/mongoose';
import {Clients, sids} from '../server/clients';
import {getStartedCluedoGame} from '../../utils';
import {CluedoGames, Peers} from '@model';
import {MongooseError} from 'mongoose';
import {SocketChecker} from '../checker';
import {getAuth} from '../utils';
import {PeerServerManager} from '../../managers/peers-servers';

function receiverName(
  server: Server,
  socket: PeerClient | PeerServer,
  peer: Peer
): string {
  if (socket instanceof PeerClient) {
    const auth = socket.handshake.auth as any;
    if (SocketChecker.isGamer(socket))
      return `Peer (${Peers.url(peer)}) (like server for GAMER) `;
    return `Peer (${Peers.url(peer)}) (like server for ${auth?.address}:${
      auth?.port
    }) `;
  } else if (socket instanceof PeerServer) {
    const {hostname, port} = socket.io.opts;
    return `Peer (${Peers.url(peer)}) (like client on ${hostname}:${port}) `;
  }
  return 'Peer';
}

type AdditionalArgs = {
  peer: Peer;
  peerServerManager: PeerServerManager;
};
function registerGameActionEvent(
  server: Server,
  socket: PeerClient | PeerServer,
  gameId: string,
  {peer, peerServerManager}: AdditionalArgs
): void {
  const receiver = receiverName(server, socket, peer);
  const gameManager = MongoDBGamesManager.gameManagers(gameId);

  socket
    .once(
      GameActionEvent.CLUEDO_START.action(gameId),
      (startedGame: CluedoGameMessage) => {
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
                CluedoGameEvent.GameActionEvent.CLUEDO_START.action(gameId),
                _startedGamed as CluedoGameMessage
              );
            });
          })
          .catch(err => logger.error(err));
      }
    )
    .on(
      GameActionEvent.CLUEDO_ROLL_DIE.action(gameId),
      (message: RollDiceMessage) => {
        logger.info(
          receiver + 'receive ROLL DIE message ' + JSON.stringify(message)
        );
        gameManager
          .rollDie()
          .then(() => {
            server
              .to(sids(Clients.gamer(server, gameId)))
              .emit(GameActionEvent.CLUEDO_ROLL_DIE.action(gameId), message);
          })
          .catch(err => logger.error(err));
      }
    )
    .on(
      GameActionEvent.CLUEDO_TAKE_NOTES.action(gameId),
      (message: TakeNotesMessage) => {
        logger.info(
          receiver + 'receive TAKE NOTES game' + JSON.stringify(message)
        );
        gameManager
          .takeNote(message.gamer, message.note)
          .then(() => {
            logger.debug(`${receiver}: Save notes of gamer ${message.gamer}`);
            if (SocketChecker.isGamer(socket)) {
              [...Clients.peer(server), ...peerServerManager.sockets()].forEach(
                s =>
                  s.emit(
                    GameActionEvent.CLUEDO_TAKE_NOTES.action(gameId),
                    message
                  )
              );
            }
          })
          .catch(err => logger.error(err));
      }
    )
    .on(
      GameActionEvent.CLUEDO_MAKE_ASSUMPTION.action(gameId),
      (message: SuggestionMessage) => {
        logger.info(
          receiver +
            'receive MAKE ASSUMPTION message ' +
            JSON.stringify(message)
        );
        const sendToClients = () => {
          server
            .to(sids(Clients.gamer(server, gameId)))
            .emit(
              GameActionEvent.CLUEDO_MAKE_ASSUMPTION.action(gameId),
              message
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
    )
    .on(
      GameActionEvent.CLUEDO_MAKE_ACCUSATION.action(gameId),
      (message: AccusationMessage) => {
        logger.info(
          receiver +
            'receive MAKE ACCUSATION message ' +
            JSON.stringify(message)
        );
        gameManager
          .makeAccusation(message.suggestion)
          .then(() => {
            server
              .to(sids(Clients.gamer(server, gameId)))
              .emit(
                GameActionEvent.CLUEDO_MAKE_ACCUSATION.action(gameId),
                message
              );
          })
          .catch(err => logger.error(err, 'MAKE ACCUSATION'));
      }
    )
    .on(
      GameActionEvent.CLUEDO_USE_SECRET_PASSAGE.action(gameId),
      (message: ToRoomMessage) => {
        logger.info(
          receiver +
            'receive USE SECRET PASSAGE message ' +
            JSON.stringify(message)
        );
        gameManager
          .useSecretPassage()
          .then(() => {
            server
              .to(sids(Clients.gamer(server, gameId)))
              .emit(
                GameActionEvent.CLUEDO_USE_SECRET_PASSAGE.action(gameId),
                message
              );
          })
          .catch(err => logger.error(err));
      }
    )
    .on(
      GameActionEvent.CLUEDO_CONFUTATION_ASSUMPTION.action(gameId),
      (message: ConfutationMessage) => {
        logger.info(
          receiver +
            'receive CONFUTATION ASSUMPTION  game' +
            JSON.stringify(message)
        );

        Clients.gamer(server, gameId).forEach(s =>
          s.emit(GameActionEvent.CLUEDO_CONFUTATION_ASSUMPTION.action(gameId), {
            refuterGamer: message.refuterGamer,
            roundGamer: message.roundGamer,
            card:
              s.handshake.auth.gamerId === message.roundGamer
                ? message.card
                : message.card.length > 0,
          } as ConfutationMessage)
        );
      }
    )
    .on(
      GameActionEvent.CLUEDO_STAY.action(gameId),
      (message: StayGamerMessage) => {
        logger.info(receiver + 'receive STAY game ' + JSON.stringify(message));
        gameManager
          .silentGamerInRound()
          .then(() => {
            server
              .to(sids(Clients.gamer(server, gameId)))
              .emit(GameActionEvent.CLUEDO_STAY.action(gameId), message);
          })
          .catch(err => logger.error(err));
      }
    )
    .on(
      GameActionEvent.CLUEDO_LEAVE.action(gameId),
      (message: LeaveMessage) => {
        logger.info(receiver + 'receive LEAVE game ' + JSON.stringify(message));
        gameManager
          .leave(message.gamer)
          .then(() => {
            server
              .to(sids(Clients.gamer(server, gameId)))
              .emit(GameActionEvent.CLUEDO_LEAVE.action(gameId), message);
          })
          .catch(err => logger.error(err));
      }
    )
    .on(
      GameActionEvent.CLUEDO_END_ROUND.action(gameId),
      (message: NextGamerMessage) => {
        logger.info(
          receiver + 'receive END ROUND game ' + JSON.stringify(message)
        );
        gameManager
          .passRoundToNext(message)
          .then(() => {
            server
              .to(sids(Clients.gamer(server, gameId)))
              .emit(GameActionEvent.CLUEDO_END_ROUND.action(gameId), message);
          })
          .catch(err => logger.error(err));
      }
    )
    .once(
      GameActionEvent.CLUEDO_STOP_GAME.action(gameId),
      (message: StopGameMessage) => {
        logger.info(receiver + 'receive STOP game' + JSON.stringify(message));
        gameManager
          .stopGame()
          .then(() => {
            server
              .to(sids(Clients.gamer(server, gameId)))
              .emit(GameActionEvent.CLUEDO_STOP_GAME.action(gameId), message);
          })
          .catch(err => logger.error(err));
      }
    );
}

export function registerGameEventHandlers(
  server: Server,
  socket: PeerClient | PeerServer,
  {peer, peerServerManager}: AdditionalArgs
) {
  const receiver = receiverName(server, socket, peer);

  if (SocketChecker.isGamer(socket as PeerClient)) {
    registerGameActionEvent(server, socket, getAuth(socket).gameId, {
      peer,
      peerServerManager,
    });
  }

  if (SocketChecker.isPeer(socket)) {
    MongoDBGamesManager.getGames([
      CluedoGames.Status.WAITING,
      CluedoGames.Status.STARTED,
    ])
      .then(games => {
        logger.debug(receiver + ' Games to listen');
        logger.debug(games);
        games
          .map(g => g.identifier)
          .forEach(gameId =>
            registerGameActionEvent(server, socket, gameId, {
              peer,
              peerServerManager,
            })
          );
      })
      .catch(err => logger.error(err, ' So no register Game Action'));
  }

  socket
    .on(CluedoGameEvent.CLUEDO_NEW_GAME, (game: CluedoGameMessage) => {
      logger.info(receiver + 'receive new game' + JSON.stringify(game));
      MongoDBGamesManager.createGame(game)
        .then(() => {
          server
            .to(sids(Clients.real(server)))
            .emit(CluedoGameEvent.CLUEDO_NEW_GAME, game);
          registerGameActionEvent(server, socket, game.identifier, {
            peer,
            peerServerManager,
          });
        })
        .catch(err => logger.error(err, 'ADD NEW GAME'));
    })
    .on(CluedoGameEvent.CLUEDO_NEW_GAMER, (message: GamerMessage) => {
      logger.info(receiver + 'receive new gamer' + JSON.stringify(message));
      MongoDBGamesManager.gameManagers(message.game)
        .addGamer(message.gamer)
        .then(() => {
          server
            .to(sids(Clients.real(server)))
            .emit(CluedoGameEvent.CLUEDO_NEW_GAMER, message);
        })
        .catch(err => logger.error(err, 'ADD NEW GAMER'));
    })
    .on(CluedoGameEvent.CLUEDO_REMOVE_GAMER, (message: ExitGamerMessage) => {
      logger.info(receiver + 'receive remove gamer' + JSON.stringify(message));
      MongoDBGamesManager.gameManagers(message.game)
        .removeGamer(message.gamer)
        .then(() => {
          server
            .to(sids(Clients.real(server)))
            .emit(CluedoGameEvent.CLUEDO_REMOVE_GAMER, message);
        })
        .catch(err => logger.error(err, 'REMOVED GAMER'));
    });
}
