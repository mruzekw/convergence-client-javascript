import {ConvergenceDomain} from "./ConvergenceDomain";
import {IConvergenceOptions} from "./IConvergenceOptions";
import {ConvergenceError, Validation} from "./util";

/**
 * This is the entry point for the Convergence JS client. It allows users to connect
 * to the Convergence Engine using a variety of authentication methods. On success,
 * each connection method returns a [[ConvergenceDomain]] bound to the
 * [Domain](https://docs.convergence.io/guide/domain/overview.html) at the specified URL.
 *
 * See the [Developer Guide](https://docs.convergence.io/guide/authentication/overview.html)
 * for more information about authentication options.
 */
export class Convergence {

  /**
   * Connects to a Convergence Domain using username / password authentication.
   *
   * @param url
   *   The URL of the Convergence Domain to connect to.
   * @param username
   *   The username of the Convergence Domain User to connect as.
   * @param password
   *   The password for the corresponding Convergence Domain User.
   * @param options
   *   Options that configure the behavior of the client.
   *
   * @returns
   *   A Promise which will be resolved with the [[ConvergenceDomain]] upon
   *   successful connection.
   */
  public static connect(url: string,
                        username: string,
                        password: string,
                        options?: IConvergenceOptions): Promise<ConvergenceDomain> {
    Validation.assertNonEmptyString(url, "url");
    Validation.assertNonEmptyString(username, "username");
    Validation.assertNonEmptyString(password, "password");

    options = options || {};
    Convergence._validateOptions(options);
    const domain: ConvergenceDomain = new ConvergenceDomain(url, options);
    return domain._connect().then(() => {
      return domain._authenticateWithPassword(username, password);
    }).then(() => {
      return domain;
    });
  }

  /**
   * Connects to a Convergence Domain using anonymous authentication.  For this to
   * work, the domain must be configured to allow anonymous authentication.
   *
   * @param url
   *   The URL of the Convergence Domain to connect to.
   * @param displayName
   *   The display name to use for the anonymous user.
   * @param options
   *   Options that configure the behavior of the client.
   *
   * @returns
   *   A Promise which will be resolved with the [[ConvergenceDomain]] upon
   *   successful connection.
   */
  public static connectAnonymously(url: string,
                                   displayName?: string,
                                   options?: IConvergenceOptions): Promise<ConvergenceDomain> {
    Validation.assertNonEmptyString(url, "url");

    options = options || {};
    Convergence._validateOptions(options);
    const domain: ConvergenceDomain = new ConvergenceDomain(url, options);
    return domain._connect().then(() => {
      return domain._authenticateAnonymously(displayName);
    }).then(() => {
      return domain;
    });
  }

  /**
   * Connects to a Convergence Domain using a JSON Web Token (JWT) for
   * authentication. See the [developer guide](https://docs.convergence.io/guide/authentication/json-web-tokens.html)
   * for information about configuring the server to accept JWTs.
   *
   * @param url
   *   The URL of the Convergence Domain to connect to.
   * @param jwt
   *   A valid JSON Web Token (JWT) indicating the Domain User to connect as.
   * @param options
   *   Options that configure the behavior of the client.
   *
   * @returns
   *   A Promise which will be resolved with the [[ConvergenceDomain]] upon
   *   successful connection.
   */
  public static connectWithJwt(url: string, jwt: string, options?: IConvergenceOptions): Promise<ConvergenceDomain> {
    Validation.assertNonEmptyString(url, "url");
    Validation.assertNonEmptyString(jwt, "jwt");

    options = options || {};
    Convergence._validateOptions(options);
    const domain: ConvergenceDomain = new ConvergenceDomain(url, options);
    return domain._connect().then(() => {
      return domain._authenticateWithJwt(jwt);
    }).then(() => {
      return domain;
    });
  }

  /**
   * Reconnects to the specified domain using a previously generated reconnect
   * token (which can be obtained from an existing [[ConvergenceSession]]).
   *
   * @param url
   *   The URL of the Convergence Domain to connect to
   * @param token
   *   The reconnect token to use for authentication
   * @param options
   *   Options that configure the behavior of the client
   *
   * @returns
   *   A Promise which will be resolved with the [[ConvergenceDomain]] upon
   *   successful connection.
   */
  public static reconnect(url: string, token: string, options?: IConvergenceOptions): Promise<ConvergenceDomain> {
    Validation.assertNonEmptyString(url, "url");
    Validation.assertNonEmptyString(token, "token");

    options = options || {};
    Convergence._validateOptions(options);
    const domain: ConvergenceDomain = new ConvergenceDomain(url, options);
    return domain._connect().then(() => {
      return domain._authenticateWithReconnectToken(token);
    }).then(() => {
      return domain;
    });
  }

  private static _validateOptions(options?: IConvergenceOptions): void {
    let websockets = false;
    try {
      websockets = WebSocket.CLOSING === 2;
    } catch (e) {
      // no-op
    }

    if (!websockets && !options.webSocketClass) {
      const message = "Convergence depends on the WebSockets API. " +
        "If Convergence is not being run in a browser, you must set the " +
        "'webSocketClass' property in the connection options.";
      throw new ConvergenceError(message, "websockets_not_supported");
    }
  }
}

export const connect = Convergence.connect;
export const connectAnonymously = Convergence.connectAnonymously;
export const connectWithJwt = Convergence.connectWithJwt;
export const reconnect = Convergence.reconnect;
