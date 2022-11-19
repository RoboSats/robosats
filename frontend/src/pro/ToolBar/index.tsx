import React from 'react';
import { Paper, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import { Lock, LockOpen } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Settings } from '../../models';

interface ToolBarProps {
  settings: Settings;
  height?: string;
  setSettings: (state: Settings) => void;
}

const ToolBar = ({ height = '3em', settings, setSettings }: ToolBarProps): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Paper
      elevation={6}
      sx={{
        width: `100%`,
        height: height,
        textAlign: 'center',
        padding: '1em',
        borderRadius: 0,
      }}
    >
      <Grid container>
        <Grid item>
          <Typography align='center' variant='h6'>
            Toolbar
          </Typography>
        </Grid>
        <Grid item>
          <Tooltip
            title={settings.freezeViewports ? t('Customize viewports') : t('Freeze viewports')}
            placement='bottom'
            enterTouchDelay={500}
            enterDelay={700}
            enterNextDelay={2000}
          >
            <IconButton
              onClick={() =>
                setSettings({ ...settings, freezeViewports: !settings.freezeViewports })
              }
              sx={{ position: 'fixed', right: '1em', top: '0em', color: 'text.secondary' }}
            >
              {settings.freezeViewports ? <Lock color='primary' /> : <LockOpen color='secondary' />}
            </IconButton>
          </Tooltip>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ToolBar;
