import {String} from 'runtypes';
import {validate} from 'uuid';
import {GamerElements} from '../game-element.model';
import CharacterName = GamerElements.CharacterName;

export const identifierConstraint = String.withConstraint(s => validate(s), {
  name: 'uuid format',
});

export const characterConstraint = String.withConstraint(
  s => Object.values(CharacterName).includes(s as CharacterName),
  {name: 'Characters available ' + Object.values(CharacterName)}
);
