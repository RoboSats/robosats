import React, { useContext, useRef } from 'react';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';
import { Paper, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import { Lock, LockOpen, FileDownload, FileUpload, RestartAlt } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { Settings, Maker } from '../../models';
import { type Layout } from 'react-grid-layout';

// Workspace export structure
interface WorkspaceExport {
  version: number;
  exportedAt: string;
  layout: Layout;
  settings: Settings;
  maker: Partial<Maker>;
}

interface ToolBarProps {
  height?: string;
  layout: Layout;
  setLayout: React.Dispatch<React.SetStateAction<Layout>>;
  defaultLayout: Layout;
}

const ToolBar = ({
  height = '3em',
  layout,
  setLayout,
  defaultLayout,
}: ToolBarProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { settings, setSettings } = useContext<UseAppStoreType>(AppContext);
  const { maker, setMaker } = useContext<UseGarageStoreType>(GarageContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export full workspace (layout + settings + maker)
  const handleExport = () => {
    const workspace: WorkspaceExport = {
      version: 1,
      exportedAt: new Date().toISOString(),
      layout,
      settings,
      maker: {
        // Only export user-configurable maker settings
        advancedOptions: maker.advancedOptions,
        coordinator: maker.coordinator,
        isExplicit: maker.isExplicit,
        amount: maker.amount,
        paymentMethods: maker.paymentMethods,
        premium: maker.premium,
        publicDuration: maker.publicDuration,
        escrowDuration: maker.escrowDuration,
        bondSize: maker.bondSize,
        minAmount: maker.minAmount,
        maxAmount: maker.maxAmount,
      },
    };

    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(workspace, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', `robosats_workspace_${Date.now()}.json`);
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
          const json = JSON.parse(result) as WorkspaceExport;

          // Validate workspace structure
          if (!json.version || !json.layout || !json.settings) {
            throw new Error('Invalid workspace file structure');
          }

          // Import layout
          if (json.layout && Array.isArray(json.layout)) {
            setLayout(json.layout);
          }

          // Import settings
          if (json.settings) {
            setSettings((prev: Settings) => ({ ...prev, ...json.settings }));
          }

          // Import maker settings
          if (json.maker) {
            setMaker((prev: Maker) => ({ ...prev, ...json.maker }));
          }

          alert(t('Workspace imported successfully!'));
        }
      } catch (error) {
        console.error('Error parsing workspace JSON:', error);
        alert(t('Error importing workspace. Invalid file format.'));
      }
    };
    reader.readAsText(fileObj);
    event.target.value = '';
  };

  // Reset layout to default
  const handleResetLayout = () => {
    if (confirm(t('Reset layout to default? This cannot be undone.'))) {
      setLayout(defaultLayout);
    }
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
          <Tooltip title={t('Import Workspace')}>
            <IconButton onClick={handleImportClick} color='primary'>
              <FileUpload />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('Export Workspace')}>
            <IconButton onClick={handleExport} color='primary'>
              <FileDownload />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('Reset Layout')}>
            <IconButton onClick={handleResetLayout} color='default'>
              <RestartAlt />
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
