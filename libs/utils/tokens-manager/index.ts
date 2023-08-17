export interface Token {
  /**
   * identifier of token
   */
  id: string;
  /**
   * access token
   */
  accessToken: string;
}

/**
 * Data payload type.
 */
export type Payload = {identifier: string} & {[key: string]: any};

/**
 * It represents a generic tokens' manager.
 */
export interface ITokensManager {
  /**
   * Retrieve all tokens or retrieve the token referring to _id_,
   * otherwise if it is not present, return _undefined_.
   * @param id (optional) identifier of token.
   */
  tokens(id?: string): Token | Token[] | undefined;

  /**
   * Create or recreate a new access token for _id_.
   * @param id identifier of token.
   * @param payload data payload (additional data).
   * @param recreate if it is true, it must be recreated the access token for
   * the given game.
   */
  createToken(id: string, payload: Payload, recreate?: boolean): string;

  /**
   * Remove the record with id equals to the given _id_.
   * @param id identifier of token.
   */
  removeToken(id: string): void;

  /**
   * Check if the given access token is a valid token.
   * @param accessToken access token to check.
   */
  checker(accessToken: string): boolean;

  /**
   * Check if the given access token belongs to the given id.
   * @param id identifier of token.
   * @param accessToken access token to check.
   */
  validity(id: string, accessToken: string): boolean;
}
