import {
  CHAT_PARTICIPATION_KIND,
  chatParticipationDTag,
  createChatParticipationEvent,
  publishChatParticipation,
} from '../chatParticipation';

const SEC_KEY = new Uint8Array(32).fill(7);
const COORDINATOR_PUBKEY = 'aa'.repeat(32);

function makeRoboPool(sendEvent: () => void = () => undefined) {
  return { sendEvent: jest.fn(sendEvent) };
}

describe('chatParticipationDTag', () => {
  it('binds the event to the order id with the robosats-chat prefix', () => {
    expect(chatParticipationDTag(42)).toBe('robosats-chat-42');
    expect(chatParticipationDTag(1)).not.toBe(chatParticipationDTag(2));
  });
});

describe('createChatParticipationEvent', () => {
  it('builds a signed kind-30079 event with d and coordinator p tags', () => {
    const event = createChatParticipationEvent(SEC_KEY, 42, COORDINATOR_PUBKEY);

    expect(event.kind).toBe(CHAT_PARTICIPATION_KIND);
    expect(event.kind).toBe(30079);
    expect(event.content).toBe('');
    expect(event.tags).toContainEqual(['d', 'robosats-chat-42']);
    expect(event.tags).toContainEqual(['p', COORDINATOR_PUBKEY]);
    expect(event.sig).toHaveLength(128);
  });

  it('binds the d tag to the given order id', () => {
    const event = createChatParticipationEvent(SEC_KEY, 777, COORDINATOR_PUBKEY);
    expect(event.tags.find((t) => t[0] === 'd')?.[1]).toBe(chatParticipationDTag(777));
  });
});

describe('publishChatParticipation', () => {
  it('publishes the event to the relay pool and reports success', () => {
    const roboPool = makeRoboPool();

    const published = publishChatParticipation(42, SEC_KEY, COORDINATOR_PUBKEY, roboPool);

    expect(published).toBe(true);
    expect(roboPool.sendEvent).toHaveBeenCalledTimes(1);
    const event = roboPool.sendEvent.mock.calls[0][0];
    expect(event.kind).toBe(CHAT_PARTICIPATION_KIND);
    expect(event.tags).toContainEqual(['d', 'robosats-chat-42']);
  });

  it('does not publish without a nostr secret key', () => {
    const roboPool = makeRoboPool();

    const published = publishChatParticipation(42, undefined, COORDINATOR_PUBKEY, roboPool);

    expect(published).toBe(false);
    expect(roboPool.sendEvent).not.toHaveBeenCalled();
  });

  it('does not publish without a coordinator nostr pubkey', () => {
    const roboPool = makeRoboPool();

    const published = publishChatParticipation(42, SEC_KEY, undefined, roboPool);

    expect(published).toBe(false);
    expect(roboPool.sendEvent).not.toHaveBeenCalled();
  });

  it('reports failure when the relay pool rejects the event', () => {
    const roboPool = makeRoboPool(() => {
      throw new Error('relay unreachable');
    });

    const published = publishChatParticipation(42, SEC_KEY, COORDINATOR_PUBKEY, roboPool);

    expect(published).toBe(false);
    expect(roboPool.sendEvent).toHaveBeenCalledTimes(1);
  });
});
