import {ITokensManager, Payload, Token} from '../index';
import {decode, sign, SignOptions, verify} from 'jsonwebtoken';
import {logger} from '../../logger';

export type BasicTokenManagerConfig = {
  issuer: string;
  publicKey: Buffer;
  privateKey: Buffer;
};

/**
 * Implementation of _{@link ITokensManager}_ that uses JSON Web Tokens as
 * access token.
 * @see https://jwt.io/introduction
 */
export class BasicTokenManager implements ITokensManager {
  private readonly privateKey: any;
  private readonly publicKey: any;
  private readonly signOptions: SignOptions;
  private readonly _tokens: Token[] = [];
  constructor({issuer, privateKey, publicKey}: BasicTokenManagerConfig) {
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.signOptions = {
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

  checker(accessToken: string): boolean {
    try {
      verify(accessToken, this.publicKey);
      return true;
    } catch (e) {
      return false;
    }
  }
  validity(id: string, accessToken: string): boolean {
    return this.payload(accessToken).identifier === id;
  }

  /**
   * Retrieve the decoded access token (i.e. payload data) of _id_
   * if access token is valid as token.
   * @param id identifier of token.
   * @param accessToken access token to decode.
   */
  decode(id: string, accessToken: string): Payload | false {
    return this.validity(id, accessToken) ? this.payload(accessToken) : false;
  }

  /**
   * Returns the decoded payload without verifying if the signature of token is valid.
   * @param accessToken access token to decode.
   */
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
