import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
  Link,
} from '@mui/material';

interface Props {
  open: boolean;
  onClose: () => void;
}

const LearnDialog = ({ open, onClose }: Props): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('Learn RoboSats')}</DialogTitle>

      <DialogContent>
        <DialogContentText>
          {t(
            'You are about to visit Learn RoboSats. It hosts tutorials and documentation to help you learn how to use RoboSats and understand how it works.',
          )}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('Back')}</Button>
        <Button
          onClick={onClose}
          autoFocus
          component={Link}
          href='https://learn.robosats.org'
          target='_blank'
        >
          {t("Let's go!")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LearnDialog;
