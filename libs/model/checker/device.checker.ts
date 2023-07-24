import {Record, String, Number, Array} from 'runtypes';
import * as net from 'net';
import {Peers} from '../device.model';
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
  identifier: identifierConstraint,
  hostname: String,
  address: addressConstraint,
  protocol: String.withConstraint(s => s === Peers.Protocol.HTTPS, {
    name: 'HTTPS Protocol',
  }),
  devices: Array(CDevice).optional(),
  port: Number.withConstraint(n => n > 0, {name: 'Port positive number'}),
  status: String.withConstraint(
    s => Object.values(Peers.Status).includes(s as Peers.Status),
    {name: 'Peer available status ' + Object.values(Peers.Status)}
  ),
});
