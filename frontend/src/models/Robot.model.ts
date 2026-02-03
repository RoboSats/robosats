import { apiClient, type Auth } from '../services/api';
import type Federation from './Federation.model';

class Robot {
  constructor(attributes?: object) {
    Object.assign(this, attributes);
  }

  public token?: string;
  public pubKey?: string;
  public encPrivKey?: string;
  public nostrPubKey?: string;
  public stealthInvoices: boolean = true;
  public activeOrderId?: number;
  public lastOrderId?: number;
  public earnedRewards: number = 0;
  public tgEnabled: boolean = false;
  public tgBotName: string = 'unknown';
  public tgToken: string = 'unknown';
  public loading: boolean = true;
  public found: boolean = false;
  public last_login: string = '';
  public shortAlias: string = '';
  public bitsEntropy?: number;
  public shannonEntropy?: number;
  public tokenSHA256: string = '';
  public hasEnoughEntropy: boolean = false;

  update = (attributes: object): void => {
    Object.assign(this, attributes);
  };

  getAuthHeaders = (): Auth | null => {
    const tokenSHA256 = this.tokenSHA256 ?? '';
    const encPrivKey = this.encPrivKey ?? '';
    const pubKey = this.pubKey ?? '';
    const nostrPubkey = this.nostrPubKey ?? '';

    return {
      tokenSHA256,
      nostrPubkey,
      keys: {
        pubKey: pubKey.split('\n').join('\\'),
        encPrivKey: encPrivKey.split('\n').join('\\'),
      },
    };
  };

  fetch = async (federation: Federation): Promise<Robot | null> => {
    const authHeaders = this.getAuthHeaders();
    const coordinator = federation.getCoordinator(this.shortAlias);

    if (!authHeaders || !coordinator || !this.hasEnoughEntropy) return null;

    this.loading = true;

    await apiClient
      .get(coordinator.url, '/api/robot/', authHeaders, true)
      .then((data: object) => {
        if (data?.bad_request) {
          console.error(data?.bad_request);
          return;
        }

        this.update({
          nickname: data.nickname,
          activeOrderId: data.active_order_id ?? null,
          lastOrderId: data.last_order_id ?? null,
          earnedRewards: data.earned_rewards ?? 0,
          stealthInvoices: data.wants_stealth,
          tgEnabled: data.tg_enabled,
          tgBotName: data.tg_bot_name,
          tgToken: data.tg_token,
          found: data?.found,
          last_login: data.last_login,
          pubKey: data.public_key,
          encPrivKey: data.encrypted_private_key,
          nostrPubKey: data.nostr_pubkey,
        });
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => (this.loading = false));

    return this;
  };

  fetchReward = async (
    federation: Federation,
    signedInvoice: string,
    routingBudgetPPM?: number,
  ): Promise<null | {
    bad_invoice?: string;
    successful_withdrawal?: boolean;
  }> => {
    if (!federation) return null;

    const coordinator = federation.getCoordinator(this.shortAlias);
    const body: { invoice: string; routing_budget_ppm?: number } = {
      invoice: signedInvoice,
    };
    if (routingBudgetPPM !== undefined) {
      body.routing_budget_ppm = routingBudgetPPM;
    }
    const data = await apiClient
      .post(coordinator.url, '/api/reward/', body, { tokenSHA256: this.tokenSHA256 })
      .catch((e) => {
        console.log(e);
      });
    this.earnedRewards = data?.successful_withdrawal === true ? 0 : this.earnedRewards;

    return data ?? {};
  };

  fetchStealth = async (federation: Federation, wantsStealth: boolean): Promise<void> => {
    if (!federation) return;

    const coordinator = federation.getCoordinator(this.shortAlias);
    await apiClient
      .post(coordinator.url, '/api/stealth/', { wantsStealth }, { tokenSHA256: this.tokenSHA256 })
      .catch((e) => {
        console.log(e);
      });

    this.stealthInvoices = wantsStealth;
  };

  loadReviewToken = (
    federation: Federation,
    onDataLoad: (token: string) => void = () => {},
  ): void => {
    if (!federation) return;

    const coordinator = federation.getCoordinator(this.shortAlias);
    const body = {
      pubkey: this.nostrPubKey,
    };

    apiClient
      .post(coordinator.url, '/api/review/', body, {
        tokenSHA256: this.tokenSHA256,
      })
      .then((data) => {
        if (data) {
          onDataLoad(data.token);
        }
      })
      .catch((e) => {
        console.log(e);
      });
  };
}

export default Robot;
