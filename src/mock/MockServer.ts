import {MessageEnvelope} from "../main/ts/protocol/protocol";
import OpCode from "../main/ts/connection/OpCode";
import Deferred from "../main/ts/util/Deferred";
import MessageType from "../main/ts/protocol/MessageType";
import {HandshakeResponse} from "../main/ts/protocol/handhsake";
import EqualsUtil from "../main/ts/util/EqualsUtil";

/* tslint:disable */
var mockSocket = require('mock-socket');
if (typeof global['WebSocket'] === "undefined") {
  global['WebSocket'] = mockSocket.WebSocket;
}
/* tslint:enable */

export default class MockServer {
  private _server: any;

  private _incoming: MessageEnvelope[];
  private _expects: Expectation[];
  private _connection: any;

  private _reqId: number;

  constructor(url: string) {
    this._incoming = [];
    this._expects = [];
    this._reqId = 0;

    this._server = new mockSocket.Server(url);

    this._server.on("connection", (server: any, ws: any) => {
      this._connection = ws;

      server.on("message", (message: string) => {
        console.log("Receive: " + message);
        this._handleMessage(message);
      });

      server.on("close", (code: number, reason: string) => {
        console.log("Connection closed");
      });
    });
  }

  handshake(timeout: number, response?: HandshakeResponse): Promise<MessageEnvelope> {

    if (response === undefined) {
      response = {
        success: true,
        clientId: "1",
        reconnectToken: "s",
        protocolConfig: {},
        type: MessageType.HANDSHAKE
      };
    }

    return this.expectRequestMessage(timeout, MessageType.HANDSHAKE).then((request: MessageEnvelope) => {
      var body: any = {
        success: response.success,
        sessionId: response.clientId,
        reconnectToken: response.reconnectToken,
        protocolConfig: response.protocolConfig,
        error: response.error,
        retryOk: response.retryOk,
        type: MessageType.HANDSHAKE
      };

      this.sendReply(request.reqId, body);

      return request;
    });
  }

  sendNormal(type: string, body: any): void {
    var envelope: MessageEnvelope = new MessageEnvelope(
      OpCode.NORMAL,
      undefined,
      type,
      body
    );
    this._send(envelope);
  }

  sendRequest(type: string, body: any): void {
    var envelope: MessageEnvelope = new MessageEnvelope(
      OpCode.REQUEST,
      this._reqId++,
      type,
      body
    );
    this._send(envelope);
  }

  sendReply(reqId: number, body: any): void {
    var envelope: MessageEnvelope = new MessageEnvelope(
      OpCode.REPLY,
      reqId,
      undefined,
      body
    );
    this._send(envelope);
  }

  stop(): void {
    this._server.close();
    this._expects.forEach((expectation: Expectation) => {
      clearTimeout(expectation.timer);
    });
    this._expects = [];
  }

  expectMessage(timeout: number, messageExpectation?: MessageExpectation): Promise<MessageEnvelope> {
    if (!messageExpectation) {
      messageExpectation = {};
    }

    var expectation: Expectation = {
      timeout: timeout,
      opCode: messageExpectation.opCode,
      type: messageExpectation.type,
      body: messageExpectation.body,
      deferred: new Deferred<MessageEnvelope>()
    };

    return this._expect(expectation);
  }

  expectNormalMessage(timeout: number, type?: string, body?: any): Promise<MessageEnvelope> {
    return this.expectMessage(timeout, {
      type: type,
      body: body,
      opCode: OpCode.NORMAL
    });
  }

  expectRequestMessage(timeout: number, type?: string, body?: any): Promise<MessageEnvelope> {
    return this.expectMessage(timeout, {
      type: type,
      body: body,
      opCode: OpCode.REQUEST
    });
  }

  expectResponseMessage(timeout: number, type?: string, body?: any): Promise<MessageEnvelope> {
    return this.expectMessage(timeout, {
      type: type,
      body: body,
      opCode: OpCode.REPLY
    });
  }

  private _expect(expectation: Expectation): Promise<MessageEnvelope> {
    if (this._incoming.length === 0) {
      this._deferExpect(expectation);
    } else {
      var message: MessageEnvelope = this._incoming.shift();
      this._evaluateMessage(expectation, message);
    }

    return expectation.deferred.promise();
  }

  private _evaluateMessage(expectation: Expectation, envelope: MessageEnvelope): void {
    if (expectation.opCode !== undefined && envelope.opCode !== expectation.opCode) {
      expectation.deferred.reject(new Error(`Expected opCode '${expectation.opCode}, but received '${envelope.opCode}'.`));
    } else if (expectation.type !== undefined && envelope.type !== expectation.type) {
      expectation.deferred.reject(new Error(`Expected type '${expectation.type}, but received '${envelope.type}'.`));
    } else if (expectation.body !== undefined && !EqualsUtil.deepEquals(envelope.body, expectation.body)) {
      expectation.deferred.reject(new Error(`Expected body '${expectation.body}, but received '${envelope.body}'.`));
    } else {
      expectation.deferred.resolve(envelope);
    }
  }

  private _deferExpect(expectation: Expectation): void {
    var t: any = setTimeout(
      () => {
        this._handleTimeout(expectation);
      },
      expectation.timeout);

    expectation.timer = t;

    this._expects.push(expectation);
  }

  private _handleTimeout(expectation: Expectation): void {
    expectation.deferred.reject(new Error("Timeout waiting for: " + expectation.type));
  }

  private _send(envelope: MessageEnvelope): void {
    var json: string = JSON.stringify(envelope);
    console.log("Sending: " + json);
    this._server.send(json);
  }

  private _handleMessage(json: string): void {
    var parsed: any = JSON.parse(json);
    var envelope: MessageEnvelope = new MessageEnvelope(
      parsed.opCode,
      parsed.reqId,
      parsed.type,
      parsed.body);

    if (envelope.opCode === OpCode.PING) {
      this._connection.sendText(JSON.stringify({opCode: OpCode.PONG}));
    } else {
      if (this._expects.length === 0) {
        this._incoming.push(envelope);
      } else {
        var expectation: Expectation = this._expects.shift();
        clearTimeout(expectation.timer);
        if (expectation.type === envelope.type) {
          expectation.deferred.resolve(envelope);
        } else {
          expectation.deferred.reject(new Error("Invalid message type"));
        }
      }
    }
  }
}

export interface MessageExpectation {
  opCode?: string;
  type?: string;
  body?: any;
}

interface Expectation {
  opCode?: string;
  type?: string;
  body?: any;
  timeout?: number;
  timer?: any;
  deferred: Deferred<MessageEnvelope>;
}
