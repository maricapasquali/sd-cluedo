import {io as Client, Socket} from 'socket.io-client';
import {RestAPIRouteName} from '../../../src/routes';
import {
  clientSocketConnect,
  gamersAuthenticationTokens,
  nextGamer,
} from '../../helper';
import {promises} from '@utils/test-helper';
import {logger} from '@utils/logger';
import {QueryParameters} from '../../../src/routes/parameters';
import {ResponseStatus} from '@utils/rest-api/responses';
import {NotFoundError} from '../../../src/managers/games/mongoose/errors';
import {CluedoGameEvent} from '../../../src/socket/server';
import {MongoDBGamesManager} from '../../../src/managers/games/mongoose';
import {GamerElements, Gamers} from '@model';
import * as _ from 'lodash';
import CharacterName = GamerElements.CharacterName;
import RoomName = GamerElements.RoomName;
import WeaponName = GamerElements.WeaponName;
import {v4 as uuid} from 'uuid';
import {AxiosInstance} from 'axios';
import {should as shouldFunc} from 'chai';
import GameActionEvent = CluedoGameEvent.GameActionEvent;
import Action = QueryParameters.Action;
import HousePart = GamerElements.HousePart;
import RoomWithSecretPassage = GamerElements.RoomWithSecretPassage;
import CardsDeck = GamerElements.CardsDeck;

const should = shouldFunc();

