import { sha256 } from 'js-sha256';
import { Robot, type Order } from '.';
import { robohash } from '../components/RobotAvatar/RobohashGenerator';
import { generate_roboname } from 'robo-identities-wasm';

class Slot {
  constructor(token: string, shortAliases: string[], robotAttributes: Record<any, any>) {
    this.token = token;

    this.hashId = sha256(sha256(this.token));
    this.nickname = generate_roboname(this.hashId);
    // trigger RoboHash avatar generation in webworker and store in RoboHash class cache.
    void robohash.generate(this.hashId, 'small');
    void robohash.generate(this.hashId, 'large');

    this.robots = shortAliases.reduce((acc: Record<string, Robot>, shortAlias: string) => {
      acc[shortAlias] = new Robot(robotAttributes);
      return acc;
    }, {});
    this.order = null;

    this.activeShortAlias = null;
    this.lastShortAlias = null;
    this.copiedToken = false;
  }

  token: string | null;
  hashId: string | null;
  nickname: string | null;
  robots: Record<string, Robot>;
  order: Order | null;
  activeShortAlias: string | null;
  lastShortAlias: string | null;
  copiedToken: boolean;

  setCopiedToken = (copied: boolean): void => {
    this.copiedToken = copied;
  };

  getRobot = (shortAlias?: string): Robot | null => {
    if (shortAlias) {
      return this.robots[shortAlias];
    } else if (this.activeShortAlias !== null && this.robots[this.activeShortAlias]) {
      return this.robots[this.activeShortAlias];
    } else if (this.lastShortAlias !== null && this.robots[this.lastShortAlias]) {
      return this.robots[this.lastShortAlias];
    } else if (Object.values(this.robots).length > 0) {
      return Object.values(this.robots)[0];
    }
    return null;
  };

  updateRobot = (shortAlias: string, attributes: Record<any, any>): Robot | null => {
    this.robots[shortAlias].update(attributes);

    if (attributes.lastOrderId) {
      this.lastShortAlias = shortAlias;
      if (this.activeShortAlias === shortAlias) {
        this.activeShortAlias = null;
      }
    }
    if (attributes.activeOrderId) {
      this.activeShortAlias = attributes.shortAlias;
    }

    return this.robots[shortAlias];
  };
}

export default Slot;
