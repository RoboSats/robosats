import React from 'react';
import { Grid, Paper, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface Props {
  connected: boolean;
  peerConnected: boolean;
}

const ChatHeader: React.FC<Props> = ({ connected, peerConnected }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const connectedColor = theme.palette.mode === 'light' ? '#b5e3b7' : '#153717';
  const connectedTextColor = theme.palette.getContrastText(connectedColor);

  return (
    <Grid
      container
      direction='row'
      justifyContent='space-between'
      alignItems='flex-end'
      padding={0}
    >
      <Grid item>
        <Paper
          style={{
            width: '7.2em',
            height: '1.8em',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          elevation={1}
          sx={connected ? { backgroundColor: connectedColor } : {}}
        >
          <Typography align='center' variant='caption' sx={{ color: connectedTextColor }}>
            {t('You') + ': '}
            {connected ? t('connected') : t('disconnected')}
          </Typography>
        </Paper>
      </Grid>
      <Grid item>
        <Paper
          style={{
            width: '7.2em',
            height: '1.8em',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          elevation={1}
          sx={peerConnected ? { backgroundColor: connectedColor } : {}}
        >
          <Typography align='center' variant='caption' sx={{ color: connectedTextColor }}>
            {t('Peer') + ': '}
            {connected ? (peerConnected ? t('connected') : t('disconnected')) : t('...waiting')}
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ChatHeader;
