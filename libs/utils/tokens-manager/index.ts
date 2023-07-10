export interface Token {
  id: string;
  accessToken: string;
}
export interface ITokensManager {
  tokens(id?: string): Token | Token[] | undefined;
  createToken(id: string, payload: any): string;
  removeToken(id: string): void;
  checker(id: string, accessToken: string): boolean;
  validity(id: string, accessToken: string): boolean;
}
