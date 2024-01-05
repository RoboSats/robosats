export const pn = (value?: number | null): string | undefined => {
  if (value === null || value === undefined) {
    return;
  }

  const parts = value.toString().split('.');

  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return parts.join('.');
};

export const amountToString: (
  amount: string,
  hasRange: boolean,
  minAmount: number,
  maxAmount: number,
  precision?: number,
) => string = (amount, hasRange, minAmount, maxAmount, precision = 4) => {
  if (hasRange) {
    const rangeStart = pn(parseFloat(Number(minAmount).toPrecision(precision)));
    const rangeEnd = pn(parseFloat(Number(maxAmount).toPrecision(precision)));
    if (rangeStart !== undefined && rangeEnd !== undefined) {
      return `${rangeStart}-${rangeEnd}`;
    }
  }
  return pn(parseFloat(Number(amount).toPrecision(precision))) ?? '';
};

export default pn;
