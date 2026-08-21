import React, { useContext, useState } from 'react';
import { type Order } from '../../../models';
import EncryptedApiChat from './EncryptedApiChat';
// import EncryptedNostrChat from './EncryptedNostrChat';
import { type EventTemplate, nip59 } from 'nostr-tools';
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
import { createFileMessage, type ParsedFileMessage } from '../../../utils/nip17File';

/**
 * Strip EXIF and other metadata by re-drawing the image onto a canvas and
 * exporting it as a clean raster blob. Returns the sanitised File.
 * Falls back to the original file if the canvas API is unavailable (e.g. Android WebView
 * without canvas support).
 */
async function stripImageMetadata(file: File): Promise<File> {
  return await new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0);

        // Prefer the original MIME type but only allow the safe allowlist types.
        // GIF and WebP animations are flattened to a single frame — acceptable privacy trade-off.
        const outputMime =
          file.type === 'image/png' || file.type === 'image/gif' ? 'image/png' : 'image/jpeg';

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            resolve(new File([blob], file.name, { type: outputMime }));
          },
          outputMime,
          0.92,
        );
      } catch {
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

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
  const { settings } = useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);

  const [error, setError] = useState<string>('');
  const [lastIndex, setLastIndex] = useState<number>(0);

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

  const sendFile = async (file: File): Promise<void> => {
    const slot = garage.getSlot();
    const coordinator = federation.getCoordinator(order.shortAlias);
    const peerPublicKey = order.is_maker ? order.taker_nostr_pubkey : order.maker_nostr_pubkey;
    const ownPublicKey = order.is_maker ? order.maker_nostr_pubkey : order.taker_nostr_pubkey;

    if (!slot?.nostrSecKey || !peerPublicKey || !ownPublicKey || !coordinator) return;

    try {
      const key = generateKey();
      // Strip EXIF/metadata by re-encoding through canvas before encrypting.
      const sanitisedFile = await stripImageMetadata(file);
      const fileBuffer = await sanitisedFile.arrayBuffer();
      const fileUint8 = new Uint8Array(fileBuffer);
      const originalSha256 = await computeSha256(fileUint8);

      const { ciphertext, nonce } = await encryptFile(fileBuffer, key);
      const { url, sha256 } = await uploadToBlossom(ciphertext, coordinator.url, slot.nostrSecKey);

      const fileEvent = createFileMessage({
        url,
        mimeType: sanitisedFile.type,
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
        mimeType: sanitisedFile.type,
      });
      await sendToCoordinator(imageMetadata);
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
      onSendFile={sendFile}
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
      onSendFile={sendFile}
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
