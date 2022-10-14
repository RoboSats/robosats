import Order from '../models/Order.model';

interface BaseFilter {
  currency: number;
  type: number | null;
}

interface AmountFilter {
  amount: string;
  minAmount: string;
  maxAmount: string;
  threshold: number;
}

interface FilterOrders {
  orders: Order[];
  baseFilter: BaseFilter;
  amountFilter?: AmountFilter | null;
  paymentMethods?: string[];
}

const filterByPayment = function (order: Order, paymentMethods: string[]) {
  if (paymentMethods.length === 0) {
    return true;
  } else {
    let result = false;
    paymentMethods.forEach((method) => {
      result = result || order.payment_method.includes(method.name);
    });
    return result;
  }
};

const filterByAmount = function (order: Order, filter: AmountFilter) {
  const filterMaxAmount = filter.amount != '' ? filter.amount : filter.maxAmount;
  const filterMinAmount = filter.amount != '' ? filter.amount : filter.minAmount;
  const orderMinAmount =
    order.amount === '' || order.amount === null ? order.min_amount : order.amount;
  const orderMaxAmount =
    order.amount === '' || order.amount === null ? order.max_amount : order.amount;

  return (
    orderMaxAmount < filterMaxAmount * (1 + filter.threshold) &&
    orderMinAmount > filterMinAmount * (1 - filter.threshold)
  );
};

const filterOrders = function ({
  orders,
  baseFilter,
  paymentMethods = [],
  amountFilter = null,
}: FilterOrders) {
  const filteredOrders = orders.filter((order) => {
    const typeChecks = order.type == baseFilter.type || baseFilter.type == null;
    const currencyChecks = order.currency == baseFilter.currency || baseFilter.currency == 0;
    const paymentMethodChecks =
      paymentMethods.length > 0 ? filterByPayment(order, paymentMethods) : true;
    const amountChecks = amountFilter != null ? filterByAmount(order, amountFilter) : true;

    return typeChecks && currencyChecks && paymentMethodChecks && amountChecks;
  });

  return filteredOrders;
};

export default filterOrders;
