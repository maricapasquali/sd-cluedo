// eslint-disable-next-line node/no-unpublished-import
import {QueryParameters} from '../../../../src/routes/parameters';
type LocalStorageGame = {
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

export class LocalGameStorageManager {
  private readonly key: string = 'game';
  private _store: LocalStorageGame;
  constructor() {
    this._store = JSON.parse(
      window.localStorage.getItem(this.key) || '{}'
    ) as LocalStorageGame;
  }
  isEmpty(): boolean {
    return Object.keys(this.storage).length === 0;
  }
  get localGame(): CluedoGame {
    return this.storage.game || {};
  }

  set localGame(game: CluedoGame) {
    this.storage.game = game;
    this.store();
  }

  get localGamer(): Gamer {
    return this.storage.gamer || {};
  }

  set localGamer(gamer: Gamer) {
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
    this._store = {} as LocalStorageGame;
    window.localStorage.removeItem(this.key);
  }

  private get storage(): LocalStorageGame {
    return this._store;
  }
  private store() {
    window.localStorage.setItem('game', JSON.stringify(this.storage));
    console.debug('store ', this._store);
  }
}

export const localGameStorageManager = new LocalGameStorageManager();
