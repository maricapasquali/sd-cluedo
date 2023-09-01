import {Array, Record, String, Boolean} from 'runtypes';
import {characterConstraint, identifierConstraint} from './constraints';
import {GameElements} from '../game-element.model';
import {Gamer} from '../gamer.model';
import {CDevice} from './device.checker';
import SuspectState = GameElements.SuspectState;
import {CSuggestion} from './game-element.checker';
import Card = GameElements.Card;
import CardsDeck = GameElements.CardsDeck;

export const CStructuredNoteItem = Record({
  name: String.withConstraint(s => CardsDeck.includes(s as Card), {
    name: 'StructuredNoteItem name available ' + CardsDeck,
  }),
  suspectState: String.withConstraint(
    s => ['', ...Object.values(SuspectState)].includes(s),
    {
      name: 'Suspect States available ' + ['', ...Object.values(SuspectState)],
    }
  ),
  confutation: Boolean.withConstraint(c => c === true, {
    name: "Confutation value only 'true'",
  }).optional(),
});

export const CNotes = Record({
  text: String.optional(),
  structuredNotes: Array(CStructuredNoteItem).optional(),
});

export const CGamer = Record({
  identifier: identifierConstraint,
  username: String,
  characterToken: characterConstraint,
  role: Array(String)
    .withConstraint(
      roles => {
        if (!roles) return true;
        return roles?.every(r =>
          Object.values(Gamer.Role).includes(r as Gamer.Role)
        );
      },
      {name: 'Gamer roles available ' + Object.values(Gamer.Role)}
    )
    .optional(),
  device: CDevice.optional(),
  assumptions: Array(CSuggestion).optional(),
  accusation: CSuggestion.optional(),
  cards: Array(String)
    .withConstraint(
      cards => {
        if (!cards) return true;
        return cards?.every(c => CardsDeck.includes(c as Card));
      },
      {
        name: 'Cards available ' + CardsDeck,
      }
    )
    .optional(),
  notes: CNotes.optional(),
});
