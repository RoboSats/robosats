import { Event } from 'nostr-tools';
import { PublicOrder } from '../models';
import { fromUnixTime } from 'date-fns';
import Geohash from 'latlon-geohash';
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
    maker_nick: '',
    maker_hash_id: '',
    satoshis_now: null,
    price: null,
  };

  const statusTag = event.tags.find((t) => t[0] === 's') ?? [];
  const dTag = event.tags.find((t) => t[0] === 'd') ?? [];

  if (statusTag[1] !== 'pending') return { dTag: dTag[1], publicOrder: null };

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
      case 'g':
        const { lat, lon } = Geohash.decode(tag[1]);
        publicOrder.latitude = lat;
        publicOrder.longitude = lon;
        break;
      case 'f':
        const currencyNumber = Object.entries(currencyDict).find(
          ([_key, value]) => value === tag[1],
        );
        publicOrder.currency = currencyNumber?.[0] ? parseInt(currencyNumber[0], 10) : null;
        break;
      case 'source':
        const orderUrl = tag[1].split('/');
        publicOrder.id = parseInt(orderUrl[orderUrl.length - 1] ?? '0');
        const coordinatorIdentifier = orderUrl[orderUrl.length - 2] ?? '';
        publicOrder.coordinatorShortAlias = Object.entries(defaultFederation).find(
          ([key, value]) => value.identifier === coordinatorIdentifier,
        )?.[0];
        break;
      default:
        break;
    }
  });

  // price = limitsList[index].price * (1 + premium / 100);

  return { dTag: dTag[1], publicOrder };
};

export default eventToPublicOrder;
