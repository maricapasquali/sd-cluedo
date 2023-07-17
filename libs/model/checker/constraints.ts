import {String} from 'runtypes';
import {validate} from 'uuid';

export const identifierConstraint = String.withConstraint(s => validate(s), {
  name: 'uuid format',
});
