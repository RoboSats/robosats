import React, { useContext, useState, useEffect, useCallback } from 'react';
import { type Order } from '../../../models';
import EncryptedApiChat from './EncryptedApiChat';
import { type EventTemplate, type Event, nip59 } from 'nostr-tools';
import { GarageContext, type UseGarageStoreType } from '../../../contexts/GarageContext';
import {
  FederationContext,
  type UseFederationStoreType,
} from '../../../contexts/FederationContext';
import { encryptMessage } from '../../../pgp';
import { apiClient } from '../../../services/api';
import { UseAppStoreType, AppContext } from '../../../contexts/AppContext';
import EncryptedSocketChat from './EncryptedSocketChat';
import { encryptFile, generateKey } from '../../../utils/crypto/xchacha20';
import { uploadToBlossom } from '../../../utils/blossom';
import {
  createFileMessage,
  parseFileMessage,
  type ParsedFileMessage,
} from '../../../utils/nip17File';

interface Props {
  order: Order;
  chatOffset: number;
  messages: EncryptedChatMessage[];
  setMessages: (
    state: EncryptedChatMessage[] | ((prev: EncryptedChatMessage[]) => EncryptedChatMessage[]),
  ) => void;
  peerPubKey?: string;
  setPeerPubKey: (peerPubKey: string) => void;
}

