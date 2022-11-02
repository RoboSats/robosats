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
    <Grid container spacing={0.5}>
      <Grid item xs={0.3} />
      <Grid item xs={5.5}>
        <Paper elevation={1} sx={connected ? { backgroundColor: connectedColor } : {}}>
          <Typography variant='caption' sx={{ color: connectedTextColor }}>
            {t('You') + ': '}
            {connected ? t('connected') : t('disconnected')}
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={0.4} />
      <Grid item xs={5.5}>
        <Paper elevation={1} sx={peerConnected ? { backgroundColor: connectedColor } : {}}>
          <Typography variant='caption' sx={{ color: connectedTextColor }}>
            {t('Peer') + ': '}
            {peerConnected ? t('connected') : t('disconnected')}
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={0.3} />
    </Grid>
  );
};

export default ChatHeader;
