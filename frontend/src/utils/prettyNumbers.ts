export const pn = (value?: number | null): string => {
  if (value === null || value === undefined) {
    return String();
  }

  const parts = value.toString().split('.');

  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return parts.join('.');
};

export const amountToString: (
  amount: string,
  has_range: boolean,
  min_amount: number,
  max_amount: number,
  precision?: number,
) => string = (amount, has_range, min_amount, max_amount, precision = 4) => {
  if (has_range) {
    return (
      pn(parseFloat(Number(min_amount).toPrecision(precision))) +
      '-' +
      pn(parseFloat(Number(max_amount).toPrecision(precision)))
    );
  }
  return pn(parseFloat(Number(amount).toPrecision(precision))) ?? '';
};

export default pn;
