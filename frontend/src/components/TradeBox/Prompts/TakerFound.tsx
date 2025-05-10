import React from 'react';
import { useTranslation } from 'react-i18next';
import { Divider, List, ListItem, Typography } from '@mui/material';

export const TakerFoundPrompt = (): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <List dense={true}>
      <Divider />
      <ListItem>
        <Typography variant='body2'>
          {t(
            'Please wait for the taker to lock a bond. If the taker does not lock a bond in time, the order will be made public again.',
          )}
        </Typography>
      </ListItem>
    </List>
  );
};

export default TakerFoundPrompt;
