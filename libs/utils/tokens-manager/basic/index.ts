import {ITokensManager, Payload, Token} from '../index';
import {decode, sign, SignOptions, verify} from 'jsonwebtoken';
import {logger} from '../../logger';

export type BasicTokenManagerConfig = {
  issuer: string;
  publicKey: Buffer;
  privateKey: Buffer;
};
export class BasicTokenManager implements ITokensManager {
  private readonly privateKey: any;
  private readonly publicKey: any;
  private readonly signOptions: SignOptions;
  private readonly _tokens: Token[] = [];
  constructor({issuer, privateKey, publicKey}: BasicTokenManagerConfig) {
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.signOptions = {
      // algorithm: 'RS256',
      header: {
        alg: 'RS256',
        typ: 'JWT',
      },
      issuer,
    };
  }

  tokens(id?: string): Token | Token[] | undefined {
    if (!id) return this._tokens;
    return this._tokens[this.findIndexToken(id)];
  }
  createToken(id: string, payload: Payload, recreate?: boolean): string {
    const _indexToken = this.findIndexToken(id);
    if (_indexToken > -1) {
      if (recreate) {
        this._tokens[_indexToken].accessToken = sign(
          payload,
          this.privateKey,
          this.signOptions
        );
      }
      return this._tokens[_indexToken].accessToken;
    }
    const aToken = sign(payload, this.privateKey, this.signOptions);
    this._tokens.push({accessToken: aToken, id});
    logger.debug(this._tokens);
    return aToken;
  }

  removeToken(id: string): void {
    const index: number = this.findIndexToken(id);
    if (index > -1) {
      this._tokens.splice(index, 1);
    }
  }

  checker(id: string, accessToken: string): boolean {
    try {
      verify(accessToken, this.publicKey);
      return true;
    } catch (e) {
      return false;
    }
  }
  validity(id: string, accessToken: string): boolean {
    try {
      const payload = decode(accessToken, this.publicKey) as unknown as Payload;
      return payload.identifier === id;
    } catch (e) {
      return false;
    }
  }

  decode(id: string, accessToken: string): Payload | false {
    try {
      const payload = this.payload(accessToken);
      return (payload as unknown as Payload).identifier === id
        ? (payload as unknown as Payload)
        : false;
    } catch (e) {
      return false;
    }
  }

  payload(accessToken: string): Payload {
    try {
      return decode(accessToken, this.publicKey) as unknown as Payload;
    } catch (e) {
      return {} as Payload;
    }
  }

  private findIndexToken(id: string) {
    return this._tokens.findIndex(i => i.id === id);
  }
}

export namespace BasicTokenManager {
  export function create(config: BasicTokenManagerConfig): BasicTokenManager {
    return new BasicTokenManager(config);
  }
}
