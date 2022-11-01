export interface WebSocketsChatMessage {
  userNick: string;
  validSignature: boolean;
  plainTextMessage: string;
  encryptedMessage: string;
  time: Date;
  index: number;
}

export interface APIChatMessage {
  nick: string;
  time: Date;
  message: string;
  index: number;
}

export interface APIChat {
  peer_pubkey: string;
  peer_connected: boolean;
  messages: APIChatMessage[];
}

export default APIChat;
