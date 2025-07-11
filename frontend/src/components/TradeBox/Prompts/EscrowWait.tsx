import React from 'react';
import { useTranslation } from 'react-i18next';
import { List, ListItem, Divider, Typography } from '@mui/material';

export const EscrowWaitPrompt = (): React.JSX.Element => {
  const { t } = useTranslation();
  return (
    <List dense={true}>
      <Divider />
      <ListItem>
        <Typography variant='body2' align='left'>
          {t('We are waiting for the seller to lock the trade amount.')}
        </Typography>
      </ListItem>
      <ListItem>
        <Typography variant='body2' align='left'>
          {t(
            'Just hang on for a moment. If the seller does not deposit, you will get your bond back automatically. In addition, you will receive a compensation (check the rewards in your profile).',
          )}
        </Typography>
      </ListItem>
    </List>
  );
};

export default EscrowWaitPrompt;