export interface EncryptedChatMessage {
  userNick: string;
  validSignature: boolean;
  plainTextMessage: string;
  fileMetadata?: ParsedFileMessage;
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
  peerPubKey,
  setPeerPubKey,
}: Props): React.JSX.Element => {
  const { settings } = useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);

  const [error, setError] = useState<string>('');
  const [lastIndex, setLastIndex] = useState<number>(0);
  const [receivedEventIds, setReceivedEventIds] = useState<Set<string>>(new Set());

  // for incoming Nostr events
  const handleNostrEvent = useCallback(
    (event: Event) => {
      const slot = garage.getSlot();
      if (!slot?.nostrSecKey) return;

      if (receivedEventIds.has(event.id)) return;

      try {
        const unwrapped = nip59.unwrapEvent(event, slot.nostrSecKey);
        if (!unwrapped) return;

        const orderIdTag = unwrapped.tags.find((t) => t[0] === 'order_id');
        const expectedOrderId = `${order.shortAlias}/${order.id}`;
        if (orderIdTag?.[1] !== expectedOrderId) return;

        setReceivedEventIds((prev) => new Set(prev).add(event.id));

        const senderPubKey = unwrapped.pubkey;
        const isSelf =
          senderPubKey === (order.is_maker ? order.maker_nostr_pubkey : order.taker_nostr_pubkey);
        const senderNick = isSelf
          ? order.ur_nick
          : order.is_maker
            ? order.taker_nick
            : order.maker_nick;

        if (unwrapped.kind === 15) {
          const fileData = parseFileMessage(unwrapped);
          if (fileData) {
            const newMessage: EncryptedChatMessage = {
              index: unwrapped.created_at + Math.random() * 0.001,
              userNick: senderNick,
              validSignature: true,
              plainTextMessage: `[Encrypted Image]`,
              fileMetadata: fileData,
              encryptedMessage: JSON.stringify(unwrapped),
              time: new Date(unwrapped.created_at * 1000).toLocaleTimeString(),
            };

            setMessages((prev: EncryptedChatMessage[]) => {
              const exists = prev.some(
                (m) => m.fileMetadata?.sha256 === fileData.sha256 && m.userNick === senderNick,
              );
              if (exists) return prev;
              return [...prev, newMessage].sort((a, b) => a.index - b.index);
            });
          }
        }

        // handle Kind 14 - for future use
        if (unwrapped.kind === 14) {
          const newMessage: EncryptedChatMessage = {
            index: unwrapped.created_at + Math.random() * 0.001,
            userNick: senderNick,
            validSignature: true,
            plainTextMessage: unwrapped.content,
            encryptedMessage: JSON.stringify(unwrapped),
            time: new Date(unwrapped.created_at * 1000).toLocaleTimeString(),
          };

          setMessages((prev: EncryptedChatMessage[]) => {
            const exists = prev.some(
              (m) =>
                m.plainTextMessage === unwrapped.content &&
                Math.abs(m.index - newMessage.index) < 1,
            );
            if (exists) return prev;
            return [...prev, newMessage].sort((a, b) => a.index - b.index);
          });
        }
      } catch (err) {
        console.error('Failed to process Nostr event:', err);
      }
    },
    [garage, order, receivedEventIds, setMessages],
  );

  // subscribe to Nostr notifs for incoming file msgs
  useEffect(() => {
    const slot = garage.getSlot();
    if (!slot?.nostrSecKey) return;

    federation.roboPool.subscribeNotifications(garage, {
      onevent: handleNostrEvent,
      oneose: () => {},
    });
  }, [federation.roboPool, garage, handleNostrEvent]);

  const onSendMessage = async (content: string): Promise<object | void> => {
    sendToNostr(content);
    return sendToCoordinator(content);
  };

  const sendToNostr = (content: string): void => {
    const slot = garage.getSlot();
    const coordinator = federation.getCoordinator(order.shortAlias);
    const peerPublicKey = order.is_maker ? order.taker_nostr_pubkey : order.maker_nostr_pubkey;
    const ownPublicKey = order.is_maker ? order.maker_nostr_pubkey : order.taker_nostr_pubkey;

    if (!slot?.nostrSecKey || !peerPublicKey || !ownPublicKey) return;

    try {
      const messageEvent: EventTemplate = {
        created_at: Math.ceil(Date.now() / 1000),
        kind: 14,
        tags: [
          ['order_id', `${order.shortAlias}/${order.id}`],
          ['p', peerPublicKey, coordinator.getRelayUrl()],
          ['p', ownPublicKey, coordinator.getRelayUrl()],
        ],
        content,
      };

      const peerWrappedEvent = nip59.wrapEvent(messageEvent, slot?.nostrSecKey, peerPublicKey);
      federation.roboPool.sendEvent(peerWrappedEvent);

      const ownWrappedEvent = nip59.wrapEvent(messageEvent, slot?.nostrSecKey, ownPublicKey);
      federation.roboPool.sendEvent(ownWrappedEvent);
    } catch (error) {
      console.error('Nostr nip17 error:', error);
    }
  };

  const sendToCoordinator = async (content: string): Promise<object | void> => {
    const slot = garage.getSlot();
    const robot = slot?.getRobot();
    const url = federation.getCoordinator(garage.getSlot()?.activeOrder?.shortAlias ?? '').url;

    const encryptedMessage = await encryptMessage(
      content,
      robot?.pubKey ?? '',
      peerPubKey ?? '',
      robot?.encPrivKey ?? '',
      slot?.token ?? '',
    ).catch((error) => {
      setError(error.toString());
    });

    if (!encryptedMessage) return;

    return apiClient.post(
      url,
      `/api/chat/`,
      {
        PGP_message: String(encryptedMessage).split('\n').join('\\'),
        order_id: order.id,
        offset: lastIndex,
      },
      { tokenSHA256: slot?.getRobot()?.tokenSHA256 ?? '' },
    );
  };

  const sendFileToNostr = async (file: File): Promise<void> => {
    const slot = garage.getSlot();
    const coordinator = federation.getCoordinator(order.shortAlias);
    const peerPublicKey = order.is_maker ? order.taker_nostr_pubkey : order.maker_nostr_pubkey;
    const ownPublicKey = order.is_maker ? order.maker_nostr_pubkey : order.taker_nostr_pubkey;

    if (!slot?.nostrSecKey || !peerPublicKey || !ownPublicKey || !coordinator) return;

    try {
      const key = generateKey();
      const { ciphertext, nonce } = await encryptFile(await file.arrayBuffer(), key);
      const { url, sha256 } = await uploadToBlossom(ciphertext, coordinator.url, slot.nostrSecKey);

      const fileEvent = createFileMessage({
        url,
        mimeType: file.type,
        key,
        nonce,
        sha256,
        orderId: order.id,
        coordinatorShortAlias: order.shortAlias,
        peerPubKey: peerPublicKey,
        ownPubKey: ownPublicKey,
        relayUrl: coordinator.getRelayUrl(),
      });

      const peerWrappedEvent = nip59.wrapEvent(fileEvent, slot.nostrSecKey, peerPublicKey);
      federation.roboPool.sendEvent(peerWrappedEvent);

      const ownWrappedEvent = nip59.wrapEvent(fileEvent, slot.nostrSecKey, ownPublicKey);
      federation.roboPool.sendEvent(ownWrappedEvent);
    } catch (error) {
      console.error('File upload error:', error);
    }
  };

  return settings.connection === 'api' ? (
    <EncryptedApiChat
      messages={messages}
      setMessages={setMessages}
      onSendMessage={onSendMessage}
      onSendFile={sendFileToNostr}
      order={order}
      takerNick={order.taker_nick}
      takerHashId={order.taker_hash_id}
      makerHashId={order.maker_hash_id}
      userNick={order.ur_nick}
      chatOffset={chatOffset}
      peerPubKey={peerPubKey}
      setPeerPubKey={setPeerPubKey}
      error={error}
      setError={setError}
      lastIndex={lastIndex}
      setLastIndex={setLastIndex}
    />
  ) : (
    <EncryptedSocketChat
      messages={messages}
      setMessages={setMessages}
      onSendMessage={(content) => sendToNostr(content)}
      onSendFile={sendFileToNostr}
      order={order}
      takerNick={order.taker_nick}
      takerHashId={order.taker_hash_id}
      makerHashId={order.maker_hash_id}
      userNick={order.ur_nick}
      peerPubKey={peerPubKey}
      setPeerPubKey={setPeerPubKey}
      status={order.status}
    />
  );
};

export default EncryptedChat;
