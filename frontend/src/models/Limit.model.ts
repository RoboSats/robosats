export interface Limit {
  code: string;
  price: number;
  min_amount: number;
  max_amount: number;
  max_bondless_amount: number;
}

export type LimitList = Record<string, Limit>;

export interface Limits {
  list: LimitList | never[];
  loading: boolean;
  loadedCoordinators: number;
  totalCoordinators: number;
}

const compareUpdateLimit = (baseL: Limit, newL: Limit) => {
  if (!baseL) {
    return newL;
  } else {
    const price = (baseL.price + newL.price) / 2;
    const max_amount = Math.max(baseL.max_amount, newL.max_amount);
    const min_amount = Math.min(baseL.min_amount, newL.min_amount);
    const max_bondless_amount = Math.max(baseL.max_bondless_amount, newL.max_bondless_amount);
    return { code: newL.code, price, max_amount, min_amount, max_bondless_amount };
  }
};

export default Limit;
