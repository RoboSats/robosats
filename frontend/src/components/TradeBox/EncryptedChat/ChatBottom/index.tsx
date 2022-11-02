import React, { useState } from 'react';
import { Grid, useTheme, Tooltip, Button } from '@mui/material';
import { ExportIcon } from '../../../Icons';
import KeyIcon from '@mui/icons-material/Key';
import { useTranslation } from 'react-i18next';
import { saveAsJson } from '../../../../utils';

interface Props {
  orderId: number;
  setAudit: (audit: boolean) => void;
  audit: boolean;
  createJsonFile: () => object;
}

const ChatBottom: React.FC<Props> = ({ orderId, setAudit, audit, createJsonFile }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <>
      <Grid item xs={6}>
        <Tooltip
          placement='bottom'
          enterTouchDelay={0}
          enterDelay={500}
          enterNextDelay={2000}
          title={t('Verify your privacy')}
        >
          <Button size='small' color='primary' variant='outlined' onClick={() => setAudit(!audit)}>
            <KeyIcon />
            {t('Audit PGP')}{' '}
          </Button>
        </Tooltip>
      </Grid>

      <Grid item xs={6}>
        <Tooltip
          placement='bottom'
          enterTouchDelay={0}
          enterDelay={500}
          enterNextDelay={2000}
          title={t('Save full log as a JSON file (messages and credentials)')}
        >
          <Button
            size='small'
            color='primary'
            variant='outlined'
            onClick={() => saveAsJson('complete_log_chat_' + orderId + '.json', createJsonFile())}
          >
            <div style={{ width: '1.4em', height: '1.4em' }}>
              <ExportIcon sx={{ width: '0.8em', height: '0.8em' }} />
            </div>{' '}
            {t('Export')}{' '}
          </Button>
        </Tooltip>
      </Grid>
    </>
  );
};

export default ChatBottom;
