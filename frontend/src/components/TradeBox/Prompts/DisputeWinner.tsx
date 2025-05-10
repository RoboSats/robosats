import React from 'react';
import { useTranslation } from 'react-i18next';
import { List, ListItem, Divider, Typography } from '@mui/material';

export const DisputeWinnerPrompt = (): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <List dense={true}>
      <Divider />
      <ListItem>
        <Typography variant='body2'>
          {t(
            'You can claim the dispute resolution amount (escrow and fidelity bond) from your profile rewards. If there is anything the staff can help with, do not hesitate to contact to robosats@protonmail.com (or via your provided burner contact method).',
          )}
        </Typography>
      </ListItem>
    </List>
  );
};

export default DisputeWinnerPrompt;
