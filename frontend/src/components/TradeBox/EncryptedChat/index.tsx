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

interface Props {
  order: Order;
  status: number;
  chatOffset: number;
  messages: EncryptedChatMessage[];
  setMessages: (state: EncryptedChatMessage[]) => void;
  peerPubKey?: string;
  setPeerPubKey: (peerPubKey: string) => void;
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
  peerPubKey,
  setPeerPubKey,
}: Props): React.JSX.Element => {
  const [turtleMode, setTurtleMode] = useState<boolean>(false);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);

  useEffect(() => {
    // const slot = garage.getSlot();
    // const since = new Date(order.created_at);
    // since.setDate(since.getDate() - 2);
    // federation.roboPool.subscribeChat(
    //   `${order.id}`,
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
    const peerPublicKey = order.is_maker ? order.taker_nostr_pubkey : order.maker_nostr_pubkey;
    const ownPublicKey = order.is_maker ? order.maker_nostr_pubkey : order.taker_nostr_pubkey;

    if (!slot?.nostrSecKey || !peerPublicKey || !ownPublicKey) return;

    try {
      const ownWappedEvent = nip17.wrapEvent(slot?.nostrSecKey, {
        publicKey: ownPublicKey,
        relayUrl: coordinator.getRelayUrl(),
      }, content);

      federation.roboPool.sendEvent(ownWappedEvent);

      const peerWrappedEvent = nip17.wrapEvent(slot?.nostrSecKey, {
        publicKey: peerPublicKey,
        relayUrl: coordinator.getRelayUrl(),
      }, content);

      federation.roboPool.sendEvent(peerWrappedEvent);

    } catch (error) {
      console.error('Nostr nip17 error:', error);
    }
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
      peerPubKey={peerPubKey}
      setPeerPubKey={setPeerPubKey}
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
      peerPubKey={peerPubKey}
      setPeerPubKey={setPeerPubKey}
    />
  );
};

export default EncryptedChat;
