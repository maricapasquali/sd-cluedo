export namespace Peers {
  export enum Status {
    ONLINE = 'online',
    OFFLINE = 'offline',
  }

  export enum Protocol {
    HTTPS = 'https',
  }

  export function url(peer: Peer): string {
    return peer.protocol + '://' + peer.hostname + ':' + peer.port;
  }
}
