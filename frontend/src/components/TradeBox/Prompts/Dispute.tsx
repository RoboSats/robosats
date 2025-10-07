import React, { useContext, useEffect, useState } from 'react';
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
import { Contact, Order } from '../../../models';
import { UseFederationStoreType, FederationContext } from '../../../contexts/FederationContext';
import { apiClient } from '../../../services/api';
import { GarageContext, UseGarageStoreType } from '../../../contexts/GarageContext';
import { EncryptedChatMessage, ServerMessage } from '../EncryptedChat';
import { decryptMessage } from '../../../pgp';
import { SubmitActionProps } from '../index';

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
  submitAction: (propr: SubmitActionProps) => void;
  order: Order;
  dispute: DisputeForm;
  shortAlias: string;
  setDispute: (state: DisputeForm) => void;
}

export const DisputePrompt = ({
  submitAction,
  order,
  dispute,
  shortAlias,
  setDispute,
}: DisputePromptProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);

  const contactMethods: Contact = federation.getCoordinator(shortAlias)?.contact ?? {};

  const [messages, setMessages] = useState<EncryptedChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const submitStatement = function (): void {
    let statement = dispute.statement;
    if (!statement || statement.trim() === '' || statement.length < 100) {
      setDispute({
        ...dispute,
        badStatement: t('The statement is too short. Make sure to be thorough.'),
      });
    } else if (!dispute.contact || dispute.contact.trim() === '') {
      setDispute({ ...dispute, badContact: t('A contact method is required') });
    } else {
      const { contactMethod, contact } = dispute;
      statement = `${contactMethod ?? ''}: ${contact ?? ''} \n\n ${statement}`;
      if (dispute.attachLogs) {
        const payload = { statement, messages };
        statement = JSON.stringify(payload, null, 2);
      }

      setLoading(true);
      submitAction({ action: 'submit_statement', statement });
    }
  };

  useEffect(() => {
    const url = federation.getCoordinator(shortAlias).url;
    apiClient
      .get(url, `/api/chat/?order_id=${order.id}&offset=0`, {
        tokenSHA256: garage.getSlot()?.getRobot()?.tokenSHA256 ?? '',
      })
      .then((results: object) => {
        if (results != null) {
          void decryptMessages(results.messages, results.peer_pubkey.split('\\').join('\n'))
        }
      })
  }, [])

  const decryptMessages = async (serverMessages: ServerMessage[], peerPubKey: string) => {
    const slot = garage.getSlot();
    const robot = slot?.getRobot();

    if (slot && robot) {
      for (const dataFromServer of serverMessages) {
        if (dataFromServer.message.substring(0, 27) === `-----BEGIN PGP MESSAGE-----`) {
          const decryptedData = await decryptMessage(
            dataFromServer.message.split('\\').join('\n'),
            dataFromServer.nick === slot.nickname ? robot.pubKey : peerPubKey,
            robot.encPrivKey,
            slot.token,
          )
          setMessages((prev: EncryptedChatMessage[]) => {
            const x: EncryptedChatMessage = {
              index: dataFromServer.index,
              encryptedMessage: dataFromServer.message.split('\\').join('\n'),
              plainTextMessage: decryptedData.decryptedMessage,
              validSignature: decryptedData.validSignature,
              userNick: dataFromServer.nick,
              time: dataFromServer.time,
            };
            return [...prev, x].sort((a, b) => a.index - b.index);
          });
        }
      }
      setLoading(false)
    }
  }

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
                  onChange={(_e, attachLogs) => {
                    setDispute({ ...dispute, attachLogs });
                  }}
                />
              }
              label={t('Attach chat logs')}
            />
          </Tooltip>
        </Grid>
        <Grid container sx={{ width: '100%' }} justifyContent='center'>
          <LoadingButton
            onClick={submitStatement}
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
