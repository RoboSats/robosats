import React from 'react';
import { useTranslation } from 'react-i18next';
import { Grid, Typography } from '@mui/material';
import { DisputeForm, DisputeStatementForm } from '../Forms';

interface DisputePromptProps {
  loading: boolean;
  dispute: DisputeForm;
  setDispute: (state: DisputeForm) => void;
  onClickSubmit: () => void;
}

export const DisputePrompt = ({
  loading,
  dispute,
  onClickSubmit,
  setDispute,
}: DisputePromptProps): JSX.Element => {
  const { t } = useTranslation();
  return (
    <Grid
      container
      direction='column'
      justifyContent='flex-start'
      alignItems='center'
      spacing={0}
      padding={1}
    >
      <Grid item>
        <Typography variant='body2'>
          {t(
            'Please, submit your statement. Be clear and specific about what happened and provide the necessary evidence. You MUST provide a contact method: burner email, XMPP or telegram username to follow up with the staff. Disputes are solved at the discretion of real robots (aka humans), so be as helpful as possible to ensure a fair outcome. Max 5000 chars.',
          )}
        </Typography>
      </Grid>
      <Grid item>
        <DisputeStatementForm
          loading={loading}
          onClickSubmit={onClickSubmit}
          dispute={dispute}
          setDispute={setDispute}
        />
      </Grid>
    </Grid>
  );
};

export default DisputePrompt;
