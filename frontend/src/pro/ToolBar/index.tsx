import React, { useContext, useRef } from 'react';
import { AppContext, type AppContextProps } from '../../contexts/AppContext';
import { Paper, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import { Lock, LockOpen, FileDownload, FileUpload } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { Settings } from '../../models';

interface ToolBarProps {
  height?: string;
}

const ToolBar = ({ height = '3em' }: ToolBarProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { settings, setSettings } = useContext<AppContextProps>(AppContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (!settings) return;
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', 'robosats_pro_settings.json');
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileObj = event.target.files && event.target.files[0];
    if (!fileObj) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result === 'string') {
          const json = JSON.parse(result);
          setSettings((prev: Settings) => ({ ...prev, ...json }));
          alert(t('Settings imported successfully!'));
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
        alert(t('Error importing settings. Invalid JSON.'));
      }
    };
    reader.readAsText(fileObj);
    event.target.value = '';
  };

  return (
    <Paper
      elevation={6}
      sx={{
        width: '100%',
        height,
        display: 'flex',
        alignItems: 'center',
        padding: '0 1em',
        borderRadius: 0,
      }}
    >
      <input
        type='file'
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept='.json'
      />
      <Grid container alignItems='center' justifyContent='space-between'>
        <Grid item>
          <Typography variant='h6'>PRO Toolbar</Typography>
        </Grid>
        <Grid item sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={t('Import Settings')}>
            <IconButton onClick={handleImportClick} color='primary'>
              <FileUpload />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('Export Settings')}>
            <IconButton onClick={handleExport} color='primary'>
              <FileDownload />
            </IconButton>
          </Tooltip>

          <Tooltip title={settings.freezeViewports ? t('Unlock Layout') : t('Lock Layout')}>
            <IconButton
              onClick={() => {
                setSettings((prev: Settings) => ({
                  ...prev,
                  freezeViewports: !prev.freezeViewports,
                }));
              }}
              color={settings.freezeViewports ? 'primary' : 'default'}
            >
              {settings.freezeViewports ? <Lock /> : <LockOpen />}
            </IconButton>
          </Tooltip>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ToolBar;
