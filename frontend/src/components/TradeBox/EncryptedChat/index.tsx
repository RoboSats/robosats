import React, { useContext, useEffect, useState } from 'react';
import { type Order, type Robot } from '../../../models';
import EncryptedSocketChat from './EncryptedSocketChat';
import EncryptedTurtleChat from './EncryptedTurtleChat';
import { nip17 } from 'nostr-tools';
import { GarageContext, type UseGarageStoreType } from '../../../contexts/GarageContext';
import {
  FederationContext,
  type UseFederationStoreType,
} from '../../../contexts/FederationContext';
import { AppContext, UseAppStoreType } from '../../../contexts/AppContext';

interface Props {
  order: Order;
  status: number;
  chatOffset: number;
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
  setMessages,
  messages,
  status,
}: Props): React.JSX.Element => {
  const [turtleMode, setTurtleMode] = useState<boolean>(false);
  const { settings } = useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);

  useEffect(() => {
    // const slot = garage.getSlot();
    // const since = new Date(order.created_at);
    // since.setDate(since.getDate() - 2);
    // federation.roboPool.subscribeChat(
    //   [order.maker_nostr_pubkey, order.taker_nostr_pubkey],
    //   Math.floor((since.getTime() / 1000)),
    //   {
    //     oneose: () => {},
    //     onevent(event) {
    //       if (slot?.nostrSecKey) {
    //         console.log(nip17.unwrapEvent(event, slot.nostrSecKey))
    //       }
    //     },
    //   }
    // )
  }, []);

  const onSendMessage = (content: string): void => {
    sendToNostr(content);
  };

  const sendToNostr = (content: string): void => {
    const slot = garage.getSlot();
    const coordinator = federation.getCoordinator(order.shortAlias);
    const publicKey = order.is_maker ? order.taker_nostr_pubkey : order.maker_nostr_pubkey;

    if (!slot?.nostrSecKey || !publicKey) return;

    const recipient = {
      publicKey,
      relayUrl: coordinator.getRelayUrl(settings.network),
    };

    const wrappedEvent = nip17.wrapEvent(slot?.nostrSecKey, recipient, content);

    const oneMonth = 2419200;

    wrappedEvent.tags.push(['expiration', (wrappedEvent.created_at + oneMonth).toString()]);

    federation.roboPool.sendEvent(wrappedEvent);
  };

  return turtleMode ? (
    <EncryptedTurtleChat
      messages={messages}
      setMessages={setMessages}
      onSendMessage={onSendMessage}
      order={order}
      takerNick={order.taker_nick}
      takerHashId={order.taker_hash_id}
      makerHashId={order.maker_hash_id}
      userNick={order.ur_nick}
      chatOffset={chatOffset}
      turtleMode={turtleMode}
      setTurtleMode={setTurtleMode}
    />
  ) : (
    <EncryptedSocketChat
      status={status}
      messages={messages}
      setMessages={setMessages}
      onSendMessage={onSendMessage}
      order={order}
      takerNick={order.taker_nick}
      takerHashId={order.taker_hash_id}
      makerHashId={order.maker_hash_id}
      userNick={order.ur_nick}
      turtleMode={turtleMode}
      setTurtleMode={setTurtleMode}
    />
  );
};

export default EncryptedChat;
