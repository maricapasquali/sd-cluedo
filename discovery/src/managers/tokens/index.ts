import {ITokensManager, Token} from '@utils/tokens-manager';
import * as fs from 'fs';
import * as path from 'path';
import {decode, sign, verify} from 'jsonwebtoken';
import {logger} from '@utils/logger';

export default function createTokenManager(issuer: string): ITokensManager {
  return new (class implements ITokensManager {
    private readonly privateKey: any;
    private readonly publicKey: any;
    private readonly signOptions: object;
    private readonly _tokens: Token[] = [];
    constructor(issuer: string) {
      this.publicKey = fs.readFileSync(path.resolve('sslcert', 'cert.pem'));
      this.privateKey = fs.readFileSync(
        path.resolve('sslcert', 'privatekey.pem')
      );
      this.signOptions = {
        algorithm: 'RS256',
        header: {
          typ: 'JWT',
        },
        issuer,
      };
    }

    tokens(id?: string): Token | Token[] | undefined {
      if (!id) return this._tokens;
      return this._tokens[this.findIndexToken(id)];
    }
    createToken(id: string, payload: any): string {
      const _token = this.tokens(id);
      if (_token) return (_token as Token).accessToken;
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
      const token = this.tokens(id);
      if (!token) return false;
      if ((token as Token).accessToken !== accessToken) return false;
      try {
        verify(accessToken, this.publicKey);
        return true;
      } catch (e) {
        return false;
      }
    }
    validity(id: string, accessToken: string): boolean {
      try {
        const payload = decode(accessToken, this.publicKey);
        return (payload as unknown as {identifier: string}).identifier === id;
      } catch (e) {
        return false;
      }
    }

    private findIndexToken(id: string) {
      return this._tokens.findIndex(i => i.id === id);
    }
  })(issuer);
}
