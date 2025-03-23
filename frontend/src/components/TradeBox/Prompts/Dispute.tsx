import React from 'react';
import { useTranslation } from 'react-i18next';
import { Grid, Typography } from '@mui/material';
import { type DisputeForm, DisputeStatementForm } from '../Forms';

interface DisputePromptProps {
  loading: boolean;
  dispute: DisputeForm;
  shortAlias: string;
  setDispute: (state: DisputeForm) => void;
  onClickSubmit: () => void;
}

export const DisputePrompt = ({
  loading,
  dispute,
  shortAlias,
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
            'Please, submit your statement. Be clear and specific about what happened and provide the necessary evidence. You MUST provide a contact method: burner email, SimpleX incognito link or telegram (make sure to create a searchable username) to follow up with the dispute solver (your trade host/coordinator). Disputes are solved at the discretion of real robots (aka humans), so be as helpful as possible to ensure a fair outcome.',
          )}
        </Typography>
      </Grid>
      <Grid item>
        <DisputeStatementForm
          loading={loading}
          onClickSubmit={onClickSubmit}
          shortAlias={shortAlias}
          dispute={dispute}
          setDispute={setDispute}
        />
      </Grid>
    </Grid>
  );
};

export default DisputePrompt;
