export interface Token {
  id: string;
  accessToken: string;
}

export type Payload = {identifier: string} & {[key: string]: any};
export interface ITokensManager {
  tokens(id?: string): Token | Token[] | undefined;
  createToken(id: string, payload: Payload, recreate?: boolean): string;
  removeToken(id: string): void;
  checker(id: string, accessToken: string): boolean;
  validity(id: string, accessToken: string): boolean;
}
