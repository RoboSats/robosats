import { pn } from './prettyNumbers';

interface computeSatsProps {
  amount: number;
  premium: number;
  fee: number;
  routingBudget?: number;
  rate?: number;
}
const computeSats = ({
  amount,
  premium,
  fee,
  routingBudget = 0,
  rate = 1,
}: computeSatsProps): string | undefined => {
  let rateWithPremium = rate + premium / 100;
  let sats = (amount / rateWithPremium) * 100000000;
  sats = sats * (1 + fee) * (1 - routingBudget);
  return pn(Math.round(sats));
};

export default computeSats;
