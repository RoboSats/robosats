import React, { useContext } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { UseAppStoreType, AppContext } from '../../contexts/AppContext';

interface Props {
  open: boolean;
  onClose: () => void;
  onClickGenerateRobot?: () => void;
}

const NoRobotDialog = ({
  open,
  onClose,
  onClickGenerateRobot = () => null,
}: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { navigateToPage } = useContext<UseAppStoreType>(AppContext);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('You do not have a robot avatar')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t('Generate a robot avatar first. Then create your own order.')}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            navigateToPage('garage', navigate);
          }}
        >
          <Key /> <div style={{ width: '0.5em' }} />
          {t('Recovery')}
        </Button>
        <Button
          onClick={() => {
            onClickGenerateRobot();
            onClose();
          }}
        >
          <Add /> <div style={{ width: '0.5em' }} />
          {t('Add Robot')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NoRobotDialog;
