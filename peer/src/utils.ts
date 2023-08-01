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
    g.assumptions = g.assumptions?.map(a => {
      a.confutation = a.confutation?.map(c => {
        c.card = typeof c.card === 'string' && c.card.length > 0;
        return c;
      });
      return a;
    });
  });
  return _clonedGame;
}
