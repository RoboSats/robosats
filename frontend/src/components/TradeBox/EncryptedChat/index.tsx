import React, { useState } from 'react';
import { Robot } from '../../../models';
import EncryptedSocketChat from './EncryptedSocketChat';
import EncryptedTurtleChat from './EncryptedTurtleChat';

interface Props {
  orderId: number;
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
  orderId,
  takerNick,
  robot,
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
      robot={robot}
      setMessages={setMessages}
      orderId={orderId}
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
      robot={robot}
      setMessages={setMessages}
      orderId={orderId}
      takerNick={takerNick}
      userNick={userNick}
      baseUrl={baseUrl}
      turtleMode={turtleMode}
      setTurtleMode={setTurtleMode}
    />
  );
};

export default EncryptedChat;
