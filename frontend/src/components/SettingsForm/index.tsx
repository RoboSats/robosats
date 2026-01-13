import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { type UseAppStoreType, AppContext } from '../../contexts/AppContext';
import {
  Grid,
  Paper,
  Switch,
  useTheme,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  Slider,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import SelectLanguage from './SelectLanguage';
import {
  Translate,
  Palette,
  LightMode,
  DarkMode,
  SettingsOverscan,
  Link,
  QrCode,
  SettingsInputAntenna,
  NotificationsActive,
  VpnKey,
  SmartToy,
  Garage,
} from '@mui/icons-material';
import { systemClient } from '../../services/System';
import Tor from '../Icons/Tor';
import { UseFederationStoreType, FederationContext } from '../../contexts/FederationContext';
import { UseGarageStoreType, GarageContext } from '../../contexts/GarageContext';

interface SettingsFormProps {
  dense?: boolean;
}

const SettingsForm = ({ dense = false }: SettingsFormProps): React.JSX.Element => {
  const { updateConnection } = useContext<UseFederationStoreType>(FederationContext);
  const { settings, setSettings, client, navigateToPage } = useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [showModeChangeDialog, setShowModeChangeDialog] = useState<boolean>(false);
  const [pendingMode, setPendingMode] = useState<'legacy' | 'garageKey' | null>(null);
  const fontSizes = [
    { label: 'XS', value: { basic: 12, pro: 10 } },
    { label: 'S', value: { basic: 13, pro: 11 } },
    { label: 'M', value: { basic: 14, pro: 12 } },
    { label: 'L', value: { basic: 15, pro: 13 } },
    { label: 'XL', value: { basic: 16, pro: 14 } },
  ];

  const hasActiveData = (): boolean => {
    return Object.keys(garage.slots).length > 0 || garage.getGarageKey() !== null;
  };

  const handleModeChange = (newMode: 'legacy' | 'garageKey' | null): void => {
    if (newMode !== null && newMode !== settings.garageMode) {
      setPendingMode(newMode);
      setShowModeChangeDialog(true);
    }
  };

  const confirmModeChange = (): void => {
    if (pendingMode !== null) {
      const newSettings = { ...settings, garageMode: pendingMode };
      setSettings(newSettings);
      systemClient.setItem('settings_garage_mode', pendingMode);

      garage.deleteGarageKey();
      garage.delete();

      garage.setMode(pendingMode);

      setShowModeChangeDialog(false);
      setPendingMode(null);

      navigateToPage('garage', navigate);
    }
  };

  const cancelModeChange = (): void => {
    setShowModeChangeDialog(false);
    setPendingMode(null);
  };

  return (
    <Grid item xs={12}>
      <Grid container direction='column' justifyItems='center' alignItems='center'>
        <Grid item xs={12}>
          <List dense={dense}>
            <ListItem>
              <ListItemIcon>
                <Translate />
              </ListItemIcon>
              <SelectLanguage
                language={settings.language}
                setLanguage={(language) => {
                  setSettings({ ...settings, language });
                  systemClient.setItem('settings_language', language);
                }}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Palette />
              </ListItemIcon>
              <FormControlLabel
                labelPlacement='end'
                label={settings.mode === 'dark' ? t('Dark') : t('Light')}
                control={
                  <Switch
                    checked={settings.mode === 'dark'}
                    checkedIcon={
                      <Paper
                        elevation={3}
                        sx={{
                          width: '1.2em',
                          height: '1.2em',
                          borderRadius: '0.4em',
                          backgroundColor: 'white',
                          position: 'relative',
                          top: `${7 - 0.5 * theme.typography.fontSize}px`,
                        }}
                      >
                        <DarkMode sx={{ width: '0.8em', height: '0.8em', color: '#666' }} />
                      </Paper>
                    }
                    icon={
                      <Paper
                        elevation={3}
                        sx={{
                          width: '1.2em',
                          height: '1.2em',
                          borderRadius: '0.4em',
                          backgroundColor: 'white',
                          padding: '0.07em',
                          position: 'relative',
                          top: `${7 - 0.5 * theme.typography.fontSize}px`,
                        }}
                      >
                        <LightMode sx={{ width: '0.67em', height: '0.67em', color: '#666' }} />
                      </Paper>
                    }
                    onChange={(e) => {
                      const mode = e.target.checked ? 'dark' : 'light';
                      setSettings({ ...settings, mode });
                      systemClient.setItem('settings_mode', mode);
                    }}
                  />
                }
              />
              {settings.mode === 'dark' ? (
                <>
                  <ListItemIcon>
                    <QrCode />
                  </ListItemIcon>
                  <FormControlLabel
                    sx={{ position: 'relative', right: '1.5em', width: '3em' }}
                    labelPlacement='end'
                    label={settings.lightQRs ? t('Light') : t('Dark')}
                    control={
                      <Switch
                        checked={!settings.lightQRs}
                        checkedIcon={
                          <Paper
                            elevation={3}
                            sx={{
                              width: '1.2em',
                              height: '1.2em',
                              borderRadius: '0.4em',
                              backgroundColor: 'white',
                              position: 'relative',
                              top: `${7 - 0.5 * theme.typography.fontSize}px`,
                            }}
                          >
                            <DarkMode sx={{ width: '0.8em', height: '0.8em', color: '#666' }} />
                          </Paper>
                        }
                        icon={
                          <Paper
                            elevation={3}
                            sx={{
                              width: '1.2em',
                              height: '1.2em',
                              borderRadius: '0.4em',
                              backgroundColor: 'white',
                              padding: '0.07em',
                              position: 'relative',
                              top: `${7 - 0.5 * theme.typography.fontSize}px`,
                            }}
                          >
                            <LightMode sx={{ width: '0.67em', height: '0.67em', color: '#666' }} />
                          </Paper>
                        }
                        onChange={(e) => {
                          const lightQRs = !e.target.checked;
                          setSettings({ ...settings, lightQRs });
                          systemClient.setItem('settings_light_qr', String(lightQRs));
                        }}
                      />
                    }
                  />
                </>
              ) : (
                <></>
              )}
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <SettingsOverscan />
              </ListItemIcon>
              <Slider
                value={settings.fontSize}
                min={settings.frontend === 'basic' ? 12 : 10}
                max={settings.frontend === 'basic' ? 16 : 14}
                step={1}
                onChange={(e) => {
                  const fontSize = e.target.value;
                  setSettings({ ...settings, fontSize });
                  systemClient.setItem(
                    `settings_fontsize_${settings.frontend}`,
                    fontSize.toString(),
                  );
                }}
                valueLabelDisplay='off'
                marks={fontSizes.map(({ label, value }) => ({
                  label: <Typography variant='caption'>{t(label)}</Typography>,
                  value: settings.frontend === 'basic' ? value.basic : value.pro,
                }))}
                track={false}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <SettingsInputAntenna />
              </ListItemIcon>
              <ToggleButtonGroup
                sx={{ width: '100%' }}
                exclusive={true}
                value={settings.connection}
                onChange={(_e, connection) => {
                  setSettings({ ...settings, connection });
                  systemClient.setItem('settings_connection', connection);
                }}
              >
                <ToggleButton value='api' color='primary' sx={{ flexGrow: 1 }}>
                  {t('API')}
                </ToggleButton>
                <ToggleButton value='nostr' color='secondary' sx={{ flexGrow: 1 }}>
                  {t('nostr')}
                </ToggleButton>
              </ToggleButtonGroup>
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Link />
              </ListItemIcon>
              <ToggleButtonGroup
                sx={{ width: '100%' }}
                exclusive={true}
                value={settings.network}
                onChange={(_e, network) => {
                  const newSetting = { ...settings, network };
                  updateConnection(newSetting);
                  setSettings({ ...settings, network });
                  systemClient.setItem('settings_network', network);
                }}
              >
                <ToggleButton value='mainnet' color='primary' sx={{ flexGrow: 1 }}>
                  {t('Mainnet')}
                </ToggleButton>
                <ToggleButton value='testnet' color='secondary' sx={{ flexGrow: 1 }}>
                  {t('Testnet')}
                </ToggleButton>
              </ToggleButtonGroup>
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Garage />
              </ListItemIcon>
              <ListItemText
                primary={t('Robot Generation Mode')}
                secondary={t('Choose how robots are generated and managed')}
              />
            </ListItem>
            <ListItem>
              <ToggleButtonGroup
                sx={{ width: '100%' }}
                exclusive={true}
                value={settings.garageMode}
                onChange={(_e, garageMode) => {
                  handleModeChange(garageMode);
                }}
              >
                <ToggleButton value='garageKey' color='primary' sx={{ flexGrow: 1 }}>
                  <Stack direction='row' spacing={1} alignItems='center'>
                    <VpnKey />
                    <span>{t('Garage Key')}</span>
                  </Stack>
                </ToggleButton>
                <ToggleButton value='legacy' color='secondary' sx={{ flexGrow: 1 }}>
                  <Stack direction='row' spacing={1} alignItems='center'>
                    <SmartToy />
                    <span>{t('Legacy')}</span>
                  </Stack>
                </ToggleButton>
              </ToggleButtonGroup>
            </ListItem>

            {client == 'mobile' && (
              <ListItem>
                <ListItemIcon>
                  <NotificationsActive />
                </ListItemIcon>
                <ToggleButtonGroup
                  exclusive={true}
                  sx={{ width: '100%' }}
                  value={settings.androidNotifications}
                  onChange={(_e, androidNotifications) => {
                    setSettings({ ...settings, androidNotifications });
                    systemClient.setItem('settings_notifications', String(androidNotifications));
                  }}
                >
                  <ToggleButton value={true} color='primary' sx={{ flexGrow: 1 }}>
                    {t('On')}
                  </ToggleButton>
                  <ToggleButton value={false} color='secondary' sx={{ flexGrow: 1 }}>
                    {t('Off')}
                  </ToggleButton>
                </ToggleButtonGroup>
              </ListItem>
            )}

            {client == 'mobile' && (
              <ListItem>
                <ListItemIcon>
                  <Tor />
                </ListItemIcon>
                <ToggleButtonGroup
                  exclusive={true}
                  sx={{ width: '100%' }}
                  value={settings.useProxy}
                  onChange={(_e, useProxy) => {
                    setSettings({ ...settings, useProxy });
                    systemClient.setItem('settings_use_proxy', String(useProxy));
                    systemClient.restart();
                  }}
                >
                  <ToggleButton value={false} color='primary' sx={{ flexGrow: 1 }}>
                    {t('Orbot')}
                  </ToggleButton>
                  <ToggleButton value={true} color='secondary' sx={{ flexGrow: 1 }}>
                    {t('Build-in')}
                  </ToggleButton>
                </ToggleButtonGroup>
              </ListItem>
            )}
          </List>
        </Grid>
      </Grid>

      <Dialog
        open={showModeChangeDialog}
        onClose={cancelModeChange}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          {t('Change Robot Generation Mode?')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('Changing the robot generation mode will restart the application and clear all current robot data.')}
          </DialogContentText>
          {hasActiveData() && (
            <Alert severity='warning' sx={{ mt: 2 }}>
              {settings.garageMode === 'garageKey' && garage.getGarageKey()
                ? t('You have an active Garage Key. Make sure you have saved it before continuing!')
                : t('You have active robots. Make sure you have saved your tokens before continuing!')}
            </Alert>
          )}
          <DialogContentText sx={{ mt: 2 }}>
            {t('Do you want to continue?')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelModeChange} color='primary'>
            {t('Cancel')}
          </Button>
          <Button onClick={confirmModeChange} color='secondary' variant='contained'>
            {t('Confirm and Restart')}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default SettingsForm;
