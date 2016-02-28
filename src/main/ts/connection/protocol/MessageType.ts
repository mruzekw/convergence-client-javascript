enum MessageType {
  ERROR = 0,

  PING = 1,
  PONG = 2,

  HANDSHAKE_REQUEST = 3,
  HANDSHAKE_RESPONSE = 4,

  PASSWORD_AUTH_REQUEST = 5,
  TOKEN_AUTH_REQUEST = 6,
  AUTHENTICATE_RESPONSE = 7,

  OPEN_REAL_TIME_MODEL_REQUEST = 8,
  OPEN_REAL_TIME_MODEL_RESPONSE = 9,

  CLOSES_REAL_TIME_MODEL_REQUEST = 10,
  CLOSE_REAL_TIME_MODEL_RESPONSE = 11,

  CREATE_REAL_TIME_MODEL_REQUEST = 12,
  CREATE_REAL_TIME_MODEL_RESPONSE = 13,

  DELETE_REAL_TIME_MODEL_REQUEST = 14,
  DELETE_REAL_TIME_MODEL_RESPONSE = 15,

  FORCE_CLOSE_REAL_TIME_MODEL = 16,

  REMOTE_CLIENT_OPENED = 17,
  REMOTE_CLIENT_CLOSED = 18,

  MODEL_DATA_REQUEST = 19,
  MODEL_DATA_RESPONSE = 20,

  REMOTE_OPERATION = 21,
  OPERATION_SUBMISSION = 22,
  OPERATION_ACKNOWLEDGEMENT = 23,

  CREATE_REFERENCE = 24,
  SET_REFERENCE = 25,
  CLEAR_REFERENCE = 26,
  REMOVE_REFERENCE = 27,

  REFERENCE_CREATED = 28,
  REFERENCE_SET = 29,
  REFERENCE_CLEARED = 30,
  REFERENCE_REMOVED = 31,

  USER_LOOKUP_REQUEST = 50,
  USER_SEARCH_REQUEST = 51,
  USER_LIST_RESPONSE = 52
}

export default MessageType;
