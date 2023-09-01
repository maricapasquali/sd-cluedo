import {RestAPIRouteName} from '../../src/routes/routesNames';
import {
  connectSomeGamerClient,
  gamersAuthenticationTokens,
  gamersClientSocket,
  getReceiverInfo,
  nextGamer,
  noGamersClientSocket,
  peerLikeClients,
} from '../helper';
import {promises} from '@utils/test-helper';
import {logger} from '@utils/logger';
import {QueryParameters} from '../../src/routes/parameters';
import {ResponseStatus} from '@utils/rest-api/responses';
import {NotFoundError} from '../../src/managers/games/mongoose/errors';
import {CluedoGameEvent} from '../../src/socket/events';
import {MongoDBGamesManager} from '../../src/managers/games/mongoose';
import {GameElements, Gamer} from '@model';
import * as _ from 'lodash';
import CharacterName = GameElements.CharacterName;
import RoomName = GameElements.RoomName;
import WeaponName = GameElements.WeaponName;
import {v4 as uuid} from 'uuid';
import {AxiosInstance} from 'axios';
import {should as shouldFunc} from 'chai';
import GameActionEvent = CluedoGameEvent.GameActionEvent;
import Action = QueryParameters.Action;
import HousePart = GameElements.HousePart;
import RoomWithSecretPassage = GameElements.RoomWithSecretPassage;
import CardsDeck = GameElements.CardsDeck;
import {getAuth} from '../../src/socket/utils';
import {SocketChecker} from '../../src/socket/checker';

const should = shouldFunc();

