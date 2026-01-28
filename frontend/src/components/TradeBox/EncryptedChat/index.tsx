import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { type Order } from '../../../models';
import EncryptedApiChat from './EncryptedApiChat';
// import EncryptedNostrChat from './EncryptedNostrChat';
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
import { uploadToBlossom, computeSha256 } from '../../../utils/blossom';
import {
  createFileMessage,
  parseFileMessage,
  type ParsedFileMessage,
  parseImageMetadataJson,
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

export interface ChatApiResponse {
  peer_connected?: boolean;
  peer_pubkey?: string;
  messages?: ServerMessage[];
}

const EncryptedChat: React.FC<Props> = ({
  order,
  chatOffset,
  setMessages,
  messages,
  peerPubKey,
  setPeerPubKey,
}: Props): React.JSX.Element => {
  const { settings, slotUpdatedAt, notificationsUpdatedAt } =
    useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { federation, notifications } = useContext<UseFederationStoreType>(FederationContext);
  const { t } = useTranslation();

  const [error, setError] = useState<string>('');
  const [lastIndex, setLastIndex] = useState<number>(0);
  const receivedEventIds = useRef<Set<string>>(new Set());

  // for incoming Nostr events - receives already unwrapped events from FederationContext
  const handleNostrEvent = useCallback(
    (wrappedEventId: string, unwrappedEvent: Event) => {
      if (settings.connection === 'api') {
        return;
      }

      const slot = garage.getSlot();
      if (!slot?.nostrSecKey) return;

      if (receivedEventIds.current.has(wrappedEventId)) return;

      try {
        // Events already unwrapped by FederationContext
        const orderIdTag = unwrappedEvent.tags.find((t) => t[0] === 'order_id');
        const expectedOrderId = `${order.shortAlias}/${order.id}`;
        if (orderIdTag?.[1] !== expectedOrderId) return;

        receivedEventIds.current.add(wrappedEventId);

        const senderPubKey = unwrappedEvent.pubkey;
        const isSelf =
          senderPubKey === (order.is_maker ? order.maker_nostr_pubkey : order.taker_nostr_pubkey);
        const senderNick = isSelf
          ? order.ur_nick
          : order.is_maker
            ? order.taker_nick
            : order.maker_nick;

        if (unwrappedEvent.kind === 15) {
          const fileData = parseFileMessage(unwrappedEvent);
          if (fileData) {
            const newMessage: EncryptedChatMessage = {
              index: unwrappedEvent.created_at + Math.random() * 0.001,
              userNick: senderNick,
              validSignature: true,
              plainTextMessage: t('[Encrypted Image]'),
              fileMetadata: fileData,
              encryptedMessage: JSON.stringify(unwrappedEvent),
              time: new Date(unwrappedEvent.created_at * 1000).toLocaleTimeString(),
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

        if (unwrappedEvent.kind === 14) {
          let fileMetadata: ParsedFileMessage | undefined;
          let displayText = unwrappedEvent.content;

          const imgMeta = parseImageMetadataJson(unwrappedEvent.content);
          if (imgMeta) {
            fileMetadata = imgMeta;
            displayText = t('[Encrypted Image]');
          }

          const newMessage: EncryptedChatMessage = {
            index: unwrappedEvent.created_at + Math.random() * 0.001,
            userNick: senderNick,
            validSignature: true,
            plainTextMessage: displayText,
            fileMetadata: fileMetadata,
            encryptedMessage: JSON.stringify(unwrappedEvent),
            time: new Date(unwrappedEvent.created_at * 1000).toLocaleTimeString(),
          };

          setMessages((prev: EncryptedChatMessage[]) => {
            if (fileMetadata) {
              const exists = prev.some(
                (m) => m.fileMetadata?.sha256 === fileMetadata!.sha256 && m.userNick === senderNick,
              );
              if (exists) return prev;
            } else {
              const exists = prev.some(
                (m) => m.encryptedMessage === JSON.stringify(unwrappedEvent),
              );
              if (exists) return prev;
            }
            return [...prev, newMessage].sort((a, b) => a.index - b.index);
          });
        }
      } catch (err) {
        console.error('Failed to process Nostr event:', err);
      }
    },
    [garage, order, setMessages, settings.connection, t],
  );

  const handleNostrEventRef = useRef(handleNostrEvent);
  handleNostrEventRef.current = handleNostrEvent;

  useEffect(() => {
    // Filter by active robot's nostr pubkey
    const slot = garage.getSlot();
    const nostrPubKey = slot?.getRobot()?.nostrPubKey;
    if (!nostrPubKey) return;

    const robotNotifications = notifications[nostrPubKey];
    if (!robotNotifications) return;

    robotNotifications.forEach(([wrappedEvent, unwrappedEvent]) => {
      handleNostrEventRef.current(wrappedEvent.id, unwrappedEvent);
    });
  }, [notificationsUpdatedAt, slotUpdatedAt]);

  const onSendMessage = async (
    content: string,
    options: { skipCoordinator?: boolean } = {},
  ): Promise<object | void> => {
    sendToNostr(content);
    if (!options.skipCoordinator) {
      return sendToCoordinator(content);
    }
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
      const fileBuffer = await file.arrayBuffer();
      const fileUint8 = new Uint8Array(fileBuffer);
      const originalSha256 = await computeSha256(fileUint8);

      const { ciphertext, nonce } = await encryptFile(fileBuffer, key);
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
        originalSha256,
        encryptedSize: ciphertext.length,
      });

      const peerWrappedEvent = nip59.wrapEvent(fileEvent, slot.nostrSecKey, peerPublicKey);
      federation.roboPool.sendEvent(peerWrappedEvent);

      const ownWrappedEvent = nip59.wrapEvent(fileEvent, slot.nostrSecKey, ownPublicKey);
      federation.roboPool.sendEvent(ownWrappedEvent);

      const imageMetadata = JSON.stringify({
        type: 'image',
        url,
        key: btoa(String.fromCharCode(...key)),
        nonce: btoa(String.fromCharCode(...nonce)),
        sha256,
        originalSha256,
        mimeType: file.type,
      });
      await sendToCoordinator(imageMetadata);
    } catch (error) {
      console.error('File upload error:', error);
      setError(error instanceof Error ? error.message : 'File upload failed');
    }
  };

  const sendFileViaApi = async (file: File): Promise<void> => {
    const slot = garage.getSlot();
    const coordinator = federation.getCoordinator(order.shortAlias);
    const peerPublicKey = order.is_maker ? order.taker_nostr_pubkey : order.maker_nostr_pubkey;
    const ownPublicKey = order.is_maker ? order.maker_nostr_pubkey : order.taker_nostr_pubkey;

    if (!slot?.nostrSecKey || !coordinator) return;

    try {
      const key = generateKey();
      const fileBuffer = await file.arrayBuffer();
      const fileUint8 = new Uint8Array(fileBuffer);
      const originalSha256 = await computeSha256(fileUint8);

      const { ciphertext, nonce } = await encryptFile(fileBuffer, key);
      const { url, sha256 } = await uploadToBlossom(ciphertext, coordinator.url, slot.nostrSecKey);

      const imageMetadata = JSON.stringify({
        type: 'image',
        url,
        key: btoa(String.fromCharCode(...key)),
        nonce: btoa(String.fromCharCode(...nonce)),
        sha256,
        originalSha256,
        mimeType: file.type,
      });

      await sendToCoordinator(imageMetadata);

      if (peerPublicKey && ownPublicKey) {
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
          originalSha256,
          encryptedSize: ciphertext.length,
        });

        const peerWrappedEvent = nip59.wrapEvent(fileEvent, slot.nostrSecKey, peerPublicKey);
        federation.roboPool.sendEvent(peerWrappedEvent);

        const ownWrappedEvent = nip59.wrapEvent(fileEvent, slot.nostrSecKey, ownPublicKey);
        federation.roboPool.sendEvent(ownWrappedEvent);
      }
    } catch (error) {
      console.error('File upload error:', error);
      setError(error instanceof Error ? error.message : 'File upload failed');
    }
  };

  // Disabled: Using EncryptedSocketChat for all non-API modes
  // if (settings.connection === 'nostr') {
  //   return (
  //     <EncryptedNostrChat
  //       messages={messages}
  //       setMessages={setMessages}
  //       onSendMessage={onSendMessage}
  //       onSendFile={sendFileToNostr}
  //       order={order}
  //       takerNick={order.taker_nick}
  //       takerHashId={order.taker_hash_id}
  //       makerHashId={order.maker_hash_id}
  //       peerPubKey={peerPubKey}
  //       setPeerPubKey={setPeerPubKey}
  //       error={error}
  //       setError={setError}
  //       // lastIndex={lastIndex}
  //       // setLastIndex={setLastIndex}
  //     />
  //   );
  // }

  return settings.connection === 'api' ? (
    <EncryptedApiChat
      messages={messages}
      setMessages={setMessages}
      onSendMessage={onSendMessage}
      onSendFile={sendFileViaApi}
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
      onSendMessage={onSendMessage}
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
