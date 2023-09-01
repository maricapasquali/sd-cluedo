import {Document, model, Model, Schema} from 'mongoose';
import {CluedoGame, Gamer, GameElements, Peer} from '@model';
import * as net from 'net';

export type DocCluedoGame = CluedoGame & Document;

const CluedoGameSchema: Schema<DocCluedoGame> = new Schema<DocCluedoGame>(
  {
    identifier: {type: String, required: true},
    status: {
      type: String,
      required: false,
      default: CluedoGame.Status.WAITING,
      enum: Object.values(CluedoGame.Status),
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
            default: [Gamer.Role.PARTICIPANT],
            enum: Object.values(Gamer.Role),
          },
          assumptions: {
            type: [
              {
                _id: false,
                room: String,
                character: String,
                weapon: String,
                confutation: {
                  type: [
                    {
                      _id: false,
                      gamer: String,
                      card: String,
                    },
                  ],
                  default: [],
                  required: false,
                },
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
              _id: false,
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
              port: {
                type: Number,
                required: true,
              },
              protocol: {
                type: String,
                required: true,
                enum: Object.values(Peer.Protocol),
              },
            },
            required: false,
          },
          cards: {
            type: [String],
            required: false,
            default: [],
            enum: [
              ...Object.values(GameElements.RoomName),
              ...Object.values(GameElements.CharacterName),
              ...Object.values(GameElements.WeaponName),
            ],
          },
          notes: {
            type: {
              _id: false,
              text: {
                type: String,
                required: false,
                default: '',
              },
              structuredNotes: {
                type: [
                  {
                    _id: false,
                    name: String,
                    suspectState: String,
                    confutation: {
                      type: Boolean,
                      enum: [true],
                      required: false,
                    },
                  },
                ],
                required: false,
                default: [],
              },
            },
            default: {},
            required: false,
          },
        },
      ],
      required: true,
      min: CluedoGame.MIN_GAMERS,
      max: CluedoGame.MAX_GAMERS,
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
            enum: Object.values(GameElements.WeaponName),
          },
          place: {
            type: String,
            required: false,
            enum: Object.values(GameElements.RoomName),
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
            enum: Object.values(GameElements.CharacterName),
          },
          place: {
            type: String,
            required: false,
            enum: [
              ...Object.values(GameElements.RoomName),
              ...Object.values(GameElements.LobbyName),
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
            enum: Object.values(GameElements.RoomName),
          },
          secretPassage: {
            type: String,
            required: false,
            enum: Object.values(GameElements.RoomName),
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
            enum: Object.values(GameElements.LobbyName),
          },
        },
      ],
      default: [],
      required: false,
    },
  },
  {timestamps: true}
);

CluedoGameSchema.set('toObject', {
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
  },
});

export const CluedoGameModel: Model<DocCluedoGame> = model<DocCluedoGame>(
  'CluedoGame',
  CluedoGameSchema
);
