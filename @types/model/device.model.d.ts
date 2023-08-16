/**
 * It represents a generic device.
 */
declare interface Device {
  identifier: string;
  hostname: string;
  address?: string;
}

/**
 * It represents a generic peer.
 */
declare interface Peer extends Device {
  protocol: string;
  port: number;
  devices?: Device[];
  status: string;
}
