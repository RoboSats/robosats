import Order from '../Order.model';

const routingFailed = { status: 15, retries: 0, invoice_expired: true, failure_reason: 'No route' };

describe('Order.update — payout failure fields', () => {
  it('keeps invoice_expired and failure_reason sent by the coordinator', () => {
    const order = new Order({ id: 93, shortAlias: 'test' });
    order.update(routingFailed);
    expect(order.invoice_expired).toBe(true);
    expect(order.failure_reason).toBe('No route');
  });

  it('clears them when a later order payload no longer includes them', () => {
    const order = new Order({ id: 93, shortAlias: 'test' });
    order.update(routingFailed);
    order.update({ status: 13 });
    expect(order.invoice_expired).toBe(false);
    expect(order.failure_reason).toBe('');

    order.update({ status: 15, retries: 1, failure_reason: 'Timeout' });
    expect(order.invoice_expired).toBe(false);
    expect(order.retries).toBe(1);
    expect(order.failure_reason).toBe('Timeout');
  });

  it('leaves them alone for responses without a status, such as action errors', () => {
    const order = new Order({ id: 93, shortAlias: 'test' });
    order.update(routingFailed);
    order.update({ bad_invoice: 'Invalid invoice' });
    expect(order.invoice_expired).toBe(true);
    expect(order.failure_reason).toBe('No route');
    expect(order.bad_invoice).toBe('Invalid invoice');
  });

  it('keeps them when updated from an Order instance', () => {
    const order = new Order({ id: 93, shortAlias: 'test' });
    order.update(routingFailed);
    order.update(order);
    expect(order.invoice_expired).toBe(true);

    const copy = new Order({ id: 93, shortAlias: 'test' });
    copy.update(order);
    expect(copy.invoice_expired).toBe(true);
    expect(copy.failure_reason).toBe('No route');
  });
});
