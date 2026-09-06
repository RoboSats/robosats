import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
 * Falls back to the original file if the canvas API is unavailable.
 *
 * NOTE: we load the image via FileReader.readAsDataURL() rather than
 * URL.createObjectURL() because blob: URLs are blocked when the document
 * origin is file:// (Electron desktop and Android WebView).  A data: URL
 * works on every platform.
 */
async function stripImageMetadata(file: File): Promise<File> {
  // Step 1 — read the file as a data: URL using FileReader (works on all platforms).
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  // Step 2 — draw onto a canvas to strip EXIF and re-encode.
  return await new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
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
      resolve(file);
    };

    img.src = dataUrl;
  });
}

/**
 * Check whether the browser allows canvas pixel readback.
 *
 * Tor Browser (and some hardened Firefox configurations) gate canvas
 * extraction behind a permission doorhanger.  When the user has not granted
 * the permission yet, `canvas.toBlob()` / `toDataURL()` silently returns an
 * all-transparent or solid-colour result instead of the real pixels.
 *
 * We detect this by drawing a pixel of a known colour to a 1×1 canvas and
 * reading it back.  If the readback value does not match what we drew, canvas
 * access is blocked.
 *
 * Returns `true` when canvas readback works normally.
 */
async function isCanvasReadbackAllowed(): Promise<boolean> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return true; // Canvas not supported at all — fall through gracefully.

    // Draw a distinctive non-transparent colour (R=77, G=88, B=99, A=255).
    ctx.fillStyle = 'rgb(77, 88, 99)';
    ctx.fillRect(0, 0, 1, 1);

    return await new Promise<boolean>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          // toBlob returned null — treat as blocked.
          resolve(false);
          return;
        }
        // Read the blob back as an ImageBitmap and sample the pixel.
        createImageBitmap(blob)
          .then((bmp) => {
            const check = document.createElement('canvas');
            check.width = 1;
            check.height = 1;
            const ctx2 = check.getContext('2d');
            if (!ctx2) {
              resolve(true); // Can't verify — assume OK.
              return;
            }
            ctx2.drawImage(bmp, 0, 0);
            const px = ctx2.getImageData(0, 0, 1, 1).data;
            // Allow a small tolerance for JPEG/lossy re-encoding artefacts.
            const rOk = Math.abs(px[0] - 77) <= 10;
            const gOk = Math.abs(px[1] - 88) <= 10;
            const bOk = Math.abs(px[2] - 99) <= 10;
            const aOk = px[3] > 200; // Must be mostly opaque.
            resolve(rOk && gOk && bOk && aOk);
          })
          .catch(() => resolve(true)); // createImageBitmap failed — assume OK.
      }, 'image/png');
    });
  } catch {
    return true; // Any unexpected error — don't block the user.
  }
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
  blossomEnabled: boolean;
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
  blossomEnabled,
}: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const { settings } = useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);

  // Resolve the receiver's own working URL for the coordinator.  This is used
  // by MessageCard to build a local blossom download URL that is always
  // reachable regardless of the topology the *sender* was using.
  const coordinatorUrl = federation.getCoordinator(order.shortAlias)?.url;

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
    if (!blossomEnabled) {
      setError('This coordinator does not offer image uploads');
      return;
    }
    const slot = garage.getSlot();
    const coordinator = federation.getCoordinator(order.shortAlias);
    const peerPublicKey = order.is_maker ? order.taker_nostr_pubkey : order.maker_nostr_pubkey;
    const ownPublicKey = order.is_maker ? order.maker_nostr_pubkey : order.taker_nostr_pubkey;

    if (!slot?.nostrSecKey || !peerPublicKey || !ownPublicKey || !coordinator) return;

    // Preflight: verify canvas readback is allowed before stripping EXIF.
    // Tor Browser (and hardened browsers) block canvas extraction behind a
    // permission prompt. If readback is blocked, toBlob() returns a blank
    // image silently — the sender would unknowingly send a solid-colour blob.
    // Abort and show a clear error so the user can grant the permission first.
    const canvasOk = await isCanvasReadbackAllowed();
    if (!canvasOk) {
      setError(
        t(
          'Canvas access is blocked. In Tor Browser, click the canvas icon in the address bar and allow canvas extraction, then try again.',
        ),
      );
      return;
    }

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
      blossomEnabled={blossomEnabled}
      coordinatorUrl={coordinatorUrl}
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
      blossomEnabled={blossomEnabled}
      coordinatorUrl={coordinatorUrl}
    />
  );
};

export default EncryptedChat;
