import { type Event } from 'nostr-tools';
import { schnorr } from '@noble/curves/secp256k1';
import { type PublicOrder } from '../models';
import { fromUnixTime } from 'date-fns';
import Geohash from 'latlon-geohash';
import thirdParties from '../../static/thirdparties.json';
import currencyDict from '../../static/assets/currencies.json';
import defaultFederation from '../../static/federation.json';

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
  const coordinator = [...Object.values(defaultFederation), ...Object.values(thirdParties)].find(
    (coord) => coord.nostrHexPubkey === event.pubkey,
  );
  if (!coordinator || statusTag[1] !== 'pending') return { dTag: dTag[1], publicOrder: null };

  publicOrder.coordinatorShortAlias = coordinator?.shortAlias;
  publicOrder.federated = coordinator?.federated ?? false;

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

export const verifyCoordinatorToken: (event: Event) => boolean = (event) => {
  const d = event.tags.find((t) => t[0] === 'd')?.[1];
  const orderId = d?.split(':')?.[1];
  const signature = event.tags.find((t) => t[0] === 'sig')?.[1];
  const hash = `${event.pubkey}${orderId ?? ''}`;
  const coordinatorPubKey = event.tags.find((t) => t[0] === 'p')?.[1];
  if (signature && coordinatorPubKey) {
    return schnorr.verify(signature, hash, coordinatorPubKey);
  }
  return false;
};

export default eventToPublicOrder;
