import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { type UseAppStoreType, AppContext } from '../../contexts/AppContext';
import {
  Grid,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Box,
  Slider,
} from '@mui/material';
import SelectLanguage from './SelectLanguage';
import {
  Translate,
  Palette,
  SettingsOverscan,
  Link,
  AccountBalance,
  AttachMoney,
  QrCode,
  DarkMode,
} from '@mui/icons-material';
import { systemClient } from '../../services/System';
import { TorIcon } from '../Icons';
import SwapCalls from '@mui/icons-material/SwapCalls';
import { apiClient } from '../../services/api';
import { styled } from '@mui/system';

interface SettingsFormProps {
  dense?: boolean;
}

const SettingsForm = ({ dense = false }: SettingsFormProps): JSX.Element => {
  const { fav, setFav, settings, setSettings } = useContext<UseAppStoreType>(AppContext);
  const { t } = useTranslation();
  const theme = useTheme();

  const fontSizes = [
    { label: 'XS', value: { basic: 12, pro: 10 } },
    { label: 'S', value: { basic: 13, pro: 11 } },
    { label: 'M', value: { basic: 14, pro: 12 } },
    { label: 'L', value: { basic: 15, pro: 13 } },
    { label: 'XL', value: { basic: 16, pro: 14 } },
  ];

  const handleToggleChange = (e, newValue) => {
    if (newValue !== null) {
      setFav({ ...fav, mode: newValue, currency: newValue === 'fiat' ? 0 : 1000 });
    }
  };

  const handleNetworkChange = (e, newValue) => {
    if (newValue !== null) {
      setSettings({ ...settings, network: newValue });
      systemClient.setItem('settings_network', newValue);
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <List dense={dense}>
          {/* Language Settings */}
          <StyledListItem>
            <SettingHeader>
              <ListItemIcon>
                <Translate />
              </ListItemIcon>
              <Typography variant="subtitle1">
                {t('Language Settings')}
              </Typography>
            </SettingHeader>
            <StyledSelectLanguage
              language={settings.language}
              setLanguage={(language) => {
                setSettings({ ...settings, language });
                systemClient.setItem('settings_language', language);
              }}
            />
          </StyledListItem>

          {/* Appearance Settings */}
          <StyledListItem>
            <SettingHeader>
              <ListItemIcon>
                <Palette />
              </ListItemIcon>
              <Typography variant="subtitle1">
                {t('Appearance Settings')}
              </Typography>
            </SettingHeader>
            <AppearanceSettingsBox>
              <FormControlLabel
                labelPlacement="end"
                label={t('Dark Mode')}
                control={
                  <Switch
                    checked={settings.mode === 'dark'}
                    onChange={(e) => {
                      const mode = e.target.checked ? 'dark' : 'light';
                      setSettings({ ...settings, mode });
                      systemClient.setItem('settings_mode', mode);
                    }}
                  />
                }
              />
              {settings.mode === 'dark' && (
                <QRCodeSwitch
                  labelPlacement="end"
                  label={t('QR Code Color')}
                  control={
                    <Switch
                      checked={!settings.lightQRs}
                      onChange={(e) => {
                        const lightQRs = !e.target.checked;
                        setSettings({ ...settings, lightQRs });
                        systemClient.setItem('settings_light_qr', String(lightQRs));
                      }}
                    />
                  }
                />
              )}
            </AppearanceSettingsBox>
          </StyledListItem>

          {/* Font Size Settings */}
          <StyledListItem>
            <SettingHeader>
              <ListItemIcon>
                <SettingsOverscan />
              </ListItemIcon>
              <Typography variant="subtitle1">
                {t('Font Size')}
              </Typography>
            </SettingHeader>
            <StyledSlider
              value={settings.fontSize}
              min={settings.frontend === 'basic' ? 12 : 10}
              max={settings.frontend === 'basic' ? 16 : 14}
              step={1}
              onChange={(e) => {
                const fontSize = e.target.value;
                setSettings({ ...settings, fontSize });
                systemClient.setItem(`settings_fontsize_${settings.frontend}`, fontSize.toString());
              }}
              valueLabelDisplay="off"
              track={false}
              marks={fontSizes.map(({ label, value }) => ({
                label: <Typography variant="caption">{t(label)}</Typography>,
                value: settings.frontend === 'basic' ? value.basic : value.pro,
              }))}
            />
          </StyledListItem>

          {/* Currency Settings */}
          <StyledListItem>
            <SettingHeader>
              <ListItemIcon>
                <AccountBalance />
              </ListItemIcon>
              <Typography variant="subtitle1">
                {t('Currency Settings')}
              </Typography>
            </SettingHeader>
            <StyledToggleButtonGroup
              exclusive={true}
              value={fav.mode}
              onChange={handleToggleChange}
              fullWidth
            >
              <StyledToggleButton value="fiat">
                <AttachMoney />
                {t('Fiat')}
              </StyledToggleButton>
              <StyledToggleButton value="swap">
                <SwapCalls />
                {t('Swaps')}
              </StyledToggleButton>
            </StyledToggleButtonGroup>
          </StyledListItem>

          {/* Network Settings */}
          <StyledListItem>
            <SettingHeader>
              <ListItemIcon>
                <Link />
              </ListItemIcon>
              <Typography variant="subtitle1">
                {t('Network Settings')}
              </Typography>
            </SettingHeader>
            <StyledToggleButtonGroup
              exclusive={true}
              value={settings.network}
              onChange={handleNetworkChange}
              fullWidth
            >
              <StyledToggleButton value="mainnet">
                {t('Mainnet')}
              </StyledToggleButton>
              <StyledToggleButton value="testnet">
                {t('Testnet')}
              </StyledToggleButton>
            </StyledToggleButtonGroup>
          </StyledListItem>

          {/* Proxy Settings */}
          {window.NativeRobosats !== undefined && (
            <StyledListItem>
              <SettingHeader>
                <ListItemIcon>
                  <TorIcon />
                </ListItemIcon>
                <Typography variant="subtitle1">
                  {t('Proxy Settings')}
                </Typography>
              </SettingHeader>
              <StyledToggleButtonGroup
                exclusive={true}
                value={settings.useProxy}
                onChange={(_e, useProxy) => {
                  if (useProxy !== null) {
                    setSettings({ ...settings, useProxy });
                    systemClient.setItem('settings_use_proxy', String(useProxy));
                    apiClient.useProxy = useProxy;
                  }
                }}
                fullWidth
              >
                <StyledToggleButton value={true}>
                  {t('Built-in')}
                </StyledToggleButton>
                <StyledToggleButton value={false}>
                  {t('Disabled')}
                </StyledToggleButton>
              </StyledToggleButtonGroup>
            </StyledListItem>
          )}
        </List>
      </Grid>
    </Grid>
  );
};

// Styled Components
const StyledListItem = styled(ListItem)({
  display: 'block',
});

const SettingHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  marginBottom: '0.5em',
});

const StyledSelectLanguage = styled(SelectLanguage)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    border: '2px solid black',
    boxShadow: '4px 4px 0px rgba(0, 0, 0, 1)',
    width: '100%',
  },
}));

const AppearanceSettingsBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'column',
  gap: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    flexDirection: 'row',
    gap: theme.spacing(1),
  },
}));

const QRCodeSwitch = styled(FormControlLabel)(({ theme }) => ({
  marginLeft: 0,
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(2),
  },
}));

const StyledSlider = styled(Slider)(({ theme }) => ({
  '& .MuiSlider-thumb': {
    borderRadius: '8px',
    border: '2px solid black',
  },
  '& .MuiSlider-track': {
    borderRadius: '8px',
    border: '2px solid black',
  },
  '& .MuiSlider-rail': {
    borderRadius: '8px',
    border: '2px solid black',
  },
}));

const StyledToggleButtonGroup = styled(ToggleButtonGroup)({
  width: '100%',
});

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  borderRadius: '8px',
  border: '2px solid black',
  boxShadow: 'none',
  fontWeight: 'bold',
  width: '100%',
  '&.Mui-selected': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.main,
    },
  },
  '&:hover': {
    backgroundColor: 'initial',
  },
}));

export default SettingsForm;