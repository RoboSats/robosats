import React from 'react';
import { Grid, Tooltip, Button } from '@mui/material';
import { ExportIcon } from '../../../Icons';
import KeyIcon from '@mui/icons-material/Key';
import { useTranslation } from 'react-i18next';
import { saveAsJson } from '../../../../utils';
import { systemClient } from '../../../../services/System';

interface Props {
  orderId: number;
  setAudit: (audit: boolean) => void;
  audit: boolean;
  createJsonFile: () => object;
}

const ChatBottom: React.FC<Props> = ({ orderId, setAudit, audit, createJsonFile }) => {
  const { t } = useTranslation();

  return (
    <Grid
      container
      sx={{ width: '18em' }}
      direction='row'
      justifyContent='space-evenly'
      alignItems='center'
      padding={0.3}
    >
      <Grid item>
        <Tooltip
          placement='bottom'
          enterTouchDelay={0}
          enterDelay={500}
          enterNextDelay={2000}
          title={t('Verify your privacy')}
        >
          <Button
            size='small'
            color='primary'
            variant='outlined'
            onClick={() => {
              setAudit(!audit);
            }}
          >
            <KeyIcon sx={{ width: '0.8em', height: '0.8em' }} />
            {t('Audit PGP')}{' '}
          </Button>
        </Tooltip>
      </Grid>

      <Grid item>
        {window.ReactNativeWebView === undefined ? (
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
              onClick={() => {
                saveAsJson(`complete_log_chat_${orderId}.json`, createJsonFile());
              }}
            >
              <div style={{ width: '1.4em', height: '1.4em' }}>
                <ExportIcon sx={{ width: '0.8em', height: '0.8em' }} />
              </div>{' '}
              {t('Export')}{' '}
            </Button>
          </Tooltip>
        ) : (
          <Tooltip disableHoverListener enterTouchDelay={0} title={t('Copied!')}>
            <Button
              size='small'
              color='primary'
              variant='outlined'
              onClick={() => {
                systemClient.copyToClipboard(JSON.stringify(createJsonFile()));
              }}
            >
              <div style={{ width: '1.4em', height: '1.4em' }}>
                <ExportIcon sx={{ width: '0.8em', height: '0.8em' }} />
              </div>{' '}
              {t('Export')}{' '}
            </Button>
          </Tooltip>
        )}
      </Grid>
    </Grid>
  );
};

export default ChatBottom;