type Config = {
  axiosInstance: AxiosInstance;
  peerServerAddress: string;
  socketClients: Socket[];
};
export default function ({
  axiosInstance,
  peerServerAddress,
  socketClients,
}: Config): void {
  const gamer1: Gamer = {
    identifier: uuid(),
    username: 'lollo',
    characterToken: GamerElements.CharacterName.REVEREND_GREEN,
  };
  const gamer2: Gamer = {
    identifier: uuid(),
    username: 'cicco',
    characterToken: GamerElements.CharacterName.MRS_PEACOCK,
  };
  const gamer3: Gamer = {
    identifier: uuid(),
    username: 'anna#1',
    characterToken: GamerElements.CharacterName.MRS_WHITE,
  };
  let gInRound: Gamer;
  let gamerInRound: string;
  let game: CluedoGame;
  const gamersSocket: Socket[] = [];
  const othersSocketGamers: Socket[] = [];
  const othersSocketPeers: Socket[] = [];
  const othersSocketRealClientNoGamer: Socket[] = [];
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
        game.gamers.forEach(g => {
          gamersSocket.push(
            Client(peerServerAddress, {
              secure: true,
              autoConnect: false,
              rejectUnauthorized: false,
              auth: {
                gameId: game.identifier,
                gamerId: g.identifier,
              },
            })
          );
        });
        return Promise.all(clientSocketConnect(gamersSocket));
      })
      .then(() => {
        othersSocketGamers.push(
          ...gamersSocket.filter(s => (s.auth as any).gamerId !== gamerInRound)
        );
        othersSocketPeers.push(
          ...socketClients.filter(s => (s.auth as any)?.peerId)
        );
        othersSocketRealClientNoGamer.push(
          ...socketClients.filter(s => !othersSocketPeers.includes(s))
        );
        done();
      })
      .catch(done);
  });

  it('when a gamer starts game, other clients should receive it', done => {
    const othersSocketGamersReceivers = promises(othersSocketGamers, client => {
      return (resolve, reject) => {
        client.once(
          GameActionEvent.CLUEDO_START.action(game.identifier),
          (message: CluedoGameMessage) => {
            try {
              logger.debug('GAMER CLIENT: receive started cluedo game');
              should.exist(message);
              should.exist(message.gamers);
              should.not.exist(message.solution);
              const gamer = message.gamers.find(
                g => g.identifier === client.auth.gamerId
              );
              gamer?.should.have.property('cards');
              gamer?.should.have.property('notes');
              for (const gamer of message.gamers.filter(
                g => g.identifier !== client.auth.gamerId
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
    });

    const othersSocketPeersReceivers = promises(othersSocketPeers, client => {
      return (resolve, reject) => {
        client.once(
          GameActionEvent.CLUEDO_START.action(game.identifier),
          (message: CluedoGameMessage) => {
            try {
              logger.debug('PEER CLIENT: receive started cluedo game');
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
      othersSocketRealClientNoGamer,
      client => {
        return (resolve, reject) => {
          client.once(
            GameActionEvent.CLUEDO_START.action(game.identifier),
            (message: CluedoGameMessage) => {
              try {
                logger.debug('NO GAMERS CLIENT: receive started cluedo game');
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

  describe('when a gamer in round', () => {
    it('rolls die, other gamers and peers (clients) should receive it', done => {
      const receivers = promises(
        [...othersSocketGamers, ...othersSocketPeers],
        client => {
          return (resolve, reject) => {
            client.once(
              GameActionEvent.CLUEDO_ROLL_DICE.action(game.identifier),
              (message: RollDiceMessage) => {
                try {
                  logger.debug(
                    (client.auth.peerId ? 'PEER CLIENT' : 'GAMER CLIENT') +
                      ' receive roll dice message'
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
    it('makes assumption, other gamers and peers (clients) should receive it', done => {
      const receivers = promises(
        [...othersSocketGamers, ...othersSocketPeers],
        client => {
          return (resolve, reject) => {
            client.once(
              GameActionEvent.CLUEDO_MAKE_ASSUMPTION.action(game.identifier),
              (message: SuggestionMessage) => {
                try {
                  logger.debug(
                    (client.auth.peerId ? 'PEER CLIENT' : 'GAMER CLIENT') +
                      ' receive make assumption message'
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
    it('makes accusation, other gamers and peers (clients) should receive it', done => {
      const accusation: Suggestion = {
        character: CharacterName.MRS_WHITE,
        room: RoomName.BILLIARD_ROOM,
        weapon: WeaponName.SPANNER,
      };

      const receivers = promises(
        [...othersSocketGamers, ...othersSocketPeers],
        client => {
          return (resolve, reject) => {
            client.once(
              GameActionEvent.CLUEDO_MAKE_ACCUSATION.action(game.identifier),
              (message: AccusationMessage) => {
                try {
                  logger.debug(
                    (client.auth.peerId ? 'PEER CLIENT' : 'GAMER CLIENT') +
                      ' receive make accusation message'
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
        [...othersSocketGamers, ...othersSocketPeers],
        client => {
          return (resolve, reject) => {
            client.once(
              GameActionEvent.CLUEDO_USE_SECRET_PASSAGE.action(game.identifier),
              (message: ToRoomMessage) => {
                try {
                  logger.debug(
                    (client.auth.peerId ? 'PEER CLIENT' : 'GAMER CLIENT') +
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
            logger.debug(' gamer in round is not in room with secret passage');
            done();
          } else {
            done(err);
          }
        });
    });
  });

  describe('when a no in round gamer', () => {
    it('refutes an assumption, others gamers should receive it', done => {
      const _nextGamerId = nextGamer(game, gamerInRound);
      const othersGamersReceiver = promises(
        socketClients.filter(
          s =>
            (s.auth as any)?.gamerId &&
            (s.auth as any)?.gamerId !== _nextGamerId
        ),
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
                  if ((client.auth as any)?.gamerId === gamerInRound) {
                    logger.debug(
                      'GAMER IN ROUND receive confutation message %s',
                      JSON.stringify(message)
                    );
                    message.card.should.be.oneOf(['', ...CardsDeck]);
                  } else {
                    logger.debug(
                      'other GAMERS receive confutation message %s',
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
    it('decides to stay (after wrong accusation), other gamers and peers (clients) should receive it', done => {
      const receivers = promises(
        [...othersSocketGamers, ...othersSocketPeers],
        client => {
          return (resolve, reject) => {
            client.once(
              GameActionEvent.CLUEDO_STAY.action(game.identifier),
              (message: StayGamerMessage) => {
                try {
                  logger.debug(
                    (client.auth.peerId ? 'PEER CLIENT' : 'GAMER CLIENT') +
                      ' receive stay message message'
                  );
                  message.gamer.should.equal(gamerInRound);
                  message.roles.should
                    .contain(Gamers.Role.SILENT)
                    .and.not.contain(Gamers.Role.PARTICIPANT);
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
        [...othersSocketGamers, ...othersSocketPeers],
        client => {
          return (resolve, reject) => {
            client.once(
              GameActionEvent.CLUEDO_LEAVE.action(game.identifier),
              (message: LeaveMessage) => {
                try {
                  logger.debug(
                    (client.auth.peerId ? 'PEER CLIENT' : 'GAMER CLIENT') +
                      ' receive leave message'
                  );
                  should.exist(message);
                  _.flatten(
                    message.map(g => g.cards)
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
    it('ends a round, other gamers and peers (clients) should receive it', done => {
      const receivers = promises(
        [...othersSocketGamers, ...othersSocketPeers],
        client => {
          return (resolve, reject) => {
            client.once(
              GameActionEvent.CLUEDO_END_ROUND.action(game.identifier),
              (message: NextGamerMessage) => {
                try {
                  logger.debug(
                    (client.auth.peerId ? 'PEER CLIENT' : 'GAMER CLIENT') +
                      ' receive end round message'
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
    it('stops game, other gamers and peers (clients) should receive it', done => {
      const receivers = promises(
        [...othersSocketGamers, ...othersSocketPeers],
        client => {
          return (resolve, reject) => {
            client.once(
              GameActionEvent.CLUEDO_STOP_GAME.action(game.identifier),
              (message: StopGameMessage) => {
                try {
                  logger.debug(
                    (client.auth.peerId ? 'PEER CLIENT' : 'GAMER CLIENT') +
                      ' receive stop message'
                  );
                  message.should.be.a('string').and.be.equal(game.identifier);
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

  after(() => {
    gamersSocket.forEach(s => s.disconnect());
  });
}
