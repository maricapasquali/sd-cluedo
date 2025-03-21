import {QueryParameters} from '@peer/routes/parameters';
type SessionStorageGame = {
  game: CluedoGame;
  gamer: Gamer;
  accessToken: string;
  history: HistoryItem[];
};

export type HistoryItem = {
  gamer: string;
  action: QueryParameters.Action;
  message: any;
  timestamp?: number;
};

export class SessionGameStorageManager {
  private readonly key: string = 'game';
  private _store: SessionStorageGame;
  constructor() {
    this._store = JSON.parse(
      window.sessionStorage.getItem(this.key) || '{}'
    ) as SessionStorageGame;
  }
  isEmpty(): boolean {
    return Object.keys(this.storage).length === 0;
  }
  get game(): CluedoGame {
    return this.storage.game || {};
  }

  set game(game: CluedoGame) {
    this.storage.game = game;
    this.store();
  }

  get gamer(): Gamer {
    return this.storage.gamer || {};
  }

  set gamer(gamer: Gamer) {
    this.storage.gamer = gamer;
    this.store();
  }

  get accessToken(): string {
    return this.storage.accessToken;
  }

  set accessToken(token: string) {
    this.storage.accessToken = token;
    this.store();
  }

  get history(): HistoryItem[] {
    if (!this.storage.history || this.storage.history.length === 0)
      this.storage.history = [];
    return this.storage.history;
  }

  set history(historyItem: HistoryItem[]) {
    this.storage.history = historyItem;
    this.store();
  }

  remove() {
    this._store = {} as SessionStorageGame;
    window.sessionStorage.removeItem(this.key);
  }

  private get storage(): SessionStorageGame {
    return this._store;
  }
  private store() {
    window.sessionStorage.setItem('game', JSON.stringify(this.storage));
    console.debug('store ', this._store);
  }
}

export const sessionStoreManager = new SessionGameStorageManager();
