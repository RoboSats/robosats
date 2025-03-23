import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Grid,
  TextField,
  Checkbox,
  Tooltip,
  FormControlLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  FederationContext,
  type UseFederationStoreType,
} from '../../../contexts/FederationContext';
import type { Contact } from '../../../models';

export interface DisputeForm {
  statement: string;
  contactMethod?: string;
  contact: string;
  attachLogs: boolean;
  badStatement: string;
}

export const defaultDispute: DisputeForm = {
  statement: '',
  attachLogs: false,
  contact: '',
  badStatement: '',
};

interface DisputeStatementFormProps {
  loading: boolean;
  dispute: DisputeForm;
  shortAlias: string;
  setDispute: (state: DisputeForm) => void;
  onClickSubmit: () => void;
}

export const DisputeStatementForm = ({
  loading,
  onClickSubmit,
  dispute,
  shortAlias,
  setDispute,
}: DisputeStatementFormProps): JSX.Element => {
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const { t } = useTranslation();

  const contactMethods: Contact = federation.getCoordinator(shortAlias)?.contact ?? {};

  return (
    <Grid
      container
      sx={{ width: '18em' }}
      direction='column'
      justifyContent='flex-start'
      alignItems='center'
      spacing={0.5}
      padding={1}
    >
      <Grid item>
        <TextField
          error={dispute.badStatement !== ''}
          helperText={dispute.badStatement}
          label={t('Submit dispute statement')}
          required
          inputProps={{
            style: { textAlign: 'center' },
          }}
          multiline
          rows={4}
          onChange={(e) => {
            setDispute({ ...dispute, statement: e.target.value });
          }}
        />
      </Grid>
      <Grid item>
        <Select
          variant='standard'
          required
          value={dispute.contactMethod}
          onChange={(e) => {
            setDispute({ ...dispute, contactMethod: e.target.value });
          }}
        >
          {Object.keys(contactMethods).map((contact) => {
            if (!contactMethods[contact] || contactMethods[contact] === '') return <></>;

            return (
              <MenuItem value={contact} key={contact}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                  {t(contact)}
                </div>
              </MenuItem>
            );
          })}
          <MenuItem value={'other'} key='other'>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
              {t('Other')}
            </div>
          </MenuItem>
        </Select>
      </Grid>
      <Grid item>
        <TextField
          required
          inputProps={{
            style: { textAlign: 'center' },
          }}
          multiline
          rows={4}
          onChange={(e) => {
            setDispute({ ...dispute, contact: e.target.value });
          }}
        />
      </Grid>
      <Grid item>
        <Tooltip
          enterTouchDelay={0}
          placement='top'
          title={t(
            'Attaching chat logs helps the dispute resolution process and adds transparency. However, it might compromise your privacy.',
          )}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={dispute.attachLogs}
                onChange={() => {
                  setDispute({ ...dispute, attachLogs: !dispute.attachLogs });
                }}
              />
            }
            label={t('Attach chat logs')}
          />
        </Tooltip>
      </Grid>
      <Grid item>
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
