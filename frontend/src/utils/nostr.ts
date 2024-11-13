import { type Event } from 'nostr-tools';
import { type PublicOrder } from '../models';
import { fromUnixTime } from 'date-fns';
import Geohash from 'latlon-geohash';
import currencyDict from '../../static/assets/currencies.json';
import defaultFederation from '../../static/federation.json';

export const ThirdParties = {
  p2plightning: {
    longAlias: 'LNP2PBot',
    federated: false,
    shortAlias: 'p2plightning',
    nostrHexPubkey: 'fcc2a0bd8f5803f6dd8b201a1ddb67a4b6e268371fe7353d41d2b6684af7a61e',
  },
} as const;

const eventToPublicOrder = (event: Event): { dTag: string; publicOrder: PublicOrder | null } => {
  const publicOrder: PublicOrder = {
    id: 0,
    coordinatorShortAlias: '',
    created_at: new Date(),
    expires_at: new Date(),
    type: 1,
    currency: null,
    amount: '',
    has_range: false,
    min_amount: null,
    max_amount: null,
    payment_method: '',
    is_explicit: false,
    premium: '',
    satoshis: null,
    maker: null,
    escrow_duration: 0,
    bond_size: '',
    latitude: null,
    longitude: null,
    maker_nick: null,
    maker_hash_id: null,
    satoshis_now: null,
    price: null,
  };

  const statusTag = event.tags.find((t) => t[0] === 's') ?? [];
  const dTag = event.tags.find((t) => t[0] === 'd') ?? [];
  const coordinator = [...Object.values(defaultFederation), ...Object.values(ThirdParties)].find(
    (coord) => coord.nostrHexPubkey === event.pubkey,
  );
  if (!coordinator || statusTag[1] !== 'pending') return { dTag: dTag[1], publicOrder: null };

  publicOrder.coordinatorShortAlias = coordinator?.shortAlias;

  event.tags.forEach((tag) => {
    switch (tag[0]) {
      case 'k':
        publicOrder.type = tag[1] === 'sell' ? 1 : 0;
        break;
      case 'expiration':
        publicOrder.expires_at = fromUnixTime(parseInt(tag[1], 10));
        publicOrder.escrow_duration = parseInt(tag[2], 10);
        break;
      case 'fa':
        if (tag[2]) {
          publicOrder.has_range = true;
          publicOrder.min_amount = tag[1] ?? null;
          publicOrder.max_amount = tag[2] ?? null;
        } else {
          publicOrder.amount = tag[1];
        }
        break;
      case 'bond':
        publicOrder.bond_size = tag[1];
        break;
      case 'name':
        publicOrder.maker_nick = tag[1];
        publicOrder.maker_hash_id = tag[2];
        break;
      case 'premium':
        publicOrder.premium = tag[1];
        break;
      case 'pm':
        tag.shift();
        publicOrder.payment_method = tag.join(' ');
        break;
      case 'g': {
        const { lat, lon } = Geohash.decode(tag[1]);
        publicOrder.latitude = lat;
        publicOrder.longitude = lon;
        break;
      }
      case 'f': {
        const currencyNumber = Object.entries(currencyDict).find(
          ([_key, value]) => value === tag[1],
        );
        publicOrder.currency = currencyNumber?.[0] ? parseInt(currencyNumber[0], 10) : null;
        break;
      }
      case 'source': {
        const orderUrl = tag[1].split('/');
        publicOrder.id = parseInt(orderUrl[orderUrl.length - 1] ?? '0');
        publicOrder.link = tag[1];
        break;
      }
      default:
        break;
    }
  });

  if (!publicOrder.currency) return { dTag: dTag[1], publicOrder: null };
  if (!publicOrder.maker_hash_id)
    publicOrder.maker_hash_id = `${publicOrder.id}${coordinator?.shortAlias}`;

  return { dTag: dTag[1], publicOrder };
};

export default eventToPublicOrder;
