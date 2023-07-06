declare function peers(): Peer[];

declare function addPeer(peer: Peer): void;

declare function updatePeer(id: string, status: string): void;

declare function removePeer(id: string): void;

declare function findPeer(id: string): Peer | undefined;
