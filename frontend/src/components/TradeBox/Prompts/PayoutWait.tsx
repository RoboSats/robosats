import React from 'react';
import { useTranslation } from 'react-i18next';
import { List, ListItem, Divider, Typography } from '@mui/material';

export const PayoutWaitPrompt = (): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <List dense={true}>
      <Divider />
      <ListItem>
        <Typography variant='body2' align='left'>
          {t(
            'We are waiting for the buyer to post a lightning invoice. Once he does, you will be able to directly communicate the payment details.',
          )}
        </Typography>
      </ListItem>

      <ListItem>
        <Typography variant='body2' align='left'>
          {t(
            'Just hang on for a moment. If the buyer does not cooperate, you will get back the trade collateral and your bond automatically. In addition, you will receive a compensation (check the rewards in your profile).',
          )}
        </Typography>
      </ListItem>
    </List>
  );
};

export default PayoutWaitPrompt;
