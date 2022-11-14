import React from 'react';
import { useTranslation } from 'react-i18next';
import { List, ListItem, Divider, Grid, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';

import { PlayCircle } from '@mui/icons-material';

interface PayoutWaitPrompProps {
  pauseLoading: boolean;
  onClickResumeOrder: () => void;
}

export const PayoutWaitPrompt = ({
  pauseLoading,
  onClickResumeOrder,
}: PayoutWaitPrompProps): JSX.Element => {
  const { t } = useTranslation();

  return (
    <List dense={true}>
      <Divider />
    </List>
  );
};

export default PayoutWaitPrompt;
