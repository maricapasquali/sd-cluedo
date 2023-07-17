import {Record, String} from 'runtypes';
import {GamerElements} from '../game-element.model';
import WeaponName = GamerElements.WeaponName;
import RoomName = GamerElements.RoomName;
import {characterConstraint} from './constraints';

export const CSuggestion = Record({
  character: characterConstraint,
  weapon: String.withConstraint(
    s => Object.values(WeaponName).includes(s as WeaponName),
    {name: 'Weapons available ' + Object.values(WeaponName)}
  ),
  room: String.withConstraint(
    s => Object.values(RoomName).includes(s as RoomName),
    {name: 'Rooms available ' + Object.values(RoomName)}
  ),
});
