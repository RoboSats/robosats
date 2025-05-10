import React from 'react';
import { useTranslation } from 'react-i18next';
import { List, ListItem, Divider, Typography } from '@mui/material';

export const DisputeWaitResolutionPrompt = (): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <List dense={true}>
      <Divider />
      <ListItem>
        <Typography variant='body2'>
          {t(
            'Both statements have been received, wait for the staff to resolve the dispute. If you are hesitant about the state of the dispute or want to add more information, contact your order trade coordinator (the host) via one of their contact methods. If you did not provide a contact method, or are unsure whether you wrote it right, write your coordinator immediately.',
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

export default DisputeWaitResolutionPrompt;
