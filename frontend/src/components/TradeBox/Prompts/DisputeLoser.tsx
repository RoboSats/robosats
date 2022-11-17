import React from 'react';
import { useTranslation } from 'react-i18next';
import { List, ListItem, Divider, Typography } from '@mui/material';

export const DisputeLoserPrompt = (): JSX.Element => {
  const { t } = useTranslation();

  return (
    <List dense={true}>
      <Divider />
      <ListItem>
        <Typography variant='body2'>
          {t(
            'Unfortunately you have lost the dispute. If you think this is a mistake you can ask to re-open the case via email to robosats@protonmail.com. However, chances of it being investigated again are low.',
          )}
        </Typography>
      </ListItem>
    </List>
  );
};

export default DisputeLoserPrompt;
