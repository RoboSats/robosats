import { useMemo } from 'react';
import { calculateBondAmount } from '../utils/bondCalculator';
import type { Maker, Federation } from '../models';

interface UseBondEstimateProps {
  maker: Maker;
  federation: Federation;
  currentPrice?: number;
  federationUpdatedAt: number;
  amountRangeEnabled: boolean;
}

export const useBondEstimate = ({
  maker,
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
      mode: maker.mode,
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
    maker.mode,
    maker.coordinator,
    federationUpdatedAt,
  ]);
};
