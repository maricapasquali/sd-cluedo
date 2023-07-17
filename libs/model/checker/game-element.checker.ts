import {Record, String} from 'runtypes';
import {GamerElements} from '../game-element.model';
import CharacterName = GamerElements.CharacterName;
import WeaponName = GamerElements.WeaponName;
import RoomName = GamerElements.RoomName;

export const CSuggestion = Record({
  character: String.withConstraint(
    s => Object.values(CharacterName).includes(s as CharacterName),
    {name: 'Character names available ' + Object.values(CharacterName)}
  ),
  weapon: String.withConstraint(
    s => Object.values(WeaponName).includes(s as WeaponName),
    {name: 'Weapon names available ' + Object.values(WeaponName)}
  ),
  room: String.withConstraint(
    s => Object.values(RoomName).includes(s as RoomName),
    {name: 'Room names available ' + Object.values(RoomName)}
  ),
});
