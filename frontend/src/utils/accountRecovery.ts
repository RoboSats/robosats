import { type Event, type UnsignedEvent, nip59, getPublicKey } from 'nostr-tools';
import type RoboPool from '../services/RoboPool';

const ACCOUNT_RECOVERY_KIND = 30078;
const D_TAG_VALUE = 'robosats-garage-account';

interface AccountRecoveryData {
  accountIndex: number;
}

export function createAccountRecoveryEvent(
  nostrSecKey: Uint8Array,
  accountIndex: number,
): Event {
  const nostrPubKey = getPublicKey(nostrSecKey);

  const innerEvent: Partial<UnsignedEvent> = {
    kind: ACCOUNT_RECOVERY_KIND,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['d', D_TAG_VALUE], // Parameterized replaceable event identifier
      ['account', String(accountIndex)],
    ],
    content: '',
  };

  const wrappedEvent = nip59.wrapEvent(innerEvent, nostrSecKey, nostrPubKey);
  return wrappedEvent;
}

export function parseAccountRecoveryEvent(event: Event): AccountRecoveryData | null {
  if (event.kind !== ACCOUNT_RECOVERY_KIND) {
    return null;
  }

  const dTag = event.tags.find((t) => t[0] === 'd')?.[1];
  if (dTag !== D_TAG_VALUE) {
    return null;
  }

  const accountTag = event.tags.find((t) => t[0] === 'account')?.[1];
  if (!accountTag) {
    return null;
  }

  const accountIndex = parseInt(accountTag, 10);
  if (isNaN(accountIndex) || accountIndex < 0) {
    return null;
  }

  return { accountIndex };
}

export function publishAccountRecoveryEvent(event: Event, roboPool: RoboPool): void {
  roboPool.sendEvent(event);
  console.log('Account recovery: Published event to relays');
}

export function saveAccountRecovery(
  nostrSecKey: Uint8Array,
  accountIndex: number,
  roboPool: RoboPool,
): void {
  const event = createAccountRecoveryEvent(nostrSecKey, accountIndex);
  publishAccountRecoveryEvent(event, roboPool);
}

export { ACCOUNT_RECOVERY_KIND, D_TAG_VALUE };
