import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { List, ListItem, Divider, Typography } from '@mui/material';
import { type Order } from '../../../models';
import {
  FederationContext,
  type UseFederationStoreType,
} from '../../../contexts/FederationContext';

interface DisputeWinnerPromptProps {
  order?: Order | null;
}

export const DisputeWinnerPrompt = ({ order }: DisputeWinnerPromptProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const coordinator = federation.getCoordinator(order?.shortAlias ?? '');
  const email = coordinator?.contact?.email || 'robosats@protonmail.com';

  return (
    <List dense={true}>
      <Divider />
      <ListItem>
        <Typography variant='body2'>
          {t(
            'You can claim the dispute resolution amount (escrow and fidelity bond) from your profile rewards. If there is anything the staff can help with, do not hesitate to contact to {{email}} (or via your provided burner contact method).',
            { email },
          )}
        </Typography>
      </ListItem>
    </List>
  );
};

export default DisputeWinnerPrompt;
