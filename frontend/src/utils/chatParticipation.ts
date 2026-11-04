import { type Event, finalizeEvent } from 'nostr-tools';
import type RoboPool from '../services/RoboPool';

export const CHAT_PARTICIPATION_KIND = 30079;

export function chatParticipationDTag(orderId: number): string {
  return `robosats-chat-${orderId}`;
}

export function createChatParticipationEvent(
  nostrSecKey: Uint8Array,
  orderId: number,
  coordinatorPubKey: string,
): Event {
  return finalizeEvent(
    {
      kind: CHAT_PARTICIPATION_KIND,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['d', chatParticipationDTag(orderId)],
        ['p', coordinatorPubKey],
      ],
      content: '',
    },
    nostrSecKey,
  );
}

export function publishChatParticipation(
  orderId: number,
  nostrSecKey: Uint8Array | undefined,
  coordinatorPubKey: string | undefined,
  roboPool: RoboPool,
): boolean {
  if (!nostrSecKey || !coordinatorPubKey) return false;

  try {
    const event = createChatParticipationEvent(nostrSecKey, orderId, coordinatorPubKey);
    roboPool.sendEvent(event);
    return true;
  } catch (error) {
    console.error('Chat participation event error:', error);
    return false;
  }
}
