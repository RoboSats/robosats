import { sha256 } from 'js-sha256';
import { Robot, Order } from '.';
import { apiClient } from '../services/api';
import { systemClient } from '../services/System';
import { tokenStrength } from '../utils';

export interface Slot {
  robot: Robot;
  order: Order | null;
}

export interface fetchRobotProps {
  index?: number;
  action?: 'login' | 'generate';
  url: string;
  newKeys?: { encPrivKey: string; pubKey: string } | null;
  newToken?: string | null;
  refCode?: string | null;
  setBadRequest?: (state: string) => void;
  setCurrentOrder?: (state: number) => void;
}

const emptySlot: Slot = { robot: new Robot(), order: null };

class Garage {
  constructor(initialState?: Garage) {
    this.slots = initialState?.slots || [emptySlot];
    this.setGarage = initialState?.setGarage || (() => {});
  }
  slots: Slot[] = [emptySlot];
  setGarage: (state: Garage) => void = () => {};

  load = () => {
    this.slots =
      systemClient.getItem('garage') != ''
        ? JSON.parse(systemClient.getItem('garage'))
        : [emptySlot];
    this.setGarage(new Garage(this));
    console.log('loaded!');
  };

  save = () => {
    systemClient.setItem('garage', JSON.stringify(this.slots));
    this.setGarage(new Garage(this));
    console.log('saved!');
  };

  delete = () => {
    this.slots = [emptySlot];
    systemClient.deleteItem('garage');
    this.save();
  };

  updateRobot: (robot: Robot, index: number) => void = (robot, index) => {
    this.slots[index] = { robot, order: null };
    this.save();
  };

  addSlot: (robot: Robot) => void = (robot) => {
    this.slots.push({ robot, order: null });
    this.save();
  };

  deleteSlot: (index?: number) => void = (index) => {
    const targetSlot = index ?? this.slots.length - 1;
    this.slots.splice(targetSlot, 1);
    this.save();
  };

  fetchRobot = ({
    index,
    url,
    action = 'login',
    newKeys = null,
    newToken = null,
    refCode = null,
    setBadRequest = () => {},
    setCurrentOrder = () => {},
  }: fetchRobotProps) => {
    const targetSlot = index ?? this.slots.length - 1;
    const robot = this.slots[targetSlot].robot;
    this.slots[targetSlot].robot = { ...robot, loading: true, avatarLoaded: false };
    this.save();
    setBadRequest('');

    let requestBody = {};
    if (action == 'login') {
      requestBody.token_sha256 = sha256(newToken ?? robot.token);
    } else if (action == 'generate' && newToken != null) {
      const strength = tokenStrength(newToken);
      requestBody.token_sha256 = sha256(newToken);
      requestBody.unique_values = strength.uniqueValues;
      requestBody.counts = strength.counts;
      requestBody.length = newToken.length;
      requestBody.ref_code = refCode;
      requestBody.public_key = newKeys.pubKey ?? robot.pubKey;
      requestBody.encrypted_private_key = newKeys.encPrivKey ?? robot.encPrivKey;
    }

    apiClient.post(url, '/api/user/', requestBody).then((data: any) => {
      setCurrentOrder(
        data.active_order_id
          ? data.active_order_id
          : data.last_order_id
          ? data.last_order_id
          : null,
      );
      if (data.bad_request) {
        // setBadRequest(data.bad_request);
        this.slots[targetSlot].robot = {
          ...robot,
          loading: false,
          nickname: data.nickname ?? robot.nickname,
          activeOrderId: data.active_order_id ?? null,
          referralCode: data.referral_code ?? robot.referralCode,
          earnedRewards: data.earned_rewards ?? robot.earnedRewards,
          lastOrderId: data.last_order_id ?? robot.lastOrderId,
          stealthInvoices: data.wants_stealth ?? robot.stealthInvoices,
          tgEnabled: data.tg_enabled,
          tgBotName: data.tg_bot_name,
          tgToken: data.tg_token,
          found: false,
        };
      } else {
        this.slots[targetSlot].robot = {
          ...robot,
          nickname: data.nickname,
          token: newToken ?? robot.token,
          loading: false,
          activeOrderId: data.active_order_id ?? null,
          lastOrderId: data.last_order_id ?? null,
          referralCode: data.referral_code,
          earnedRewards: data.earned_rewards ?? 0,
          stealthInvoices: data.wants_stealth,
          tgEnabled: data.tg_enabled,
          tgBotName: data.tg_bot_name,
          tgToken: data.tg_token,
          found: data?.found,
          bitsEntropy: data.token_bits_entropy,
          shannonEntropy: data.token_shannon_entropy,
          pubKey: data.public_key,
          encPrivKey: data.encrypted_private_key,
          copiedToken: data.found ? true : robot.copiedToken,
        };
      }
      console.log('fetched Robot:', this.slots[targetSlot].robot);
      this.save();
    });
  };
}

export default Garage;