type Config = {
  axiosInstance: AxiosInstance;
};
export default function ({axiosInstance}: Config): void {
  const gamer1: Gamer = {
    identifier: uuid(),
    username: 'lollo',
    characterToken: GameElements.CharacterName.REVEREND_GREEN,
  };
  const gamer2: Gamer = {
    identifier: uuid(),
    username: 'cicco',
    characterToken: GameElements.CharacterName.MRS_PEACOCK,
  };
  const gamer3: Gamer = {
    identifier: uuid(),
    username: 'anna#1',
    characterToken: GameElements.CharacterName.MRS_WHITE,
  };
  let gInRound: Gamer;
  let gamerInRound: string;
  let game: CluedoGame;

  const assumption: Suggestion = {
    character: CharacterName.REVEREND_GREEN,
    room: RoomName.DINING_ROOM,
    weapon: WeaponName.DAGGER,
  };

  before(done => {
    axiosInstance
      .post(RestAPIRouteName.GAMES, gamer1)
      .then(response => {
        game = response.data;
        gInRound = game.gamers[0];
        gamerInRound = gInRound.identifier;
        gamersAuthenticationTokens[gInRound.identifier] =
          response.headers['x-access-token'];
        return axiosInstance.post(RestAPIRouteName.GAMERS, gamer2, {
          urlParams: {
            id: game.identifier,
          },
        });
      })
      .then(response => {
        game.gamers.push(response.data);
        gamersAuthenticationTokens[response.data.identifier] =
          response.headers['x-access-token'];
        return axiosInstance.post(RestAPIRouteName.GAMERS, gamer3, {
          urlParams: {
            id: game.identifier,
          },
        });
      })
      .then(response => {
        game.gamers.push(response.data);
        gamersAuthenticationTokens[response.data.identifier] =
          response.headers['x-access-token'];
        return connectSomeGamerClient(game.identifier, game.gamers);
      })
      .then(() => {
        done();
      })
      .catch(done);
  });

  it('when a gamer starts game, all other clients (even connected to other peers) should receive it', done => {
    const othersSocketGamersReceivers = promises(
      gamersClientSocket(game.identifier, gamerInRound),
      client => {
        return (resolve, reject) => {
          client.once(
            GameActionEvent.CLUEDO_START.action(game.identifier),
            (message: CluedoGameMessage) => {
              try {
                logger.debug(
                  getReceiverInfo(client) + ' receive started cluedo game'
                );
                should.exist(message);
                should.exist(message.gamers);
                should.not.exist(message.solution);
                const gamer = message.gamers.find(
                  g => g.identifier === getAuth(client).gamerId
                );
                gamer?.should.have.property('cards');
                gamer?.should.have.property('notes');
                for (const gamer of message.gamers.filter(
                  g => g.identifier !== getAuth(client).gamerId
                )) {
                  gamer?.should.not.have.property('cards');
                  gamer?.should.not.have.property('notes');
                }
                resolve();
              } catch (err) {
                reject(err);
              }
            }
          );
        };
      }
    );

    const othersSocketPeersReceivers = promises(peerLikeClients, client => {
      return (resolve, reject) => {
        client.once(
          GameActionEvent.CLUEDO_START.action(game.identifier),
          (message: CluedoGameMessage) => {
            try {
              logger.debug(
                getReceiverInfo(client) + ' receive started cluedo game'
              );
              should.exist(message);
              should.exist(message.gamers);
              should.exist(message.solution);
              for (const gamer of message.gamers) {
                gamer?.should.have.property('cards');
                gamer?.should.have.property('notes');
              }
              resolve();
            } catch (err) {
              reject(err);
            }
          }
        );
      };
    });

    const othersSocketRealClientNoGamerReceivers = promises(
      noGamersClientSocket(game.identifier),
      client => {
        return (resolve, reject) => {
          client.once(
            GameActionEvent.CLUEDO_START.action(game.identifier),
            (message: CluedoGameMessage) => {
              try {
                logger.debug(
                  getReceiverInfo(client) + ' receive started cluedo game'
                );
                should.exist(message);
                should.exist(message.gamers);
                should.not.exist(message.solution);
                for (const gamer of message.gamers) {
                  gamer?.should.not.have.property('cards');
                  gamer?.should.not.have.property('notes');
                }
                resolve();
              } catch (err) {
                reject(err);
              }
            }
          );
        };
      }
    );

    const startGame = axiosInstance
      .patch(RestAPIRouteName.GAME, null, {
        headers: {
          authorization: gamersAuthenticationTokens[gamerInRound],
        },
        urlParams: {
          id: game.identifier,
        },
        params: {
          gamer: gamerInRound,
          action: Action.START_GAME,
        },
      })
      .then(response => {
        const cluedoGame: CluedoGame = response.data;
        should.not.exist(cluedoGame.solution);
        const iGamer = cluedoGame.gamers.find(
          (g: Gamer) => g.identifier === gamerInRound
        );
        iGamer?.should.have.property('cards');
        iGamer?.should.have.property('notes');
        for (const gamer of response.data.gamers.filter(
          (g: Gamer) => g.identifier !== gamerInRound
        )) {
          gamer.should.not.have.property('cards');
          gamer.should.not.have.property('notes');
        }
      });
    Promise.all([
      ...othersSocketGamersReceivers,
      ...othersSocketPeersReceivers,
      ...othersSocketRealClientNoGamerReceivers,
      startGame,
    ])
      .then((res: any[]) => {
        if (
          res.length !==
          othersSocketGamersReceivers.length +
            othersSocketPeersReceivers.length +
            othersSocketRealClientNoGamerReceivers.length +
            1
        )
          throw new Error('Some promise has not been resolved');
        done();
      })
      .catch(done);
  });

  describe('when a game take notes, other peers should receive it (for backup purpose)', () => {
    const message: Partial<TakeNotesMessage> = {
      note: {
        text: 'Lorem ipsum dolor sit amet, consectetur adipisci elit, sed eiusmod tempor incidunt ut labore et dolore magna aliqua.',
      } as Notes,
    };
    it('using only REST API', done => {
      message.gamer = game.gamers[1].identifier;
      const receivers = promises(peerLikeClients, client => {
        return (resolve, reject) => {
          client.once(
            GameActionEvent.CLUEDO_TAKE_NOTES.action(game.identifier),
            (message: TakeNotesMessage) => {
              try {
                logger.debug(
                  getReceiverInfo(client) + ' receive take notes message'
                );
                message.should.deep.equal(message);
                resolve();
              } catch (err) {
                reject(err);
              }
            }
          );
        };
      });

      const takeNotes = axiosInstance.patch(
        RestAPIRouteName.GAME,
        message.note,
        {
          headers: {
            authorization: gamersAuthenticationTokens[message.gamer],
          },
          urlParams: {
            id: game.identifier,
          },
          params: {
            gamer: message.gamer,
            action: Action.TAKE_NOTES,
          },
        }
      );
      Promise.all([...receivers, takeNotes])
        .then((res: any[]) => {
          if (res.length !== receivers.length + 1)
            throw new Error('Some promise has not been resolved');
          done();
        })
        .catch(done);
    });

    it('using only SOCKET', done => {
      message.gamer = game.gamers[0].identifier;

      const receivers = promises(peerLikeClients, client => {
        return (resolve, reject) => {
          client.once(
            GameActionEvent.CLUEDO_TAKE_NOTES.action(game.identifier),
            (message: TakeNotesMessage) => {
              try {
                logger.debug(
                  getReceiverInfo(client) + ' receive take notes message'
                );
                message.should.deep.equal(message);
                resolve();
                resolve();
              } catch (err) {
                reject(err);
              }
            }
          );
        };
      });

      gamersClientSocket(game.identifier)
        .find(s => getAuth(s).gamerId === message.gamer)
        ?.emit(
          CluedoGameEvent.GameActionEvent.CLUEDO_TAKE_NOTES.action(
            game.identifier
          ),
          message
        );
      Promise.all(receivers)
        .then((res: any[]) => {
          if (res.length !== receivers.length)
            throw new Error('Some promise has not been resolved');
          done();
        })
        .catch(done);
    });
  });

  describe('when a gamer in round', () => {
    it('rolls die, other gamers and peers should receive it', done => {
      const receivers = promises(
        [
          ...gamersClientSocket(game.identifier, gamerInRound),
          ...peerLikeClients,
        ],
        client => {
          return (resolve, reject) => {
            client.once(
              GameActionEvent.CLUEDO_ROLL_DIE.action(game.identifier),
              (message: RollDiceMessage) => {
                try {
                  logger.debug(
                    getReceiverInfo(client) + ' receive roll dice message'
                  );
                  message.gamer.should.equal(gamerInRound);
                  message.housePart.should.oneOf(HousePart);
                  resolve();
                } catch (err) {
                  reject(err);
                }
              }
            );
          };
        }
      );

      const rollDie = axiosInstance.patch(RestAPIRouteName.GAME, null, {
        headers: {
          authorization: gamersAuthenticationTokens[gamerInRound],
        },
        urlParams: {
          id: game.identifier,
        },
        params: {
          gamer: gamerInRound,
          action: Action.ROLL_DIE,
        },
      });

      Promise.all([...receivers, rollDie])
        .then((res: any[]) => {
          if (res.length !== receivers.length + 1)
            throw new Error('Some promise has not been resolved');
          done();
        })
        .catch(done);
    });
    it('makes assumption, other gamers and peers should receive it', done => {
      const receivers = promises(
        [
          ...gamersClientSocket(game.identifier, gamerInRound),
          ...peerLikeClients,
        ],
        client => {
          return (resolve, reject) => {
            client.once(
              GameActionEvent.CLUEDO_MAKE_ASSUMPTION.action(game.identifier),
              (message: SuggestionMessage) => {
                try {
                  logger.debug(
                    getReceiverInfo(client) + ' receive make assumption message'
                  );
                  message.gamer.should.equal(gamerInRound);
                  message.suggestion.should.deep.equal(assumption);
                  resolve();
                } catch (err) {
                  reject(err);
                }
              }
            );
          };
        }
      );

      const makeAssumption = axiosInstance.patch(
        RestAPIRouteName.GAME,
        assumption,
        {
          headers: {
            authorization: gamersAuthenticationTokens[gamerInRound],
          },
          urlParams: {
            id: game.identifier,
          },
          params: {
            gamer: gamerInRound,
            action: Action.MAKE_ASSUMPTION,
          },
        }
      );

      Promise.all([...receivers, makeAssumption])
        .then((res: any[]) => {
          if (res.length !== receivers.length + 1)
            throw new Error('Some promise has not been resolved');
          done();
        })
        .catch(done);
    });
    it('makes accusation, other gamers and peers should receive it', done => {
      const accusation: Suggestion = {
        character: CharacterName.MRS_WHITE,
        room: RoomName.BILLIARD_ROOM,
        weapon: WeaponName.SPANNER,
      };

      const receivers = promises(
        [
          ...gamersClientSocket(game.identifier, gamerInRound),
          ...peerLikeClients,
        ],
        client => {
          return (resolve, reject) => {
            client.once(
              GameActionEvent.CLUEDO_MAKE_ACCUSATION.action(game.identifier),
              (message: AccusationMessage) => {
                try {
                  logger.debug(
                    getReceiverInfo(client) + ' receive make accusation message'
                  );
                  message.gamer.should.equal(gamerInRound);
                  message.suggestion.should.deep.equal(accusation);
                  message.win.should.be.a('boolean');
                  resolve();
                } catch (err) {
                  reject(err);
                }
              }
            );
          };
        }
      );

      const makeAssumption = axiosInstance.patch(
        RestAPIRouteName.GAME,
        accusation,
        {
          headers: {
            authorization: gamersAuthenticationTokens[gamerInRound],
          },
          urlParams: {
            id: game.identifier,
          },
          params: {
            gamer: gamerInRound,
            action: Action.MAKE_ACCUSATION,
          },
        }
      );

      Promise.all([...receivers, makeAssumption])
        .then((res: any[]) => {
          if (res.length !== receivers.length + 1)
            throw new Error('Some promise has not been resolved');
          done();
        })
        .catch(done);
    });
    it('uses passage secret, other gamers and peers should receive it', done => {
      const receivers = promises(
        [
          ...gamersClientSocket(game.identifier, gamerInRound),
          ...peerLikeClients,
        ],
        client => {
          return (resolve, reject) => {
            client.once(
              GameActionEvent.CLUEDO_USE_SECRET_PASSAGE.action(game.identifier),
              (message: ToRoomMessage) => {
                try {
                  logger.debug(
                    getReceiverInfo(client) +
                      ' receive to room message : room = %s',
                    message.room
                  );
                  message.gamer.should.equal(gamerInRound);
                  message.room.should.be
                    .a('string')
                    .and.be.oneOf(Object.keys(RoomWithSecretPassage));
                  resolve();
                } catch (err) {
                  reject(err);
                }
              }
            );
          };
        }
      );

      const useSecretPassage = axiosInstance.patch(
        RestAPIRouteName.GAME,
        null,
        {
          headers: {
            authorization: gamersAuthenticationTokens[gamerInRound],
          },
          urlParams: {
            id: game.identifier,
          },
          params: {
            gamer: gamerInRound,
            action: QueryParameters.Action.USE_SECRET_PASSAGE,
          },
        }
      );
      Promise.all([...receivers, useSecretPassage])
        .then((res: any[]) => {
          if (res.length !== receivers.length + 1)
            throw new Error('Some promise has not been resolved');
          done();
        })
        .catch(err => {
          const response = err?.response || {};
          if (
            (response.status as ResponseStatus) === ResponseStatus.NOT_FOUND &&
            response.data?.code === NotFoundError.NOT_FOUND_SECRET_PASSAGE
          ) {
            // gamer in round is not in room with secret passage
            logger.debug('gamer in round is not in room with secret passage');
            done();
          } else {
            done(err);
          }
        });
    });
  });

  describe('when a no in round gamer', () => {
    it('refutes an assumption, others gamers and peers should receive it', done => {
      const _nextGamerId = nextGamer(game, gamerInRound);
      const othersGamersReceiver = promises(
        [
          ...gamersClientSocket(game.identifier, _nextGamerId),
          ...peerLikeClients,
        ],
        client => {
          return (resolve, reject) => {
            client.once(
              CluedoGameEvent.GameActionEvent.CLUEDO_CONFUTATION_ASSUMPTION.action(
                game.identifier
              ),
              (message: ConfutationMessage) => {
                try {
                  message.roundGamer.should.equals(gamerInRound);
                  message.refuterGamer.should.equals(_nextGamerId);
                  const isGamer = SocketChecker.isGamer(client, gamerInRound);
                  if (isGamer || SocketChecker.isPeer(client)) {
                    logger.debug(
                      getReceiverInfo(client) +
                        (isGamer ? ' IN ROUND' : '') +
                        ' receive confutation message %s',
                      JSON.stringify(message)
                    );
                    message.card.should.be.oneOf(['', ...CardsDeck]);
                  } else {
                    logger.debug(
                      getReceiverInfo(client) +
                        ' OTHERS receive confutation message %s',
                      JSON.stringify(message)
                    );
                    message.card.should.be.a('boolean');
                  }
                  resolve(message);
                } catch (err) {
                  reject(err);
                }
              }
            );
          };
        }
      );

      const confutation = MongoDBGamesManager.gameManagers(game.identifier)
        .findGamer(_nextGamerId)
        .then(nextGamer => {
          if (!nextGamer) throw new Error(`Gamer ${_nextGamerId} not found`);
          if (!nextGamer.cards)
            throw new Error(`Gamer ${_nextGamerId} have no cards`);
          const card = nextGamer.cards.find(_card =>
            Object.values(assumption).includes(_card)
          );
          logger.debug(`Confutation card chosen is ${card}`);
          return axiosInstance.patch(RestAPIRouteName.GAME, card, {
            headers: {
              authorization: gamersAuthenticationTokens[_nextGamerId],
              'content-type': 'text/plain',
            },
            urlParams: {
              id: game.identifier,
            },
            params: {
              gamer: _nextGamerId,
              action: QueryParameters.Action.CONFUTATION_ASSUMPTION,
            },
          });
        });

      Promise.all([...othersGamersReceiver, confutation])
        .then((res: any[]) => {
          if (res.length !== othersGamersReceiver.length + 1)
            throw new Error('Some promise has not been resolved');
          done();
        })
        .catch(done);
    });
  });

  describe('when a gamer in round', () => {
    it('decides to stay (after wrong accusation), other gamers and peers should receive it', done => {
      const receivers = promises(
        [
          ...gamersClientSocket(game.identifier, gamerInRound),
          ...peerLikeClients,
        ],
        client => {
          return (resolve, reject) => {
            client.once(
              GameActionEvent.CLUEDO_STAY.action(game.identifier),
              (message: StayGamerMessage) => {
                try {
                  logger.debug(
                    getReceiverInfo(client) + ' receive stay message message'
                  );
                  message.gamer.should.equal(gamerInRound);
                  message.roles.should
                    .contain(Gamer.Role.SILENT)
                    .and.not.contain(Gamer.Role.PARTICIPANT);
                  resolve();
                } catch (err) {
                  reject(err);
                }
              }
            );
          };
        }
      );

      const stay = axiosInstance.patch(RestAPIRouteName.GAME, assumption, {
        headers: {
          authorization: gamersAuthenticationTokens[gamerInRound],
        },
        urlParams: {
          id: game.identifier,
        },
        params: {
          gamer: gamerInRound,
          action: Action.STAY,
        },
      });

      Promise.all([...receivers, stay])
        .then((res: any[]) => {
          if (res.length !== receivers.length + 1)
            throw new Error('Some promise has not been resolved');
          done();
        })
        .catch(done);
    });
    it('decides to leave (after wrong accusation), other gamers and peers (clients) should receive it', done => {
      const receivers = promises(
        [
          ...gamersClientSocket(game.identifier, gamerInRound),
          ...peerLikeClients,
        ],
        client => {
          return (resolve, reject) => {
            client.once(
              GameActionEvent.CLUEDO_LEAVE.action(game.identifier),
              (message: LeaveMessage) => {
                try {
                  logger.debug(
                    getReceiverInfo(client) + ' receive leave message'
                  );
                  should.exist(message);
                  message.gamer.should.equal(gamerInRound);
                  _.flatten(
                    message.newDisposition.map(g => g.cards)
                  ).should.to.include.members(gInRound.cards || []);
                  resolve();
                } catch (err) {
                  reject(err);
                }
              }
            );
          };
        }
      );

      const leave = axiosInstance.patch(RestAPIRouteName.GAME, assumption, {
        headers: {
          authorization: gamersAuthenticationTokens[gamerInRound],
        },
        urlParams: {
          id: game.identifier,
        },
        params: {
          gamer: gamerInRound,
          action: Action.LEAVE,
        },
      });

      Promise.all([...receivers, leave])
        .then((res: any[]) => {
          if (res.length !== receivers.length + 1)
            throw new Error('Some promise has not been resolved');
          done();
        })
        .catch(done);
    });
    it('ends a round, other gamers and peers should receive it', done => {
      const receivers = promises(
        [
          ...gamersClientSocket(game.identifier, gamerInRound),
          ...peerLikeClients,
        ],
        client => {
          return (resolve, reject) => {
            client.once(
              GameActionEvent.CLUEDO_END_ROUND.action(game.identifier),
              (message: NextGamerMessage) => {
                try {
                  logger.debug(
                    getReceiverInfo(client) + ' receive end round message'
                  );
                  message.should.be
                    .a('string')
                    .and.be.equal(nextGamer(game, gamerInRound));
                  resolve();
                } catch (err) {
                  reject(err);
                }
              }
            );
          };
        }
      );

      const endRound = axiosInstance.patch(RestAPIRouteName.GAME, assumption, {
        headers: {
          authorization: gamersAuthenticationTokens[gamerInRound],
        },
        urlParams: {
          id: game.identifier,
        },
        params: {
          gamer: gamerInRound,
          action: Action.END_ROUND,
        },
      });

      Promise.all([...receivers, endRound])
        .then((res: any[]) => {
          if (res.length !== receivers.length + 1)
            throw new Error('Some promise has not been resolved');
          done();
        })
        .catch(done);
    });
    it('stops game, other gamers, peers and no gamers should receive it', done => {
      const receivers = promises(
        [
          ...noGamersClientSocket(game.identifier),
          ...gamersClientSocket(game.identifier, gamerInRound),
          ...peerLikeClients,
        ],
        client => {
          return (resolve, reject) => {
            client.once(
              GameActionEvent.CLUEDO_STOP_GAME.action(game.identifier),
              (message: CluedoGameMessage) => {
                try {
                  logger.debug(
                    getReceiverInfo(client) + ' receive stop message'
                  );
                  message.should.have
                    .property('identifier')
                    .equal(game.identifier);
                  message.should.have.property('solution');
                  resolve();
                } catch (err) {
                  reject(err);
                }
              }
            );
          };
        }
      );

      const stopGame = axiosInstance.patch(RestAPIRouteName.GAME, assumption, {
        headers: {
          authorization: gamersAuthenticationTokens[gamerInRound],
        },
        urlParams: {
          id: game.identifier,
        },
        params: {
          gamer: gamerInRound,
          action: Action.STOP_GAME,
        },
      });

      Promise.all([...receivers, stopGame])
        .then((res: any[]) => {
          if (res.length !== receivers.length + 1)
            throw new Error('Some promise has not been resolved');
          done();
        })
        .catch(done);
    });
  });
}
