import React from 'react';
import { useTranslation } from 'react-i18next';
import { List, ListItem, Divider, Grid, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';

import { PlayCircle } from '@mui/icons-material';

interface PausedPrompProps {
  pauseLoading: boolean;
  onClickResumeOrder: () => void;
}

export const PausedPrompt = ({
  pauseLoading,
  onClickResumeOrder,
}: PausedPrompProps): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <List dense={true}>
      <Divider />
      <ListItem>
        <Typography variant='body2' align='left'>
          {t(
            'Your public order has been paused. At the moment it cannot be seen or taken by other robots. You can choose to unpause it at any time.',
          )}
        </Typography>
      </ListItem>

      <Grid item xs={12} style={{ display: 'flex', justifyContent: 'center' }}>
        <LoadingButton loading={pauseLoading} color='primary' onClick={onClickResumeOrder}>
          <PlayCircle sx={{ width: '1.6em', height: '1.6em' }} />
          {t('Unpause Order')}
        </LoadingButton>
      </Grid>
    </List>
  );
};

export default PausedPrompt;
