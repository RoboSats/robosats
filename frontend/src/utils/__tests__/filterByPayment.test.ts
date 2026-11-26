import { type PublicOrder } from '../../models';
import { filterByPayment } from '../filterOrders';

const order = (paymentMethod: string): PublicOrder =>
  ({ payment_method: paymentMethod }) as PublicOrder;

describe('filterByPayment', () => {
  it('matches every order when no method is selected', () => {
    expect(filterByPayment(order('Revolut'), [])).toBe(true);
  });

  it('matches the country versions of a method without a country', () => {
    expect(filterByPayment(order('Amazon DE GiftCard'), ['Amazon GiftCard'])).toBe(true);
    expect(filterByPayment(order('Amazon USA GiftCard Revolut'), ['Amazon GiftCard'])).toBe(true);
    expect(filterByPayment(order('Amazon GiftCard'), ['Amazon GiftCard'])).toBe(true);
  });

  it('keeps a country version specific', () => {
    expect(filterByPayment(order('Amazon DE GiftCard'), ['Amazon FR GiftCard'])).toBe(false);
    expect(filterByPayment(order('Amazon DE GiftCard'), ['Amazon DE GiftCard'])).toBe(true);
  });

  it('matches other methods as before', () => {
    expect(filterByPayment(order('Revolut Wise'), ['Wise'])).toBe(true);
    expect(filterByPayment(order('Revolut'), ['Wise'])).toBe(false);
    expect(filterByPayment(order('Instant SEPA'), ['SEPA'])).toBe(true);
  });
});
