import { useMemo } from 'react';
import { calculateBondAmount } from '../utils/bondCalculator';
import { Maker, Federation, Favorites } from '../models';

interface UseBondEstimateProps {
  maker: Maker;
  fav: Favorites;
  federation: Federation;
  currentPrice?: number;
  federationUpdatedAt: number;
  amountRangeEnabled: boolean;
}

export const useBondEstimate = ({
  maker,
  fav,
  federation,
  currentPrice,
  federationUpdatedAt,
  amountRangeEnabled,
}: UseBondEstimateProps): number | null => {
  const makerHasAmountRange = useMemo(() => {
    return maker.advancedOptions && amountRangeEnabled;
  }, [maker.advancedOptions, amountRangeEnabled]);

  return useMemo(() => {
    const coordinatorInfo = federation.getCoordinator(maker.coordinator)?.info;
    const bondPercentage = maker.bondSize ?? coordinatorInfo?.bond_size ?? 3;

    return calculateBondAmount({
      amount: maker.amount,
      minAmount: maker.minAmount,
      maxAmount: maker.maxAmount,
      isRange: makerHasAmountRange,
      bondSize: bondPercentage,
      mode: fav.mode as 'fiat' | 'swap',
      price: currentPrice ?? 0,
      premium: maker.premium ?? 0,
    });
  }, [
    maker.amount,
    maker.minAmount,
    maker.maxAmount,
    makerHasAmountRange,
    maker.bondSize,
    maker.premium,
    currentPrice,
    fav.mode,
    maker.coordinator,
    federationUpdatedAt,
  ]);
};
