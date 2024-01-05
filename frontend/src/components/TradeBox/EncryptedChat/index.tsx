import React, { useState } from 'react';
import { Order, type Robot } from '../../../models';
import EncryptedSocketChat from './EncryptedSocketChat';
import EncryptedTurtleChat from './EncryptedTurtleChat';

interface Props {
  order: Order;
  status: number;
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
  robot: Robot;
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
  order,
  takerNick,
  userNick,
  chatOffset,
  baseUrl,
  setMessages,
  messages,
  status,
}: Props): JSX.Element => {
  const [turtleMode, setTurtleMode] = useState<boolean>(window.ReactNativeWebView !== undefined);

  return turtleMode ? (
    <EncryptedTurtleChat
      messages={messages}
      setMessages={setMessages}
      order={order}
      takerNick={takerNick}
      userNick={userNick}
      chatOffset={chatOffset}
      baseUrl={baseUrl}
      turtleMode={turtleMode}
      setTurtleMode={setTurtleMode}
    />
  ) : (
    <EncryptedSocketChat
      status={status}
      messages={messages}
      setMessages={setMessages}
      order={order}
      takerNick={takerNick}
      userNick={userNick}
      baseUrl={baseUrl}
      turtleMode={turtleMode}
      setTurtleMode={setTurtleMode}
    />
  );
};

export default EncryptedChat;
