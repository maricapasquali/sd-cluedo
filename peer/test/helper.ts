import {logger} from '@utils/logger';
import {promises} from '@utils/test-helper';
import {Socket} from 'socket.io-client';

export const gamersAuthenticationTokens: {[gamerId: string]: string} = {};

export const games: CluedoGame[] = [];

export function nextGamer(game: CluedoGame, gamerInRound: string): string {
  const positionActualGamer = game.gamers.findIndex(
    g => g.identifier === gamerInRound
  );
  const positionNextGamer = (positionActualGamer + 1) % game.gamers.length;
  return game.gamers[positionNextGamer].identifier;
}

export function clientSocketConnect(sockets: Socket[]): Promise<void>[] {
  return promises(sockets, client => {
    return (resolve, reject) => {
      client
        .connect()
        .on('connect', () => {
          logger.debug('client connected');
          resolve(client);
        })
        .on('connect_error', reject);
    };
  });
}
