# Cluedo

The project consists in the design and implementation of a distributed version of the well-known board game
[_Cluedo_](https://it.wikipedia.org/wiki/Cluedo).

In this version of the game, users can create or join games created by other users. 
Initially a waiting "room" is created, in which users wait for the arrival of other users. 
As soon as the minimum number of gamers is reached, i.e. 3, the game can be started by the gamer who entered first. 
The game can have up to 6 players.

During his turn, a gamer can:

- roll a dice to be able to move in the house. The sides of the die represent the rooms of the house + one or more entrances;
- formulate an assumption if it is in a room;
- formulate an accusation

In the case of an assumption, the other gamers must then refute it (if possible), showing at most one card that contains one of 
the elements named by the gamer whose turn it is; this action demonstrates that the card definitely cannot be inside the envelope 
containing the solution to the murder.
In the case of an accusation, the current gamer, if the accusation is incorrect, is out of the game; otherwise, 
if he "pronounces" a correct accusation, the solution cards are revealed to the other players and the game ends.
Gamers who make wrong accusations must continue to show cards to other participants for the remainder of the game, 
or they can redeal their cards and leave the game.

## Architecture

The adopting architecture is a distributed P2P (peer-to-peer) architecture with a discovery server.

Communications between different peers and discovery server happen through RESTful APIs and socket events.
RESTful API and socket event specifications are provided via Swagger:

- [CluedoRestAPI](https://app.swaggerhub.com/apis/marica.pasquali/CluedoRestAPI/1.0.0) (OpenAPI)

- [CluedoSocketAPI](https://app.swaggerhub.com/apis/marica.pasquali/CluedoSocketAPI/1.0.0) (AsyncAPI)

### Peer

Each peer consists of a server side and a client side.
The server side allows communication with other peers and the discovery server and communicates system status updates to the client side through the use of socket connections.
The server side of a peer is also used as a backup server for other peers' games.
The client side allows the user to play through a graphical interface, which communicates with the server side through the REST API in response to user interaction.

### Discovery Server

The Discovery Server allows newly started peers to know the addresses of other peers and after that, the peer can communicate with other peers through REST API and/or socket connections.
Registration of peers (in an 'online' state) to the server occurs immediately after the server side of the peer is started.
Upon creation of a game, the status of the peer changes to 'shareable'.
The peer's status changes back to 'online' if they have no more games to share.
In case of connection errors and therefore in case the peer is no longer reachable, the status of the peer will be set to 'offline'.
