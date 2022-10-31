import React from 'react';
import EncryptedSocketChat from './EncryptedSocketChat';
import EncryptedTrutleChat from './EncryptedTrutleChat';

interface Props {
  turtleMode: boolean;
  orderId: number;
  takerNick: string;
  makerNick: string;
  userNick: string;
  chatOffset: number;
}
export interface EncryptedChatMessage {
  userNick: string;
  validSignature: boolean;
  plainTextMessage: string;
  encryptedMessage: string;
  time: string;
  index: number;
}
export interface ServerMessage {
  message: string;
  time: string;
  index: number;
  nick: string;
}

const EncryptedChat: React.FC<Props> = ({
  turtleMode,
  orderId,
  takerNick,
  userNick,
  chatOffset,
}: Props): JSX.Element => {
  return turtleMode ? (
    <EncryptedTrutleChat
      orderId={orderId}
      takerNick={takerNick}
      userNick={userNick}
      chatOffset={chatOffset}
    />
  ) : (
    <EncryptedSocketChat orderId={orderId} takerNick={takerNick} userNick={userNick} />
  );
};

export default EncryptedChat;
