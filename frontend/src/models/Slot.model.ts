import { sha256 } from 'js-sha256';
import { sha256 as sha256Hash } from '@noble/hashes/sha256';
import { sha512 } from '@noble/hashes/sha512';
import { Robot, Order, type Federation } from '.';
import { roboidentitiesClient } from '../services/Roboidentities/Web';
import { hexToBase91, validateTokenEntropy } from '../utils';
import { getPublicKey } from 'nostr-tools';

class Slot {
  constructor(
    token: string,
    shortAliases: string[],
    robotAttributes: object,
    onSlotUpdate: () => void,
  ) {
    this.onSlotUpdate = onSlotUpdate;
    this.token = token;

    this.hashId = sha256(sha256(this.token));
    this.nickname = null;
    void roboidentitiesClient.generateRoboname(this.hashId).then((nickname) => {
      this.nickname = nickname;
      onSlotUpdate();
    });
    void roboidentitiesClient.generateRobohash(this.hashId, 'small');
    void roboidentitiesClient.generateRobohash(this.hashId, 'large');

    const { hasEnoughEntropy, bitsEntropy, shannonEntropy } = validateTokenEntropy(token);
    const tokenSHA256 = hexToBase91(sha256(token));

    const nostrHash = sha256Hash(sha512(this.token));
    this.nostrSecKey = nostrHash;
    const nostrPubKey = getPublicKey(this.nostrSecKey);
    this.nostrPubKey = nostrPubKey;

    this.robots = shortAliases.reduce((acc: Record<string, Robot>, shortAlias: string) => {
      acc[shortAlias] = new Robot({
        ...robotAttributes,
        shortAlias,
        hasEnoughEntropy,
        bitsEntropy,
        shannonEntropy,
        tokenSHA256,
        nostrPubKey,
      });
      this.updateSlotFromRobot(acc[shortAlias]);
      return acc;
    }, {});

    this.copiedToken = false;
    this.onSlotUpdate();
  }

  token: string | null;
  hashId: string | null;
  nickname: string | null;
  robots: Record<string, Robot>;
  activeOrder: Order | null = null;
  lastOrder: Order | null = null;
  copiedToken: boolean;
  nostrSecKey?: Uint8Array;
  nostrPubKey?: string;

  onSlotUpdate: () => void;

  setCopiedToken = (copied: boolean): void => {
    this.copiedToken = copied;
  };

  // Robots
  getRobot = (shortAlias?: string): Robot | null => {
    if (shortAlias) {
      return this.robots[shortAlias];
    } else if (this.activeOrder?.id) {
      return this.robots[this.activeOrder.shortAlias];
    } else if (this.lastOrder?.id && this.robots[this.lastOrder.shortAlias]) {
      return this.robots[this.lastOrder.shortAlias];
    } else if (Object.values(this.robots).length > 0) {
      return Object.values(this.robots)[0];
    }
    return null;
  };

  fetchRobot = async (federation: Federation): Promise<void> => {
    Object.values(this.robots).forEach((robot) => {
      void robot.fetch(federation).then((robot) => {
        this.updateSlotFromRobot(robot);
      });
    });
  };

  updateSlotFromRobot = (robot: Robot | null): void => {
    if (!robot) return;

    if (robot.lastOrderId && this.lastOrder?.id !== robot.lastOrderId) {
      this.lastOrder = new Order({ id: robot.lastOrderId, shortAlias: robot.shortAlias });
      if (this.activeOrder?.id === robot.lastOrderId) {
        this.lastOrder = this.activeOrder;
        this.activeOrder = null;
      }
    }
    if (robot.activeOrderId && this.activeOrder?.id !== robot.activeOrderId) {
      this.activeOrder = new Order({
        id: robot.activeOrderId,
        shortAlias: robot.shortAlias,
      });
    }
    this.onSlotUpdate();
  };

  // Orders
  fetchActiveOrder = async (federation: Federation): Promise<void> => {
    void this.activeOrder?.fecth(federation, this);
    this.updateSlotFromOrder(this.activeOrder);
  };

  takeOrder = async (federation: Federation, order: Order, takeAmount: string): Promise<Order> => {
    await order.take(federation, this, takeAmount);
    this.updateSlotFromOrder(order);
    return order;
  };

  makeOrder = async (federation: Federation, attributes: object): Promise<Order> => {
    const order = new Order(attributes);
    await order.make(federation, this);
    if (!order?.bad_request) {
      this.lastOrder = this.activeOrder;
      this.activeOrder = order;
      this.onSlotUpdate();
    }
    return order;
  };

  updateSlotFromOrder: (newOrder: Order | null) => void = (newOrder) => {
    if (newOrder) {
      // FIXME: API responses with bad_request should include also order's status
      if (newOrder?.bad_request?.includes('expired')) newOrder.status = 5;
      if (newOrder?.bad_request?.includes('collaborativelly')) newOrder.status = 12;
      if (
        newOrder.id === this.activeOrder?.id &&
        newOrder.shortAlias === this.activeOrder?.shortAlias
      ) {
        this.activeOrder?.update(newOrder);
        if (this.activeOrder?.bad_request) {
          this.lastOrder = this.activeOrder;
          this.activeOrder = null;
        }
        this.onSlotUpdate();
      } else if (newOrder?.is_participant && this.lastOrder?.id !== newOrder.id) {
        this.activeOrder = newOrder;
        this.onSlotUpdate();
      }
    }
  };

  syncCoordinator: (federation: Federation, shortAlias: string) => void = (
    federation,
    shortAlias,
  ) => {
    const defaultRobot = this.getRobot();
    if (defaultRobot?.token) {
      this.robots[shortAlias] = new Robot({
        shortAlias,
        hasEnoughEntropy: defaultRobot.hasEnoughEntropy,
        bitsEntropy: defaultRobot.bitsEntropy,
        shannonEntropy: defaultRobot.shannonEntropy,
        token: defaultRobot.token,
        pubKey: defaultRobot.pubKey,
        encPrivKey: defaultRobot.encPrivKey,
      });
      void this.robots[shortAlias].fetch(federation);
      this.updateSlotFromRobot(this.robots[shortAlias]);
    }
  };
}

export default Slot;
