import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { GarageContext, type UseGarageStoreType } from '../contexts/GarageContext';

interface UseLegacyModeReturn {
  isLegacyMode: boolean;
  legacyDisabledTooltip: string;
}

const useLegacyMode = (): UseLegacyModeReturn => {
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { t } = useTranslation();

  const isLegacyMode = garage.getMode() === 'legacy';
  const legacyDisabledTooltip = t('Switch to Garage Key mode to use this feature');

  return { isLegacyMode, legacyDisabledTooltip };
};

export default useLegacyMode;
