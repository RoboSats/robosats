import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Key, Add } from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useNavigate } from 'react-router-dom';
import { UseAppStoreType, AppContext } from '../../contexts/AppContext';
import { UseGarageStoreType, GarageContext } from '../../contexts/GarageContext';

interface Props {
  open: boolean;
  onClose: () => void;
  onClickGenerateRobot?: () => Promise<void>;
}

const NoRobotDialog = ({
  open,
  onClose,
  onClickGenerateRobot = async () => {},
}: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { navigateToPage, slotUpdatedAt } = useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (loading && garage.getSlot() !== null) {
      setLoading(false);
      onClose();
    }
  }, [slotUpdatedAt]);

  const handleGenerate = (): void => {
    setLoading(true);
    onClickGenerateRobot().catch((e) => {
      console.log(e);
      setLoading(false);
    });
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose}>
      <DialogTitle>{t('You do not have a Garage Key')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t('Generate a Garage Key to get your first robot identity and start trading.')}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          disabled={loading}
          onClick={() => {
            navigateToPage('garage', navigate);
          }}
        >
          <Key /> <div style={{ width: '0.5em' }} />
          {t('I have a Garage Key')}
        </Button>
        <LoadingButton loading={loading} onClick={handleGenerate}>
          <Add /> <div style={{ width: '0.5em' }} />
          {t('Generate Garage Key')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default NoRobotDialog;
