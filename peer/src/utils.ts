import * as _ from 'lodash';

export function getStartedCluedoGame(
  cluedoGame: CluedoGame,
  gamer?: string
): CluedoGame {
  const _clonedGame = _.cloneDeep(cluedoGame);
  delete _clonedGame.solution;
  const _gamers = gamer
    ? _clonedGame.gamers.filter(g => g.identifier !== gamer)
    : _clonedGame.gamers;

  _gamers.forEach(g => {
    delete g.cards;
    delete g.notes;
  });
  return _clonedGame;
}
