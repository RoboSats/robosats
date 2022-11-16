import React from 'react';
import { useTranslation } from 'react-i18next';
import { List, ListItem, Divider, Typography } from '@mui/material';

export const DisputeWaitPrompt = (): JSX.Element => {
  const { t } = useTranslation();

  return (
    <List dense={true}>
      <Divider />
      <ListItem>
        <Typography variant='body2'>
          {t(
            'We are waiting for your trade counterpart statement. If you are hesitant about the state of the dispute or want to add more information, contact robosats@protonmail.com.',
          )}
        </Typography>
      </ListItem>
      <ListItem>
        <Typography variant='body2'>
          {t(
            'Please, save the information needed to identify your order and your payments: order ID; payment hashes of the bonds or escrow (check on your lightning wallet); exact amount of satoshis; and robot nickname. You will have to identify yourself as the user involved in this trade via email (or other contact methods).',
          )}
        </Typography>
      </ListItem>
    </List>
  );
};

export default DisputeWaitPrompt;
