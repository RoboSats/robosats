import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
} from '@mui/material';

interface Props {
  open: boolean;
  onClose: () => void;
  onClickGenerateRobot?: () => void;
}

const NoRobotDialog = ({
  open,
  onClose,
  onClickGenerateRobot = () => null,
}: Props): JSX.Element => {
  const { t } = useTranslation();

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
            onClickGenerateRobot();
            onClose();
          }}
        >
          {t('Generate Robot')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NoRobotDialog;
