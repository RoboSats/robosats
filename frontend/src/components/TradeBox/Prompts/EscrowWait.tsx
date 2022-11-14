import React from 'react';
import { useTranslation } from 'react-i18next';
import { List, ListItem, Divider, Grid, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';

import { PlayCircle } from '@mui/icons-material';

interface EscrowWaitPrompProps {
  pauseLoading: boolean;
  onClickResumeOrder: () => void;
}

export const EscrowWaitPrompt = ({
  pauseLoading,
  onClickResumeOrder,
}: EscrowWaitPrompProps): JSX.Element => {
  const { t } = useTranslation();

  return (
    <List dense={true}>
      <Divider />
    </List>
  );
};

export default EscrowWaitPrompt;
