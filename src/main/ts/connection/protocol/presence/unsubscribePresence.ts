import {OutgoingProtocolRequestMessage} from "../protocol";
import {MessageBodySerializer} from "../MessageSerializer";

export interface UnsubscribePresence extends OutgoingProtocolRequestMessage {
  username: string;
}

export var UnsubscribePresenceSerializer: MessageBodySerializer = (request: UnsubscribePresence) => {
  return {
    u: request.username
  };
};