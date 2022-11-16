import React from 'react';
import EncryptedSocketChat from './EncryptedSocketChat';
import EncryptedTurtleChat from './EncryptedTurtleChat';

interface Props {
  turtleMode: boolean;
  orderId: number;
  takerNick: string;
  makerNick: string;
  userNick: string;
  chatOffset: number;
  baseUrl: string;
  messages: EncryptedChatMessage[];
  setMessages: (state: EncryptedChatMessage[]) => void;
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
  baseUrl,
  setMessages,
  messages,
}: Props): JSX.Element => {
  return turtleMode ? (
    <EncryptedTurtleChat
      messages={messages}
      setMessages={setMessages}
      orderId={orderId}
      takerNick={takerNick}
      userNick={userNick}
      chatOffset={chatOffset}
      baseUrl={baseUrl}
    />
  ) : (
    <EncryptedSocketChat
      messages={messages}
      setMessages={setMessages}
      orderId={orderId}
      takerNick={takerNick}
      userNick={userNick}
      baseUrl={baseUrl}
    />
  );
};

export default EncryptedChat;
