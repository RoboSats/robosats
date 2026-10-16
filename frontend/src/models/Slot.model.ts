import { sha256 } from 'js-sha256';
import { sha256 as sha256Hash, sha512 } from '@noble/hashes/sha2.js';
import Robot from './Robot.model';
import Order from './Order.model';
import type Federation from './Federation.model';
import { roboidentitiesClient } from '../services/Roboidentities/Web';
import hexToBase91 from '../utils/hexToBase91';
import { validateTokenEntropy } from '../utils/token';
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

    const tokenBytes = new TextEncoder().encode(this.token ?? '');
    const nostrSecKey = sha256Hash(sha512(tokenBytes));
    this.nostrSecKey = nostrSecKey;
    const nostrPubKey = getPublicKey(this.nostrSecKey);
    this.nostrPubKey = nostrPubKey;

    this.robots = shortAliases.reduce((acc: Record<string, Robot>, shortAlias: string) => {
      acc[shortAlias] = new Robot({
        ...robotAttributes,
        token,
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

    this.loading = true;

    this.onSlotUpdate();
  }

  token: string | null;
  hashId: string | null;
  nickname: string | null;
  robots: Record<string, Robot>;
  activeOrder: Order | null = null;
  lastOrder: Order | null = null;
  lastOrderStatusKnown: boolean = false;
  nostrSecKey?: Uint8Array;
  nostrPubKey?: string;
  availableRewards: string | null = null;
  loading: boolean;

  onSlotUpdate: () => void;

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
    this.loading = true;

    await Promise.all(
      Object.values(this.robots).map(async (robot) => {
        const fetchedRobot = await robot.fetch(federation);
        this.loading = Object.values(this.robots).some((r) => r.loading);
        this.updateSlotFromRobot(fetchedRobot);
      }),
    );
    this.loading = Object.values(this.robots).some((r) => r.loading);
    this.onSlotUpdate();
  };

  updateSlotFromRobot = (robot: Robot | null): void => {
    if (!robot) return;

    let changed = false;

    if (robot.activeOrderId && this.activeOrder?.id !== robot.activeOrderId) {
      this.activeOrder = new Order({
        id: robot.activeOrderId,
        shortAlias: robot.shortAlias,
      });
      changed = true;
    } else if (
      !robot.activeOrderId &&
      this.activeOrder?.shortAlias === robot.shortAlias &&
      this.lastOrder?.id !== this.activeOrder.id
    ) {
      this.activeOrder = null;
      changed = true;
    }

    if (robot.lastOrderId && this.lastOrder?.id !== robot.lastOrderId) {
      if (robot.lastOrderId === robot.activeOrderId) {
        // The robot reports the same id for both last and active — it is still
        // active, so leave activeOrder in place and skip updating lastOrder.
      } else if (this.activeOrder?.id === robot.lastOrderId) {
        // The previously-active order is now the last order: preserve the full
        // object so that status details are not lost.
        this.lastOrder = this.activeOrder;
        this.lastOrderStatusKnown = this.hasOrderDetails(this.lastOrder);
        this.activeOrder = null;
        changed = true;
      } else {
        // New last order with minimal data, status must be resolved before reusability checks.
        this.lastOrder = new Order({ id: robot.lastOrderId, shortAlias: robot.shortAlias });
        this.lastOrderStatusKnown = false;
        changed = true;
      }
    }

    const previousRewards = this.availableRewards;
    this.availableRewards =
      robot.earnedRewards != undefined && robot.earnedRewards > 0
        ? robot.shortAlias
        : this.availableRewards === robot.shortAlias
          ? null
          : this.availableRewards;
    if (this.availableRewards !== previousRewards) {
      changed = true;
    }

    if (changed) {
      this.onSlotUpdate();
    }
  };

  // Orders
  fetchActiveOrder = async (federation: Federation): Promise<void> => {
    if (this.activeOrder) {
      const order = this.activeOrder;
      const previousStatus = order.status;
      await order.fecth(federation, this);
      if (this.activeOrder !== order) return;
      this.updateSlotFromOrder(order);
      if (this.activeOrder && order.status !== previousStatus) this.onSlotUpdate();
    }
  };

  takeOrder = async (federation: Federation, order: Order, takeAmount: string): Promise<Order> => {
    await order.take(federation, this, takeAmount);
    this.updateSlotFromOrder(order);
    return order;
  };

  makeOrder = async (federation: Federation, attributes: object): Promise<Order> => {
    const order = new Order(attributes);
    await order.make(federation, this);
    if (order.id > 0 && !order.bad_request) {
      if (this.activeOrder) {
        this.lastOrder = this.activeOrder;
        this.lastOrderStatusKnown = this.hasOrderDetails(this.lastOrder);
      }
      this.activeOrder = order;
      this.onSlotUpdate();
    }
    return order;
  };

  private resolveBadRequestStatus = (order: Order): boolean => {
    if (order.bad_request?.includes('expired')) {
      order.status = 5;
      return true;
    }
    if (order.bad_request?.includes('collaborativelly')) {
      order.status = 12;
      return true;
    }
    return false;
  };

  updateSlotFromOrder: (newOrder: Order | null) => void = (newOrder) => {
    if (newOrder) {
      this.resolveBadRequestStatus(newOrder);
      if (
        newOrder.id === this.activeOrder?.id &&
        newOrder.shortAlias === this.activeOrder?.shortAlias
      ) {
        const previousStatus = this.activeOrder?.status;
        const previousBadRequest = this.activeOrder?.bad_request;
        this.activeOrder?.update(newOrder);
        const changed =
          this.activeOrder?.status !== previousStatus ||
          this.activeOrder?.bad_request !== previousBadRequest;
        if (
          this.activeOrder?.bad_request ||
          [4, 5, 12, 14, 17, 18].includes(this.activeOrder.status)
        ) {
          this.lastOrder = this.activeOrder;
          this.lastOrderStatusKnown = this.hasOrderDetails(this.lastOrder);
          this.activeOrder = null;
        }
        if (changed || this.activeOrder === null) {
          this.onSlotUpdate();
        }
      } else if (
        newOrder?.is_participant &&
        (this.lastOrder?.id !== newOrder.id || this.lastOrder?.shortAlias !== newOrder.shortAlias)
      ) {
        if ([4, 5, 12, 14, 17, 18].includes(newOrder.status)) {
          this.lastOrder = newOrder;
          this.lastOrderStatusKnown = this.hasOrderDetails(newOrder);
        } else {
          this.activeOrder = newOrder;
        }
        this.onSlotUpdate();
      }
    }
  };

  private hasOrderDetails = (order: Order | null): boolean => {
    if (!order) return false;

    return (
      order.maker > 0 ||
      order.taker > 0 ||
      order.payment_method !== '' ||
      order.maker_nick !== '' ||
      order.status_message !== '' ||
      order.bond_size !== '' ||
      Boolean(order.bad_request)
    );
  };

  ensureLastOrderStatus = async (federation: Federation): Promise<void> => {
    if (
      !this.lastOrder ||
      this.lastOrderStatusKnown ||
      this.activeOrder?.id === this.lastOrder.id
    ) {
      return;
    }

    await this.lastOrder.fecth(federation, this);
    const statusResolved =
      !this.lastOrder.bad_request || this.resolveBadRequestStatus(this.lastOrder);
    this.lastOrderStatusKnown = this.hasOrderDetails(this.lastOrder) && statusResolved;
    this.onSlotUpdate();
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
        nostrPubKey: defaultRobot.nostrPubKey,
      });
      void this.robots[shortAlias].fetch(federation);
      this.updateSlotFromRobot(this.robots[shortAlias]);
    }
  };

  isReusable = (): boolean => {
    if (this.loading) return false;

    if (this.activeOrder) return false;

    if (!this.lastOrder) {
      return true;
    }

    if (!this.lastOrderStatusKnown) {
      return false;
    }

    const reusableStatuses = [4, 5];

    return reusableStatuses.includes(this.lastOrder.status);
  };
}

export default Slot;
