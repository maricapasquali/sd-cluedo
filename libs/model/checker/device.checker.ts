import {Record, String, Number, Array} from 'runtypes';
import * as net from 'net';
import {Peer} from '../device.model';
import {identifierConstraint} from './constraints';

const addressConstraint = String.withConstraint(s => net.isIPv4(s), {
  name: 'IPv4 string',
});

export const CDevice = Record({
  identifier: identifierConstraint,
  hostname: String,
  address: addressConstraint.optional(),
});

export const CPeer = Record({
  identifier: String,
  hostname: String,
  address: addressConstraint,
  protocol: String.withConstraint(s => s === Peer.Protocol.HTTPS, {
    name: 'HTTPS Protocol',
  }),
  devices: Array(CDevice).optional(),
  port: Number.withConstraint(n => n > 0, {name: 'Port positive number'}),
  status: String.withConstraint(
    s => Object.values(Peer.Status).includes(s as Peer.Status),
    {name: 'Peer available status ' + Object.values(Peer.Status)}
  ),
});
