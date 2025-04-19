import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
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
} from '@mui/icons-material';
import { systemClient } from '../../services/System';
import { TorIcon } from '../Icons';
import { apiClient } from '../../services/api';
import { websocketClient } from '../../services/Websocket';

interface SettingsFormProps {
  dense?: boolean;
}

const SettingsForm = ({ dense = false }: SettingsFormProps): JSX.Element => {
  const { settings, setSettings, client } = useContext<UseAppStoreType>(AppContext);
  const theme = useTheme();
  const { t } = useTranslation();
  const fontSizes = [
    { label: 'XS', value: { basic: 12, pro: 10 } },
    { label: 'S', value: { basic: 13, pro: 11 } },
    { label: 'M', value: { basic: 14, pro: 12 } },
    { label: 'L', value: { basic: 15, pro: 13 } },
    { label: 'XL', value: { basic: 16, pro: 14 } },
  ];

  return (
    <Grid container spacing={2}>
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
                systemClient.setItem(`settings_fontsize_${settings.frontend}`, fontSize.toString());
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

          {client === 'mobile' && (
            <ListItem>
              <ListItemIcon>
                <TorIcon />
              </ListItemIcon>
              <ToggleButtonGroup
                exclusive={true}
                value={settings.useProxy}
                onChange={(_e, useProxy) => {
                  setSettings({ ...settings, useProxy });
                  systemClient.setItem('settings_use_proxy', String(useProxy));
                  apiClient.useProxy = useProxy;
                  websocketClient.useProxy = useProxy;
                }}
              >
                <ToggleButton value={true} color='primary'>
                  {t('Build-in')}
                </ToggleButton>
                <ToggleButton value={false} color='secondary'>
                  {t('Disabled')}
                </ToggleButton>
              </ToggleButtonGroup>
            </ListItem>
          )}
        </List>
      </Grid>
    </Grid>
  );
};

export default SettingsForm;
