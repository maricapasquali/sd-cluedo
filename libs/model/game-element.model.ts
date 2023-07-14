export namespace GamerElements {
  export enum LobbyName {
    MAIN_LOBBY = 'main lobby',
    BACK_LOBBY = 'back lobby',
  }

  export enum CharacterName {
    PROFESSOR_PLUM = 'professor plum',
    MRS_PEACOCK = 'mrs. peacock',
    REVEREND_GREEN = 'reverend green',
    MISS_SCARLET = 'miss scarlet',
    COLONEL_MUSTARD = 'colonel mustard',
    MRS_WHITE = 'mrs. white',
  }

  export enum WeaponName {
    ROPE = 'rope',
    LEAD_PIPE = 'lead pipe',
    DAGGER = 'dagger',
    SPANNER = 'spanner',
    CANDLESTICK = 'candlestick',
    REVOLVER = 'revolver',
  }

  export enum RoomName {
    BALLROOM = 'ballroom',
    CONSERVATORY = 'conservatory',
    BILLIARD_ROOM = 'billiard room',
    KITCHEN = 'kitchen',
    VERANDA = 'veranda',
    LIBRARY = 'library',
    DINING_ROOM = 'dining room',
    LIVING_ROOM = 'living room',
    STUDY = 'study',
  }

  export enum SuspectState {
    EXCLUDED = 'excluded',
    MAYBE = 'maybe',
    SURE = 'sure',
  }

  export const RoomWithSecretPassage: {[key: string]: RoomName} = {
    [RoomName.BILLIARD_ROOM]: RoomName.DINING_ROOM,
    [RoomName.BALLROOM]: RoomName.STUDY,
    [RoomName.DINING_ROOM]: RoomName.BILLIARD_ROOM,
    [RoomName.STUDY]: RoomName.BALLROOM,
  };
}
