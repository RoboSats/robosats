import {
  generateGarageKey,
  decodeGarageKey,
  encodeGarageKey,
  validateGarageKey,
  deriveRobotKey,
  derivedKeyToToken,
  getNostrSecKeyFromGarageKey,
  getNostrPubKeyFromGarageKey,
} from '../utils/garageKey';
import { systemClient } from '../services/System';
import { getPublicKey } from 'nostr-tools';
import type RoboPool from '../services/RoboPool';
import { getLegacyNostrSecKeyFromGarageKey, isValidAccountIndex } from '../utils/garageKey';

const STORAGE_KEY = 'garage_key';
const STORAGE_ACCOUNT_KEY = 'garage_key_account';

interface GarageKeyData {
  encodedKey: string;
  currentAccountIndex: number;
}

class GarageKey {
  encodedKey: string;
  plainKey: Uint8Array;
  nostrSecKey: Uint8Array;
  nostrPubKey: string;
  currentAccountIndex: number;

  private onUpdate: () => void;

  constructor(encodedKeyOrGenerate: string | 'generate', onUpdate?: () => void) {
    this.onUpdate = onUpdate ?? (() => {});

    if (encodedKeyOrGenerate === 'generate') {
      this.encodedKey = generateGarageKey();
    } else {
      const validation = validateGarageKey(encodedKeyOrGenerate);
      if (!validation.valid) {
        throw new Error(validation.error ?? 'Invalid garage key');
      }
      this.encodedKey = encodedKeyOrGenerate;
    }

    this.plainKey = decodeGarageKey(this.encodedKey);
    this.nostrSecKey = getNostrSecKeyFromGarageKey(this.plainKey);
    this.nostrPubKey = getNostrPubKeyFromGarageKey(this.plainKey);
    this.currentAccountIndex = 0;
  }

  deriveRobotToken = (accountIndex?: number): string => {
    const index = accountIndex ?? this.currentAccountIndex;
    const derivedKey = deriveRobotKey(this.plainKey, index);
    return derivedKeyToToken(derivedKey);
  };

  getCurrentRobotToken = (): string => {
    return this.deriveRobotToken(this.currentAccountIndex);
  };

  incrementAccount = (): number => {
    this.setAccountIndex(this.currentAccountIndex + 1);
    return this.currentAccountIndex;
  };

  decrementAccount = (): number => {
    if (this.currentAccountIndex > 0) {
      this.currentAccountIndex -= 1;
      this.save();
      this.onUpdate();
    }
    return this.currentAccountIndex;
  };

  setAccountIndex = (index: number): void => {
    if (!isValidAccountIndex(index)) {
      throw new Error('Account index must be an integer between 0 and 2147483647');
    }
    this.currentAccountIndex = index;
    this.save();
    this.onUpdate();
  };

  getNostrSecKey = (): Uint8Array => {
    return this.nostrSecKey;
  };

  recoverAccount = async (roboPool: RoboPool): Promise<void> => {
    let latestAccountIndex = this.currentAccountIndex;
    let latestCreatedAt = -1;

    await Promise.all(
      [this.nostrSecKey, getLegacyNostrSecKeyFromGarageKey(this.plainKey)].map(
        (secret) =>
          new Promise<void>((resolve) => {
            roboPool.subscribeAccountRecovery(
              getPublicKey(secret),
              secret,
              (accountIndex, createdAt) => {
                if (!isValidAccountIndex(accountIndex)) return;
                if (
                  createdAt > latestCreatedAt ||
                  (createdAt === latestCreatedAt && accountIndex > latestAccountIndex)
                ) {
                  latestCreatedAt = createdAt;
                  latestAccountIndex = accountIndex;
                }
              },
              resolve,
            );
          }),
      ),
    );

    if (latestAccountIndex !== this.currentAccountIndex) {
      this.setAccountIndex(latestAccountIndex);
    }
  };

  getNostrPubKey = (): string => {
    return this.nostrPubKey;
  };

  getEncodedKey = (): string => {
    return encodeGarageKey(this.plainKey);
  };

  save = (): void => {
    const data: GarageKeyData = {
      encodedKey: this.encodedKey,
      currentAccountIndex: this.currentAccountIndex,
    };
    systemClient.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  delete = (): void => {
    systemClient.deleteItem(STORAGE_KEY);
    systemClient.deleteItem(STORAGE_ACCOUNT_KEY);
  };

  static load = async (onUpdate?: () => void): Promise<GarageKey | null> => {
    try {
      const dataStr = await systemClient.getItem(STORAGE_KEY);
      if (!dataStr) return null;

      const data: GarageKeyData = JSON.parse(dataStr);
      if (!data.encodedKey) return null;

      const garageKey = new GarageKey(data.encodedKey, onUpdate);
      if (!isValidAccountIndex(data.currentAccountIndex ?? 0)) return null;
      garageKey.currentAccountIndex = data.currentAccountIndex ?? 0;
      return garageKey;
    } catch (error) {
      console.error('Failed to load garage key:', error);
      return null;
    }
  };

  static exists = async (): Promise<boolean> => {
    const dataStr = await systemClient.getItem(STORAGE_KEY);
    return dataStr !== null && dataStr !== '';
  };
}

export default GarageKey;
