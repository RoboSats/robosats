import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext, type UseAppStoreType } from '../contexts/AppContext';

interface UseLegacyModeReturn {
  isLegacyMode: boolean;
  legacyDisabledTooltip: string;
}

const useLegacyMode = (): UseLegacyModeReturn => {
  const { settings } = useContext<UseAppStoreType>(AppContext);
  const { t } = useTranslation();

  const isLegacyMode = settings.garageMode === 'legacy';
  const legacyDisabledTooltip = t('Switch to Garage Key mode to use this feature');

  return { isLegacyMode, legacyDisabledTooltip };
};

export default useLegacyMode;
