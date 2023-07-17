import {Array, Record, String} from 'runtypes';
import {identifierConstraint} from './constraints';
import {GamerElements} from '../game-element.model';
import {Gamers} from '../gamer.model';
import {CDevice} from './device.checker';
import CharacterName = GamerElements.CharacterName;
import WeaponName = GamerElements.WeaponName;
import RoomName = GamerElements.RoomName;
import SuspectState = GamerElements.SuspectState;
import {CSuggestion} from './game-element.checker';
import Card = GamerElements.Card;

export const CStructuedNoteItem = Record({
  name: String.withConstraint(s =>
    [
      ...Object.values(CharacterName),
      ...Object.values(RoomName),
      ...Object.values(WeaponName),
    ].includes(s as CharacterName | RoomName | WeaponName)
  ),
  suspectState: String.withConstraint(s =>
    Object.values(SuspectState).includes(s as SuspectState)
  ),
});

export const CNotes = Record({
  text: String.optional(),
  structuredNotes: CStructuedNoteItem.optional(),
});

export const CGamer = Record({
  identifier: identifierConstraint,
  username: String,
  characterToken: String.withConstraint(
    s => Object.values(CharacterName).includes(s as CharacterName),
    {name: 'Character token available ' + Object.values(CharacterName)}
  ),
  role: Array(String)
    .withConstraint(
      roles => {
        if (!roles) return true;
        return roles?.every(r =>
          Object.values(Gamers.Role).includes(r as Gamers.Role)
        );
      },
      {name: 'Gamer roles available ' + Object.values(Gamers.Role)}
    )
    .optional(),
  device: CDevice.optional(),
  assumptions: Array(CSuggestion).optional(),
  accusation: CSuggestion.optional(),
  cards: Array(String)
    .withConstraint(
      cards => {
        if (!cards) return true;
        return cards?.every(c =>
          [
            ...Object.values(CharacterName),
            ...Object.values(RoomName),
            ...Object.values(WeaponName),
          ].includes(c as Card)
        );
      },
      {
        name:
          'Cards name available ' +
          [
            ...Object.values(CharacterName),
            ...Object.values(RoomName),
            ...Object.values(WeaponName),
          ],
      }
    )
    .optional(),
  notes: CNotes.optional(),
});
