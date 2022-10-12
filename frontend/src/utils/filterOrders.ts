import Order from '../models/Order.model';

interface BaseFilter {
  currency: number;
  type: number;
}

interface AmountFilter {
  amount: string;
  minAmount: string;
  maxAmount: string;
  threshold: number;
}

interface FilterOrders {
  order: Order;
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
  if (filter.amount != '') {
    if (order.amount === '' || order.amount === null) {
      return (
        order.max_amount < filter.amount * (1 + filter.threshold) &&
        order.min_amount > filter.amount * (1 - filter.threshold)
      );
    } else {
      return (
        order.amount < filter.amount * (1 + filter.threshold) &&
        order.amount > filter.amount * (1 - filter.threshold)
      );
    }
  } else {
    if (order.amount === '' || order.amount === null) {
      return (
        order.max_amount < filter.maxAmount * (1 + filter.threshold) &&
        order.min_amount > filter.minAmount * (1 - filter.threshold)
      );
    } else {
      return (
        order.amount < filter.maxAmount * (1 + filter.threshold) &&
        order.amount > filter.minAmount * (1 - filter.threshold)
      );
    }
  }
};

const filterOrders = function ({
  order,
  baseFilter,
  paymentMethods = [],
  amountFilter = null,
}: FilterOrders) {
  const typeChecks = order.type == baseFilter.type || baseFilter.type == null;
  const currencyChecks = order.currency == baseFilter.currency || baseFilter.currency == 0;
  const paymentMethodChecks =
    paymentMethods.length > 0 ? filterByPayment(order, paymentMethods) : true;
  const amountChecks = (amountFilter != null) ? filterByAmount(order, amountFilter) : true;

  return typeChecks && currencyChecks && paymentMethodChecks && amountChecks;
};

export default filterOrders;
