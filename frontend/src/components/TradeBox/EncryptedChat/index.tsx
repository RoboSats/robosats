import React, { useState } from 'react';
import { type Order, type Robot } from '../../../models';
import EncryptedSocketChat from './EncryptedSocketChat';
import EncryptedTurtleChat from './EncryptedTurtleChat';

interface Props {
  order: Order;
  status: number;
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
      takerNick={order.taker_nick}
      takerHashId={order.taker_hash_id}
      makerHashId={order.maker_hash_id}
      userNick={order.ur_nick}
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
      takerNick={order.taker_nick}
      takerHashId={order.taker_hash_id}
      makerHashId={order.maker_hash_id}
      userNick={order.ur_nick}
      baseUrl={baseUrl}
      turtleMode={turtleMode}
      setTurtleMode={setTurtleMode}
    />
  );
};

export default EncryptedChat;
