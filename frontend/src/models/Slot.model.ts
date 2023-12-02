import { Robot, type Order } from '.';

class Slot {
  constructor(token: string) {
    this.token = token;
    this.robots = {};
    this.order = null;
    this.activeShortAlias = null;
    this.lastShortAlias = null;
    this.copiedToken = false;
    this.avatarLoaded = false;
  }

  token: string | null;
  robots: Record<string, Robot>;
  order: Order | null;
  activeShortAlias: string | null;
  lastShortAlias: string | null;
  copiedToken: boolean;
  avatarLoaded: boolean;

  setAvatarLoaded = (avatarLoaded: boolean): void => {
    this.avatarLoaded = avatarLoaded;
  };

  setCopiedToken = (copied: boolean): void => {
    this.copiedToken = copied;
  };

  getRobot = (shortAlias?: string): Robot | null => {
    if (shortAlias != null) {
      return this.robots[shortAlias];
    } else if (this.activeShortAlias !== null && this.robots[this.activeShortAlias] != null) {
      return this.robots[this.activeShortAlias];
    } else if (this.lastShortAlias !== null && this.robots[this.lastShortAlias] != null) {
      return this.robots[this.lastShortAlias];
    } else if (Object.values(this.robots).length > 0) {
      return Object.values(this.robots)[0];
    }
    return null;
  };

  upsertRobot = (shortAlias: string, attributes: Record<any, any>): Robot | null => {
    if (this.robots[shortAlias] === undefined) this.robots[shortAlias] = new Robot();

    this.robots[shortAlias].update(attributes);

    if (attributes.lastOrderId !== undefined && attributes.lastOrderId != null) {
      this.lastShortAlias = shortAlias;
      if (this.activeShortAlias === shortAlias) {
        this.activeShortAlias = null;
      }
    }
    if (attributes.activeOrderId !== undefined && attributes.activeOrderId != null) {
      this.activeShortAlias = attributes.shortAlias;
    }

    return this.robots[shortAlias];
  };
}

export default Slot;
