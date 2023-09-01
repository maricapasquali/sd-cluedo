# Cluedo

The project consists in the design and implementation of a distributed version of the well-known board game
[_Cluedo_](https://it.wikipedia.org/wiki/Cluedo).

In this version of the game, users can create or join games created by other users.
Initially a waiting "room" is created, in which users wait for the arrival of other users.
As soon as the minimum number of gamers is reached, i.e. 3, the game can be started by any gamer in the game.
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

## Design

The adopting architecture is a distributed P2P (peer-to-peer) architecture with a discovery server.

Communications between different peers and discovery server happen through RESTful APIs and socket events.
RESTful API and socket event specifications are provided via Swagger:

- [CluedoRestAPI](https://app.swaggerhub.com/apis/marica.pasquali/CluedoRestAPI/1.0.0) (OpenAPI)

- [CluedoSocketAPI](https://app.swaggerhub.com/apis/marica.pasquali/CluedoSocketAPI/1.0.0) (AsyncAPI)

Internally the peers have a client server architecture, so they can work in standalone mode.
### Peer

Each peer consists of a server side and a client side.
The server side allows communication with other peers and the discovery server and communicates system status updates to the client side through the use of socket connections.
The server side of a peer is also used as a backup server for other peers' games.
The client side allows the user to play through a graphical interface, which communicates with the server side through the REST API in response to user interaction.

### Discovery Server

The Discovery Server allows newly started peers to know the addresses of other peers and after that, the peer can communicate with other peers through REST API and/or socket connections.
Registration of peers (in an 'online' state) to the server occurs immediately after the server side of the peer is started.
In case of connection errors and therefore in case the peer is no longer reachable, the status of the peer will be set to 'offline'.

## Deployment in production mode

### Local

#### Requirement
- [Node.JS](https://nodejs.org/en/download)
- [MongoDB](https://www.mongodb.com/try/download/community)

#### Installation and build

```bash
npm install
npm run install:peer-ui
npm run build
```

#### Run
##### Discovery server

```bash
PORT=<some-free-port> npm start -w discovery
```

Defaults:

- ```PORT=3000```

##### Peer

```bash
MONGODB_ADDRESS=<database-uri-connection> PORT=<some-free-port> DISCOVERY_SERVER_ADDRESS=<https-address-of-discovery-server> npm start -w peer
```

Defaults:
- ```MONGODB_ADDRESS=mongodb://localhost:27017/cluedo```
- ```PORT=3001```

- ```DISCOVERY_SERVER_ADDRESS=https://localhost:3000```


### Docker 

Being a p2p architecture, the applications (discovery peers and peers) should be installed on different machines.
To simulate this type of installation is used _**[Docker](https://docs.docker.com/)**_.


#### Build and start all project

```bash
bash ./deploy-scripts/all.up.sh -n <number-of-peer-to-up> -d <host-port-discovery-server> -p <host-port-first-peer>
```

Defaults:

- ```<number-of-peer-to-up> = 1```

- ```<host-port-discovery-server> = 3000```

- ```<host-port-first-peer> = 3001```

#### Build and start single components

##### Discovery server

```bash
bash ./deploy-scripts/discovery.build.sh

bash ./deploy-scripts/discovery.start.sh -p <host-port-discovery-server>
```

Defaults:

- ```<host-port-discovery-server> = 3000```

##### Peer

```bash
bash ./deploy-scripts/peer.build.sh

bash ./deploy-scripts/peer.start.sh -n <number-of-peer-to-up> -p <host-port-first-peer> -d <https-address-discovery-server>
```

Defaults:

- ```<number-of-peer-to-up> = 1```

- ```<host-port-first-peer> = 3001```

- ```<https-address-discovery-server> = https://discovery:3000```
