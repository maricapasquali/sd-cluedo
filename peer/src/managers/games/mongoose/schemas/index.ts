import {Document, model, Model, Schema} from 'mongoose';

export type ICluedoGame = CluedoGame & Document;

const CluedoGameSchema: Schema<ICluedoGame> = new Schema<ICluedoGame>(
  {},
  {strict: false}
);

CluedoGameSchema.set('toObject', {
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
  },
});

export const CluedoGameModel: Model<ICluedoGame> = model<ICluedoGame>(
  'CluedoGame',
  CluedoGameSchema
);
