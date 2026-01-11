export interface BondCalculatorProps {
  amount: number | null;
  minAmount: number | null;
  maxAmount: number | null;
  isRange: boolean;
  bondSize: number;
  mode: 'fiat' | 'swap';
  price: number;
  premium?: number;
}

export const calculateBondAmount = ({
  amount,
  maxAmount,
  isRange,
  bondSize,
  mode,
  price,
  premium = 0,
}: BondCalculatorProps): number | null => {
  if (mode === 'fiat' && !price) return null;

  const amountToCalc = isRange ? maxAmount : amount;

  if (!amountToCalc) return null;

  let tradeAmountSats = 0;

  if (mode === 'fiat') {
    tradeAmountSats = (amountToCalc / price) * 100_000_000;
  } else {
    const premiumFactor = 1 + premium / 100;
    if (premiumFactor <= 0) {
      tradeAmountSats = 0;
    } else {
      tradeAmountSats = (amountToCalc * 100_000_000) / premiumFactor;
    }
  }

  return Math.floor(tradeAmountSats * (bondSize / 100));
};
