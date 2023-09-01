import {Record, String} from 'runtypes';
import {GameElements} from '../game-element.model';
import WeaponName = GameElements.WeaponName;
import RoomName = GameElements.RoomName;
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
