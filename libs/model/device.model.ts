export namespace Peer {
  export enum Status {
    ONLINE = 'online',
    OFFLINE = 'offline',
  }

  export enum Protocol {
    HTTPS = 'https',
  }
}

export namespace Peers {
  export function url(peer: Peer): string {
    return peer.protocol + '://' + peer.hostname + ':' + peer.port;
  }
}
