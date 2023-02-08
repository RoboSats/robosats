import { PublicOrder, Favorites } from '../models';

interface AmountFilter {
  amount: string;
  minAmount: string;
  maxAmount: string;
  threshold: number;
}

interface FilterOrders {
  orders: PublicOrder[];
  baseFilter: Favorites;
  amountFilter?: AmountFilter | null;
  paymentMethods?: string[];
}

const filterByPayment = function (order: PublicOrder, paymentMethods: any[]) {
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

const filterByAmount = function (order: PublicOrder, filter: AmountFilter) {
  const filterMaxAmount =
    Number(filter.amount != '' ? filter.amount : filter.maxAmount) * (1 + filter.threshold);
  const filterMinAmount =
    Number(filter.amount != '' ? filter.amount : filter.minAmount) * (1 - filter.threshold);

  const orderMinAmount = Number(
    order.amount === '' || order.amount === null ? order.min_amount : order.amount,
  );
  const orderMaxAmount = Number(
    order.amount === '' || order.amount === null ? order.max_amount : order.amount,
  );

  return Math.max(filterMinAmount, orderMinAmount) <= Math.min(filterMaxAmount, orderMaxAmount);
};

const filterOrders = function ({
  orders,
  baseFilter,
  paymentMethods = [],
  amountFilter = null,
}: FilterOrders) {
  const filteredOrders = orders.filter((order) => {
    const typeChecks = order.type == baseFilter.type || baseFilter.type == null;
    const modeChecks = baseFilter.mode === 'fiat' ? !(order.currency === 1000) : true;
    const currencyChecks = order.currency == baseFilter.currency || baseFilter.currency == 0;
    const paymentMethodChecks =
      paymentMethods.length > 0 ? filterByPayment(order, paymentMethods) : true;
    const amountChecks = amountFilter != null ? filterByAmount(order, amountFilter) : true;
    return typeChecks && modeChecks && currencyChecks && paymentMethodChecks && amountChecks;
  });
  return filteredOrders;
};

export default filterOrders;
