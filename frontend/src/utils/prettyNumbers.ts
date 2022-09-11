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
  has_range: boolean,
  min_amount: number,
  max_amount: number,
) => string = (amount, has_range, min_amount, max_amount) => {
  if (has_range) {
    return (
      pn(parseFloat(Number(min_amount).toPrecision(4))) +
      '-' +
      pn(parseFloat(Number(max_amount).toPrecision(4)))
    );
  }
  return pn(parseFloat(Number(amount).toPrecision(4))) || '';
};

export default pn;
