declare interface Device {
  identifier: string;
  hostname: string;
  address?: string;
}

declare interface Peer extends Device {
  protocol: string;
  port: number;
  devices?: Device[];
  status: string;
}
