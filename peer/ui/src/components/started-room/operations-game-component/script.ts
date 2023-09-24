import * as _ from 'lodash';
import axios, {AxiosError} from 'axios';
import {defineComponent, PropType} from 'vue';
import OperationErrorAlert from './alerts/operation-error-alert.vue';
import emitter from '@/eventbus';
import {ACTION_GAMER, CONFUTATION_CARD} from '@/eventbus/eventsName';
import socket from '@/services/socket';
import {sessionStoreManager} from '@/services/sessionstore';

import {CluedoGame, GameElements, Gamer} from '@model';
import RoomWithSecretPassage = GameElements.RoomWithSecretPassage;
import LobbyName = GameElements.LobbyName;
import {MessageError, ResponseStatus} from '@utils/rest-api/responses';
import {QueryParameters} from '@peer/routes/parameters';
import Action = QueryParameters.Action;
import {RestAPIRouteName} from '@peer/routes/routesNames';
import {CluedoGameEvent} from '@peer/socket/events';
import routesNames from '@/router/routesNames';

type VModelForModal = {show: boolean};
export default defineComponent({
  props: {
    game: {
      type: Object as PropType<CluedoGame>,
      required: true,
      default: {} as CluedoGame,
    },
  },
  components: {
    OperationErrorAlert,
  },
  data() {
    return {
      errorModalShow: false,
      denialOperationError: {
        show: false,
        action: '',
        error: {message: ''},
      } as VModelForModal & {
        action: Action | '';
        error: MessageError & {codeText?: string};
      },
      characters: [] as string[],
      rooms: [] as string[],
      weapons: [] as string[],

      makeAssumptionModal: {
        show: false,
        message: false,
        confutation: {},
        assumption: {
          character: null,
          room: null,
          weapon: null,
        } as unknown as Suggestion,
      } as VModelForModal & {
        message: boolean;
        confutation: {[key: string]: string};
        assumption: Suggestion;
      },
      makeAccusationModal: {
        show: false,
        gamerId: undefined,
        solution: {} as Suggestion,
        accusation: {
          character: null,
          room: null,
          weapon: null,
        } as unknown as Suggestion,
        win: null,
      } as VModelForModal & {
        gamerId: string | undefined;
        solution: Suggestion;
        accusation: Suggestion;
        win: boolean | null;
      },
      confutationAssumptionModal: {
        show: false,
        confute: '',
        arrivalAssumption: {suggestion: {} as Suggestion, gamer: ''},
      } as VModelForModal & {
        confute: string;
        arrivalAssumption: SuggestionMessage;
      },
      endGameModal: {
        show: false,
        solution: {} as Suggestion,
      } as VModelForModal & {solution: Suggestion},
    };
  },
  computed: {
    Action() {
      return QueryParameters.Action;
    },
    amIInRound(): boolean {
      return this.game.roundGamer === sessionStoreManager.gamer.identifier;
    },
    inRoomWithSecretPassage(): boolean {
      return !!RoomWithSecretPassage[
        this.game.characters?.find(
          c => c.name === sessionStoreManager.gamer.characterToken
        )?.place || ''
      ];
    },
    inRoundGamer(): Gamer {
      return (
        this.game.gamers?.find(g => g.identifier === this.game.roundGamer) ||
        ({} as Gamer)
      );
    },
    lastAssumptionOfInRoundGamer(): Assumption | false {
      const lastAssumptionIndex =
        (this.inRoundGamer.assumptions?.length || 0) - 1;
      return lastAssumptionIndex > -1
        ? (this.inRoundGamer.assumptions || [])[lastAssumptionIndex]
        : false;
    },
    nextGamer(): Gamer {
      return this.nextGamerOf(this.game.roundGamer || '');
    },
    inLobby(): boolean {
      return Object.values(LobbyName).includes(
        this.game.characters?.find(
          c => c.name === sessionStoreManager.gamer.characterToken
        )?.place as LobbyName
      );
    },
    myPositionInHouse(): string {
      return (
        this.game.characters?.find(
          c => c.name === sessionStoreManager.gamer.characterToken
        )?.place || ''
      );
    },
    myCardOnAssumption() {
      return (
        this.game.gamers
          ?.find(g => g.identifier === sessionStoreManager.gamer.identifier)
          ?.cards?.filter(c =>
            Object.values(
              this.confutationAssumptionModal.arrivalAssumption.suggestion
            ).includes(c)
          ) || []
      );
    },
  },
  methods: {
    nextGamerOf(id: string): Gamer {
      if (!this.game.gamers) return {} as Gamer;
      let nextIndex = this.game.gamers.findIndex(g => g.identifier === id);
      do {
        nextIndex = (nextIndex + 1) % this.game.gamers.length;
      } while (this.game.gamers[nextIndex].role?.includes(Gamer.Role.SILENT));
      return this.game.gamers[nextIndex] || ({} as Gamer);
    },
    nextConfutationGamer(id: string): Gamer {
      let nextIndex = this.game.gamers.findIndex(g => g.identifier === id);
      nextIndex = (nextIndex + 1) % this.game.gamers.length;
      return this.game.gamers[nextIndex] || ({} as Gamer);
    },
    gamer(gamerId: string): Gamer {
      return (
        this.game.gamers?.find(g => g.identifier === gamerId) || ({} as Gamer)
      );
    },
    username(gamerId: string): string {
      const gamer = this.game.gamers?.find(g => g.identifier === gamerId);
      return gamer ? `${gamer.characterToken} (${gamer.username})` : '';
    },
    moveCharacterTokenIn(place: string, character?: string) {
      const _character = character || sessionStoreManager.gamer.characterToken;
      const fCharacter = this.game.characters?.find(c => c.name === _character);
      if (fCharacter) {
        fCharacter.place = place;
      }
    },
    moveWeaponTokenIn(place: string, weapon: string) {
      const fWeapon = this.game.weapons?.find(c => c.name === weapon);
      if (fWeapon) fWeapon.place = place;
    },
    handlerError(error: AxiosError, action: Action) {
      this.denialOperationError.show = true;
      this.denialOperationError.action = action;
      this.denialOperationError.error.cause = (
        error.response?.data as any
      ).cause;
      this.denialOperationError.error.codeText = error.response?.statusText;
      this.denialOperationError.error.code = error.response?.status;
      if (
        error.response?.status === ResponseStatus.UNAUTHORIZED ||
        error.response?.status === ResponseStatus.FORBIDDEN
      ) {
        this.denialOperationError.error.message = `'${action}' operation denied`;
      } else {
        this.denialOperationError.error.message = (
          error.response?.data as any
        ).message;
      }
    },

    /* END ROUND */
    oneGamerLeft(solution: Suggestion) {
      if (!this.endGameModal.show) {
        this.endGameModal.show = true;
        this.endGameModal.solution = solution;
        emitter.emit(ACTION_GAMER, {
          gamer: this.game?.roundGamer || '',
          action: Action.END_ROUND,
          message: solution,
        });
      }
    },

    endRound(leave = false) {
      axios
        .patch(
          RestAPIRouteName.GAME.replace(':id', this.game.identifier),
          null,
          {
            headers: {
              authorization: sessionStoreManager.accessToken,
            },
            params: {
              gamer: sessionStoreManager.gamer.identifier,
              action: Action.END_ROUND,
            },
          }
        )
        .then(response => {
          console.debug('END ROUND ', response.data);
          this.resetMakeAssumptionModal();
          this.resetMakeAccusationModal();
          if (leave) {
            sessionStoreManager.remove();
            this.$router.replace({name: routesNames.HOME});
          } else if (typeof response.data === 'string') {
            emitter.emit(ACTION_GAMER, {
              gamer: this.game?.roundGamer || '',
              action: Action.END_ROUND,
              message: response.data,
            });
            this.game.roundGamer = response.data;
          } else {
            // GAME OVER WITHOUT WINNER
            this.oneGamerLeft(response.data);
            this.stopGame();
          }
        })
        .catch(err => {
          if (err?.resonse?.status === ResponseStatus.GONE) {
            sessionStoreManager.remove();
            this.$router.replace({name: routesNames.HOME});
          } else this.handlerError(err, Action.END_ROUND);
        });
    },

    /* ROLL DIE */
    rollDie() {
      this.denialOperationError.show = false;
      axios
        .patch(
          RestAPIRouteName.GAME.replace(':id', this.game.identifier),
          null,
          {
            headers: {
              authorization: sessionStoreManager.accessToken,
            },
            params: {
              gamer: sessionStoreManager.gamer.identifier,
              action: Action.ROLL_DIE,
            },
          }
        )
        .then(response => {
          this.moveCharacterTokenIn(response.data);

          emitter.emit(ACTION_GAMER, {
            gamer: sessionStoreManager.gamer.identifier,
            action: Action.ROLL_DIE,
            message: {
              gamer: sessionStoreManager.gamer.identifier,
              housePart: response.data,
            } as RollDiceMessage,
          });
          if (Object.values(LobbyName).includes(response.data as LobbyName)) {
            this.endRound();
          }
        })
        .catch((err: AxiosError) => this.handlerError(err, Action.ROLL_DIE));
    },

    /*MAKE ASSUMPTION*/
    addAssumption(suggestion: Suggestion) {
      console.debug(
        'Gamer in round make assumption (suggestion): ',
        suggestion
      );
      const assumption: Assumption = {
        ...suggestion,
        confutation: [],
      };
      console.debug('Gamer in round assumption: ', assumption);
      if (this.inRoundGamer.assumptions) {
        this.inRoundGamer.assumptions.push(assumption);
      } else {
        this.inRoundGamer.assumptions = [assumption];
      }
      console.debug('Gamer in round ', this.inRoundGamer);
    },
    checkIfMakingAssumptions(noMoreAssumptionCallback?: () => void) {
      if (
        sessionStoreManager.gamer.identifier === this.inRoundGamer.identifier &&
        this.lastAssumptionOfInRoundGamer
      ) {
        const conf = this.lastAssumptionOfInRoundGamer.confutation || [];
        if (conf.length === 0) {
          this.makeAssumptionModal.show = true;
          this.makeAssumptionModal.assumption =
            this.lastAssumptionOfInRoundGamer;
        }
        if (
          conf.length < this.game?.gamers.length - 1 &&
          conf.every(c => c.card === '')
        ) {
          this.makeAssumptionModal.show = true;
          this.makeAssumptionModal.message = true;
          this.makeAssumptionModal.assumption =
            this.lastAssumptionOfInRoundGamer;
          conf.forEach(c => {
            this.makeAssumptionModal.confutation[c.gamer] = c.card as string;
          });
        }

        if (
          this.makeAssumptionModal.assumption.room !== null &&
          typeof noMoreAssumptionCallback === 'function'
        ) {
          noMoreAssumptionCallback();
        }
      }
    },

    resetMakeAssumptionModal() {
      this.makeAssumptionModal = {
        show: false,
        message: false,
        confutation: {},
        assumption: {
          character: null,
          room: null,
          weapon: null,
        } as unknown as Suggestion,
      };
    },

    onClickMakeAssumption() {
      this.makeAssumptionModal.show = true;
      this.makeAssumptionModal.assumption.room = this.myPositionInHouse;
    },

    makeAssumption() {
      this.denialOperationError.show = false;
      axios
        .patch(
          RestAPIRouteName.GAME.replace(':id', this.game.identifier),
          this.makeAssumptionModal.assumption,
          {
            headers: {
              authorization: sessionStoreManager.accessToken,
            },
            params: {
              gamer: sessionStoreManager.gamer.identifier,
              action: Action.MAKE_ASSUMPTION,
            },
          }
        )
        .then(response => {
          emitter.emit(ACTION_GAMER, {
            gamer: sessionStoreManager.gamer.identifier,
            action: Action.MAKE_ASSUMPTION,
            message: response.data,
          });
          this.addAssumption(this.makeAssumptionModal.assumption);
          this.makeAssumptionModal.message = true;
          this.moveCharacterTokenIn(
            this.makeAssumptionModal.assumption.room || '',
            this.makeAssumptionModal.assumption.character
          );
          this.moveWeaponTokenIn(
            this.makeAssumptionModal.assumption.room || '',
            this.makeAssumptionModal.assumption.weapon || ''
          );
        })
        .catch(err => this.handlerError(err, Action.MAKE_ASSUMPTION));
    },

    clickOkOnReceiveConfutation() {
      Object.values(this.makeAssumptionModal.confutation)
        .filter(c => c && c.length > 0)
        .forEach(c => {
          const iGamer = this.game.gamers.find(
            g => sessionStoreManager.gamer.identifier === g.identifier
          );
          if (iGamer) {
            const excluded = {
              name: c,
              suspectState: GameElements.SuspectState.EXCLUDED,
            };
            const itemCard = iGamer.notes?.structuredNotes?.find(
              i => i.name === excluded.name
            );
            if (itemCard) {
              Object.assign(itemCard, excluded);
            } else {
              iGamer.notes?.structuredNotes?.push(excluded);
            }
          }
        });

      emitter.emit(CONFUTATION_CARD, {
        assumption: this.makeAssumptionModal.assumption,
        card:
          Object.values(this.makeAssumptionModal.confutation).find(
            c => c && c.length > 0
          ) || '',
      });

      this.endRound();
    },

    /*MAKE ACCUSATION*/

    checkIfMakingAccusation() {
      if (
        this.amIInRound &&
        Object.keys(this.inRoundGamer.accusation || {}).length > 0
      ) {
        this.makeAccusationModal.show = true;
        this.makeAccusationModal.accusation =
          this.inRoundGamer.accusation || ({} as Suggestion);
        const resMakeAccusation = sessionStoreManager.history.find(
          i =>
            i.gamer === sessionStoreManager.gamer.identifier &&
            i.action === Action.MAKE_ACCUSATION
        );
        if (resMakeAccusation) {
          this.makeAccusationModal.solution =
            resMakeAccusation?.message.solution;
          this.makeAccusationModal.win =
            resMakeAccusation?.message.win ||
            _.isEqual(
              this.makeAccusationModal.accusation,
              this.makeAccusationModal.solution
            );
        } else {
          this.makeAccusation();
        }
      }
    },

    resetMakeAccusationModal() {
      this.makeAccusationModal = {
        show: false,
        gamerId: undefined,
        solution: {} as Suggestion,
        accusation: {
          character: null,
          room: null,
          weapon: null,
        } as unknown as Suggestion,
        win: null,
      };
    },

    onClickMakeAccusation() {
      this.makeAccusationModal.show = true;
    },

    makeAccusation() {
      this.denialOperationError.show = false;
      axios
        .patch(
          RestAPIRouteName.GAME.replace(':id', this.game.identifier),
          this.makeAccusationModal.accusation,
          {
            headers: {
              authorization: sessionStoreManager.accessToken,
            },
            params: {
              gamer: sessionStoreManager.gamer.identifier,
              action: Action.MAKE_ACCUSATION,
            },
          }
        )
        .then(response => {
          emitter.emit(ACTION_GAMER, {
            gamer: sessionStoreManager.gamer.identifier,
            action: Action.MAKE_ACCUSATION,
            message: response.data,
          });

          this.makeAccusationModal.solution = response.data.solution;
          this.makeAccusationModal.win = _.isEqual(
            this.makeAccusationModal.accusation,
            this.makeAccusationModal.solution
          );
          if (this.makeAccusationModal.win) {
            this.stopGame();
          }
        })
        .catch(err => this.handlerError(err, Action.MAKE_ACCUSATION));
    },

    stopGame() {
      this.denialOperationError.show = false;
      if (this.game.status === CluedoGame.Status.FINISHED) return;
      axios
        .patch(
          RestAPIRouteName.GAME.replace(':id', this.game.identifier),
          null,
          {
            headers: {
              authorization: sessionStoreManager.accessToken,
            },
            params: {
              gamer: sessionStoreManager.gamer.identifier,
              action: Action.STOP_GAME,
            },
          }
        )
        .then(response => {
          if (response.data.gamers.length <= 1) {
            this.oneGamerLeft(response.data.solution);
          }
          console.debug(`Game ${this.game?.identifier} is finished.`);
        })
        .catch(err => {
          if (
            this.game.status === CluedoGame.Status.FINISHED &&
            err.response.status === ResponseStatus.FORBIDDEN
          ) {
            console.debug('Game has already stopped');
          } else this.handlerError(err, Action.STOP_GAME);
        });
    },

    finishedGameSoGoHomePage() {
      sessionStoreManager.remove();
      this.$router.replace({name: routesNames.HOME});
    },

    leaveGame() {
      this.denialOperationError.show = false;
      axios
        .patch(
          RestAPIRouteName.GAME.replace(':id', this.game.identifier),
          null,
          {
            headers: {
              authorization: sessionStoreManager.accessToken,
            },
            params: {
              gamer: sessionStoreManager.gamer.identifier,
              action: Action.LEAVE,
            },
          }
        )
        .then(() => this.endRound(true))
        .catch(err => this.handlerError(err, Action.LEAVE));
    },

    stayInGame() {
      this.denialOperationError.show = false;
      axios
        .patch(
          RestAPIRouteName.GAME.replace(':id', this.game.identifier),
          null,
          {
            headers: {
              authorization: sessionStoreManager.accessToken,
            },
            params: {
              gamer: sessionStoreManager.gamer.identifier,
              action: Action.STAY,
            },
          }
        )
        .then(response => {
          emitter.emit(ACTION_GAMER, {
            gamer: sessionStoreManager.gamer.identifier,
            action: Action.STAY,
            message: response.data,
          });
          const fGamer = this.game?.gamers.find(
            g => g.identifier === sessionStoreManager.gamer.identifier
          );
          if (fGamer) {
            fGamer.role = response.data;
            sessionStoreManager.accessToken =
              response.headers['x-access-token'];
          }
          this.endRound();
        })
        .catch(err => this.handlerError(err, Action.STAY));
    },

    /* CONFUTATIONS */
    addConfutation(confItem: {gamer: string; card: boolean}) {
      if (this.lastAssumptionOfInRoundGamer) {
        if (this.lastAssumptionOfInRoundGamer.confutation) {
          this.lastAssumptionOfInRoundGamer.confutation.push(confItem);
        } else {
          this.lastAssumptionOfInRoundGamer.confutation = [confItem];
        }
      }
    },

    checkIfMakingConfutation() {
      if (
        sessionStoreManager.gamer.identifier !== this.inRoundGamer.identifier &&
        this.lastAssumptionOfInRoundGamer
      ) {
        const conf = this.lastAssumptionOfInRoundGamer.confutation || [];
        if (
          conf &&
          !(
            conf.length === this.game?.gamers.length - 1 ||
            conf.some(c => c.card === true)
          )
        ) {
          const roundConf = this.nextConfutationGamer(
            conf[conf.length - 1]?.gamer || this.inRoundGamer.identifier
          );
          if (roundConf.identifier === sessionStoreManager.gamer.identifier) {
            this.confutationAssumptionModal.show = true;
            this.confutationAssumptionModal.arrivalAssumption = {
              gamer: this.inRoundGamer.identifier,
              suggestion: this.lastAssumptionOfInRoundGamer,
            };
          }
        }
      }
    },

    resetConfutationAssumptionModal() {
      this.confutationAssumptionModal = {
        show: false,
        confute: '',
        arrivalAssumption: {suggestion: {} as Suggestion, gamer: ''},
      };
    },
    confutationGamerAssumption() {
      this.denialOperationError.show = false;
      axios
        .patch(
          RestAPIRouteName.GAME.replace(':id', this.game.identifier),
          this.confutationAssumptionModal.confute,
          {
            headers: {
              authorization: sessionStoreManager.accessToken,
              'content-type': 'text/plain',
            },
            params: {
              gamer: sessionStoreManager.gamer.identifier,
              action: Action.CONFUTATION_ASSUMPTION,
            },
          }
        )
        .then(res => {
          console.debug('Confute ', res.data);
          emitter.emit(ACTION_GAMER, {
            gamer: res.data.refuterGamer,
            action: Action.CONFUTATION_ASSUMPTION,
            message: res.data,
          });
          this.addConfutation({
            gamer: sessionStoreManager.gamer.identifier,
            card: this.confutationAssumptionModal.confute.length > 0,
          });
          this.resetConfutationAssumptionModal();
        })
        .catch((err: AxiosError) =>
          this.handlerError(err, Action.CONFUTATION_ASSUMPTION)
        );
    },

    /*USE SECRET PASSAGE*/
    useSecretPassage() {
      this.denialOperationError.show = false;
      axios
        .patch(
          RestAPIRouteName.GAME.replace(':id', this.game.identifier),
          null,
          {
            headers: {
              authorization: sessionStoreManager.accessToken,
            },
            params: {
              gamer: sessionStoreManager.gamer.identifier,
              action: Action.USE_SECRET_PASSAGE,
            },
          }
        )
        .then(response => {
          this.moveCharacterTokenIn(response.data);
          emitter.emit(ACTION_GAMER, {
            gamer: sessionStoreManager.gamer.identifier,
            action: Action.USE_SECRET_PASSAGE,
            message: response.data,
          });
        })
        .catch(err => this.handlerError(err, Action.USE_SECRET_PASSAGE));
    },

    /* SOCKET EVENTS */
    setSocketListeners() {
      const gameId = this.game.identifier;
      socket
        .on(
          CluedoGameEvent.GameActionEvent.CLUEDO_ROLL_DIE.action(gameId),
          (message: RollDiceMessage) => {
            this.moveCharacterTokenIn(
              message.housePart,
              this.gamer(message.gamer).characterToken
            );
            emitter.emit(ACTION_GAMER, {
              gamer: message.gamer,
              action: Action.ROLL_DIE,
              message,
            });
          }
        )
        .on(
          CluedoGameEvent.GameActionEvent.CLUEDO_MAKE_ASSUMPTION.action(gameId),
          (message: SuggestionMessage) => {
            this.moveCharacterTokenIn(
              message.suggestion.room,
              message.suggestion.character
            );
            this.moveWeaponTokenIn(
              message.suggestion.room,
              message.suggestion.weapon
            );

            this.addAssumption(message.suggestion);

            emitter.emit(ACTION_GAMER, {
              gamer: message.gamer,
              action: Action.MAKE_ASSUMPTION,
              message,
            });

            const nextConfGamer = this.nextConfutationGamer(
              this.game?.roundGamer || ''
            );
            this.confutationAssumptionModal.arrivalAssumption = message;
            if (
              nextConfGamer.identifier === sessionStoreManager.gamer.identifier
            ) {
              this.confutationAssumptionModal.show = true;
            }
          }
        )
        .on(
          CluedoGameEvent.GameActionEvent.CLUEDO_CONFUTATION_ASSUMPTION.action(
            gameId
          ),
          (message: ConfutationMessage) => {
            emitter.emit(ACTION_GAMER, {
              gamer: message.refuterGamer,
              action: Action.CONFUTATION_ASSUMPTION,
              message,
            });
            this.addConfutation({
              gamer: message.refuterGamer,
              card:
                typeof message.card === 'string'
                  ? message.card.length > 0
                  : message.card,
            });
            if (sessionStoreManager.gamer.identifier === message.roundGamer) {
              this.makeAssumptionModal.confutation[message.refuterGamer] =
                message.card as string;
              if (
                Object.values(this.makeAssumptionModal.confutation).some(
                  c => c.length > 0
                ) ||
                Object.keys(this.makeAssumptionModal.confutation).length ===
                  this.game?.gamers.length - 1
              ) {
                this.clickOkOnReceiveConfutation();
              }
            } else if (!(message.card as unknown as boolean)) {
              const nextConfGamer = this.nextConfutationGamer(
                message.refuterGamer
              );
              if (
                nextConfGamer.identifier !== this.game?.roundGamer &&
                nextConfGamer.identifier ===
                  sessionStoreManager.gamer.identifier
              ) {
                this.confutationAssumptionModal.show = true;
                this.confutationAssumptionModal.arrivalAssumption = {
                  gamer: this.inRoundGamer.identifier,
                  suggestion: this.lastAssumptionOfInRoundGamer as Assumption,
                };
              }
            } else {
              this.resetConfutationAssumptionModal();
            }
          }
        )
        .on(
          CluedoGameEvent.GameActionEvent.CLUEDO_MAKE_ACCUSATION.action(gameId),
          (message: AccusationMessage) => {
            if (message.win) {
              this.makeAccusationModal.show = true;
              this.makeAccusationModal.solution = message.suggestion;
              this.makeAccusationModal.win = true;
              this.makeAccusationModal.accusation = message.suggestion;
              this.makeAccusationModal.gamerId = message.gamer;
            }
            emitter.emit(ACTION_GAMER, {
              gamer: message.gamer,
              action: Action.MAKE_ACCUSATION,
              message,
            });
          }
        )
        .on(
          CluedoGameEvent.GameActionEvent.CLUEDO_USE_SECRET_PASSAGE.action(
            gameId
          ),
          (message: ToRoomMessage) => {
            this.moveCharacterTokenIn(
              message.room,
              this.gamer(message.gamer).characterToken
            );
            emitter.emit(ACTION_GAMER, {
              gamer: message.gamer,
              action: Action.USE_SECRET_PASSAGE,
              message,
            });
          }
        )
        .on(
          CluedoGameEvent.GameActionEvent.CLUEDO_END_ROUND.action(gameId),
          (message: NextGamerMessage | Suggestion) => {
            console.debug('END ROUND MESSAGE ', message);
            if (typeof message === 'string') {
              emitter.emit(ACTION_GAMER, {
                gamer: this.game.roundGamer || '',
                action: Action.END_ROUND,
                message,
              });
              this.game.roundGamer = message;
            } else {
              // GAME OVER WITHOUT WINNER
              this.oneGamerLeft(message);
            }
          }
        )
        .on(
          CluedoGameEvent.GameActionEvent.CLUEDO_STAY.action(gameId),
          (message: StayGamerMessage) => {
            console.debug('STAY MESSAGE : ', message);
            this.gamer(message.gamer).role = message.roles;
            emitter.emit(ACTION_GAMER, {
              gamer: message.gamer,
              action: Action.STAY,
              message,
            });
          }
        )
        .on(
          CluedoGameEvent.GameActionEvent.CLUEDO_LEAVE.action(gameId),
          (message: LeaveMessage) => {
            console.debug('LEAVE MESSAGE : ', message);
            const gamerIndex = this.game?.gamers.findIndex(
              gm => gm.identifier === message.gamer
            );
            if (gamerIndex > -1) {
              this.game?.gamers.splice(gamerIndex, 1);
            }
            message.newDisposition.forEach(newDispositionItem => {
              this.gamer(newDispositionItem.gamer).cards =
                newDispositionItem.cards;
            });
            emitter.emit(ACTION_GAMER, {
              gamer: message.gamer,
              action: Action.LEAVE,
              message,
            });
            if (
              this.game?.gamers.filter(
                g => !g.role?.includes(Gamer.Role.SILENT)
              ).length <= 1
            ) {
              this.stopGame();
            } else {
              this.checkIfMakingAssumptions(() => this.endRound());
              this.checkIfMakingConfutation();
            }
          }
        )
        .on(
          CluedoGameEvent.GameActionEvent.CLUEDO_STOP_GAME.action(gameId),
          (message: CluedoGameMessage) => {
            console.log('Stopped Game Message ', message);
            this.game.status = message.status;
          }
        );
    },
  },
  mounted() {
    this.characters = this.game.characters?.map(w => w.name) || [];
    this.rooms = this.game.rooms?.map(w => w.name) || [];
    this.weapons = this.game.weapons?.map(w => w.name) || [];
    this.setSocketListeners();
    this.checkIfMakingAssumptions();
    this.checkIfMakingAccusation();
    this.checkIfMakingConfutation();
  },
});
