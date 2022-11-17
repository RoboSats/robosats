import React from 'react';
import { useTranslation } from 'react-i18next';
import { Grid, TextField, Checkbox, Tooltip } from '@mui/material';
import { Order } from '../../../models';
import { LoadingButton } from '@mui/lab';
import { EncryptedChatMessage } from '../EncryptedChat';

export interface DisputeForm {
  statement: string;
  attachLogs: boolean;
  badStatement: string;
}

export const defaultDispute: DisputeForm = {
  statement: '',
  attachLogs: true,
  badStatement: '',
};

interface DisputeStatementFormProps {
  loading: boolean;
  dispute: DisputeForm;
  setDispute: (state: DisputeForm) => void;
  onClickSubmit: () => void;
}

export const DisputeStatementForm = ({
  loading,
  onClickSubmit,
  dispute,
  setDispute,
}: DisputeStatementFormProps): JSX.Element => {
  const { t } = useTranslation();
  return (
    <Grid container direction='column' justifyContent='flex-start' alignItems='center' spacing={1}>
      <Grid item xs={12}>
        <TextField
          error={dispute.badStatement != ''}
          helperText={dispute.badStatement}
          label={t('Submit dispute statement')}
          required
          inputProps={{
            style: { textAlign: 'center' },
          }}
          multiline
          rows={4}
          onChange={(e) => setDispute({ ...dispute, statement: e.target.value })}
        />
      </Grid>
      <Grid item xs={12}>
        <Tooltip
          enterTouchDelay={0}
          placement='top'
          title={t(
            'Attaching chat logs helps the dispute resolution process and adds transparency. However, it might compromise your privacy.',
          )}
        >
          <Checkbox
            checked={dispute.attachLogs}
            onChange={() => setDispute({ ...dispute, attachLogs: !dispute.attachLogs })}
            title={t('Attach chat logs')}
          />
        </Tooltip>
      </Grid>
      <Grid item xs={12}>
        <LoadingButton
          onClick={onClickSubmit}
          variant='contained'
          color='primary'
          loading={loading}
        >
          {t('Submit')}
        </LoadingButton>
      </Grid>
    </Grid>
  );
};

export default DisputeStatementForm;
