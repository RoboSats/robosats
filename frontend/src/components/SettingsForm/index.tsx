import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Grid,
  Paper,
  Switch,
  useTheme,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
} from '@mui/material';
import { Settings } from '../../models';
import SelectLanguage from './SelectLanguage';
import { Language, Palette, LightMode, DarkMode } from '@mui/icons-material';

interface SettingsFormProps {
  dense?: boolean;
  settings: Settings;
  setSettings: (state: Settings) => void;
}

const SettingsForm = ({ dense = false, settings, setSettings }: SettingsFormProps): JSX.Element => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Grid container spacing={1}>
      <Grid item>
        <List dense={dense}>
          <ListItem>
            <ListItemIcon>
              <Language />
            </ListItemIcon>
            <SelectLanguage
              language={settings.language}
              setLanguage={(language) => setSettings({ ...settings, language })}
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
                      }}
                    >
                      <LightMode sx={{ width: '0.7em', height: '0.7em', color: '#666' }} />
                    </Paper>
                  }
                  onChange={(e) =>
                    setSettings({ ...settings, mode: e.target.checked ? 'dark' : 'light' })
                  }
                />
              }
            />
          </ListItem>
        </List>
      </Grid>
    </Grid>
  );
};

export default SettingsForm;
