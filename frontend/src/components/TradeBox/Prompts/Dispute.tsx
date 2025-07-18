import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Checkbox,
  FormControlLabel,
  Grid,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Contact } from '../../../models';
import { UseFederationStoreType, FederationContext } from '../../../contexts/FederationContext';

export interface DisputeForm {
  statement: string;
  contactMethod: string;
  badContact: string;
  contact: string;
  attachLogs: boolean;
  badStatement: string;
}

export const defaultDispute: DisputeForm = {
  statement: '',
  attachLogs: false,
  contactMethod: '',
  contact: '',
  badContact: '',
  badStatement: '',
};

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
}: DisputePromptProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { federation } = useContext<UseFederationStoreType>(FederationContext);

  const contactMethods: Contact = federation.getCoordinator(shortAlias)?.contact ?? {};

  return (
    <Grid container direction='column' style={{ width: '100%', padding: 16 }}>
      <Grid item>
        <Typography variant='body2'>
          {t(
            'Please, submit your statement. Be clear and specific about what happened and provide the necessary evidence. You MUST provide a contact method: burner email, SimpleX incognito link or telegram (make sure to create a searchable username) to follow up with the dispute solver (your trade host/coordinator). Disputes are solved at the discretion of real robots (aka humans), so be as helpful as possible to ensure a fair outcome.',
          )}
        </Typography>
      </Grid>
      <Grid item>
        <Grid item xs={12}>
          <TextField
            error={dispute.badStatement !== ''}
            helperText={dispute.badStatement}
            label={t('Submit dispute statement')}
            required
            fullWidth
            multiline
            rows={4}
            onChange={(e) => {
              setDispute({ ...dispute, statement: e.target.value });
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <Select
            variant='standard'
            required
            fullWidth
            displayEmpty
            placeholder={t('Contact method')}
            value={dispute.contactMethod}
            onChange={(e) => {
              setDispute({ ...dispute, contactMethod: e.target.value });
            }}
            renderValue={(value?: string) => {
              if (!value) {
                return <span style={{ color: 'gray' }}>{t('Select a contact method')}</span>;
              }
              return value.charAt(0).toUpperCase() + value.slice(1);
            }}
          >
            <MenuItem value='' disabled>
              {t('Select a contact method')}
            </MenuItem>
            {Object.keys(contactMethods).map((contact) => {
              if (!contactMethods[contact] || contactMethods[contact] === '') return <></>;
              if (['pgp', 'fingerprint', 'website'].includes(contact)) return <></>;

              return (
                <MenuItem value={contact} key={contact}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                    {contact.charAt(0).toUpperCase() + contact.slice(1)}
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
        <Grid item xs={12}>
          <TextField
            error={dispute.badContact !== ''}
            helperText={dispute.badContact}
            fullWidth
            required
            size='small'
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
        <Grid container sx={{ width: '100%' }} justifyContent='center'>
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
    </Grid>
  );
};

export default DisputePrompt;
