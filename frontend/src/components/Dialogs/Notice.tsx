import React from 'react';
import { useTranslation } from 'react-i18next';

import { Dialog, Alert, AlertTitle } from '@mui/material';

interface Props {
  open: boolean;
  severity: 'warning' | 'success' | 'error' | 'info' | 'none';
  message: string;
  onClose: () => void;
}

const NoticeDialog = ({ open = false, severity, message, onClose }: Props): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose}>
      <Alert severity={severity !== 'none' ? severity : 'info'}>
        <AlertTitle>{t('Coordinator Notice')}</AlertTitle>
        <div dangerouslySetInnerHTML={{ __html: message }} />
      </Alert>
    </Dialog>
  );
};

export default NoticeDialog;
