import {Document, model, Model, Schema} from 'mongoose';
import {CluedoGames, Gamers, GamerElements} from '@model';
import * as net from 'net';

export type DocCluedoGame = CluedoGame & Document;

const CluedoGameSchema: Schema<DocCluedoGame> = new Schema<DocCluedoGame>({
  identifier: {type: String, required: true},
  status: {
    type: String,
    required: false,
    default: CluedoGames.Status.WAITING,
    enum: Object.values(CluedoGames.Status),
  },
  gamers: {
    type: [
      {
        _id: false,
        identifier: {
          type: String,
          required: true,
        },
        username: {
          type: String,
          required: true,
        },
        characterToken: {
          type: String,
          required: true,
        },
        role: {
          type: [String],
          required: false,
          default: [Gamers.Role.PARTICIPANT],
          enum: Object.values(Gamers.Role),
        },
        assumptions: {
          type: [
            {
              _id: false,
              room: String,
              character: String,
              weapon: String,
            },
          ],
          default: [],
          required: false,
        },
        accusation: {
          type: {
            _id: false,
            room: String,
            character: String,
            weapon: String,
          },
          default: {},
          required: false,
        },
        device: {
          type: {
            identifier: {
              type: String,
              required: true,
            },
            hostname: {
              type: String,
              required: true,
            },
            address: {
              type: String,
              required: false,
              validate: {
                validator: function (v: string) {
                  return net.isIPv4(v);
                },
                message: props =>
                  `${props.value} is not a valid device address!`,
              },
            },
          },
          required: false,
        },
        cards: {
          type: [String],
          required: false,
          default: [],
          enum: [
            ...Object.values(GamerElements.RoomName),
            ...Object.values(GamerElements.CharacterName),
            ...Object.values(GamerElements.WeaponName),
          ],
        },
        notes: {
          type: {
            _id: false,
            text: {
              type: String,
              required: false,
            },
            structuredNotes: {
              type: [
                {
                  _id: false,
                  name: String,
                  suspectState: String,
                },
              ],
              required: false,
            },
          },
          default: {},
          required: false,
        },
      },
    ],
    required: true,
    min: CluedoGames.MIN_GAMERS,
    max: CluedoGames.MAX_GAMERS,
  },
  roundGamer: {
    type: String,
    required: false,
  },
  solution: {
    type: {
      _id: false,
      room: String,
      character: String,
      weapon: String,
    },
    required: false,
  },
  weapons: {
    type: [
      {
        _id: false,
        name: {
          type: String,
          required: true,
          enum: Object.values(GamerElements.WeaponName),
        },
        place: {
          type: String,
          required: false,
          enum: Object.values(GamerElements.RoomName),
        },
      },
    ],
    default: [],
    required: false,
  },
  characters: {
    type: [
      {
        _id: false,
        name: {
          type: String,
          required: true,
          enum: Object.values(GamerElements.CharacterName),
        },
        place: {
          type: String,
          required: false,
          enum: [
            ...Object.values(GamerElements.RoomName),
            ...Object.values(GamerElements.LobbyName),
          ],
        },
      },
    ],
    default: [],
    required: false,
  },
  rooms: {
    type: [
      {
        _id: false,
        name: {
          type: String,
          required: true,
          enum: Object.values(GamerElements.RoomName),
        },
        secretPassage: {
          type: String,
          required: false,
          enum: Object.values(GamerElements.RoomName),
        },
      },
    ],
    default: [],
    required: false,
  },
  lobbies: {
    type: [
      {
        _id: false,
        name: {
          type: String,
          required: true,
          enum: Object.values(GamerElements.LobbyName),
        },
      },
    ],
    default: [],
    required: false,
  },
});

CluedoGameSchema.set('toObject', {
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
  },
});

export const CluedoGameModel: Model<DocCluedoGame> = model<DocCluedoGame>(
  'CluedoGame',
  CluedoGameSchema
);
