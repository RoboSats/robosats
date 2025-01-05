import React, { useContext, useState } from 'react';
import { Box, Button, Grid, List, ListItem, Paper, TextField, Typography } from '@mui/material';
import SettingsForm from '../../components/SettingsForm';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import FederationTable from '../../components/FederationTable';
import { t } from 'i18next';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';

const SettingsPage = (): JSX.Element => {
  const { windowSize, navbarHeight } = useContext<UseAppStoreType>(AppContext);
  const { federation, addNewCoordinator } = useContext<UseFederationStoreType>(FederationContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const maxHeight = (windowSize.height - navbarHeight) * 0.85 - 3;
  const [newAlias, setNewAlias] = useState<string>('');
  const [newUrl, setNewUrl] = useState<string>('');
  const [error, setError] = useState<string>();
  // Regular expression to match a valid .onion URL
  const onionUrlPattern = /^((http|https):\/\/)?[a-zA-Z2-7]{16,56}\.onion$/;

  const addCoordinator: () => void = () => {
    if (federation.getCoordinator(newAlias)) {
      setError(t('Alias already exists'));
    } else {
      if (onionUrlPattern.test(newUrl)) {
        let fullNewUrl = newUrl;
        if (!/^((http|https):\/\/)/.test(fullNewUrl)) {
          fullNewUrl = `http://${newUrl}`;
        }
        addNewCoordinator(newAlias, fullNewUrl);
        garage.syncCoordinator(federation, newAlias);
        setNewAlias('');
        setNewUrl('');
      } else {
        setError(t('Invalid Onion URL'));
      }
    }
  };

  return (
    <Paper
      elevation={12}
      sx={{
        padding: '0.6em',
        width: '20.5em',
        maxHeight: `${maxHeight}em`,
        overflow: 'auto',
        overflowX: 'clip',
      }}
    >
      <Grid container>
        <Grid item xs={12}>
          <SettingsForm />
        </Grid>
        <Grid item xs={12}>
          <FederationTable maxHeight={18} />
        </Grid>
        <Grid item xs={12}>
          <Typography align='center' component='h2' variant='subtitle2' color='secondary'>
            {error}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <List>
            <ListItem>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <TextField
                  id='outlined-basic'
                  label={t('Alias')}
                  variant='outlined'
                  size='small'
                  value={newAlias}
                  onChange={(e) => {
                    setNewAlias(e.target.value);
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <TextField
                  id='outlined-basic'
                  label={t('URL')}
                  variant='outlined'
                  size='small'
                  value={newUrl}
                  onChange={(e) => {
                    setNewUrl(e.target.value);
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  sx={{ maxHeight: 38 }}
                  disabled={false}
                  onClick={addCoordinator}
                  variant='contained'
                  color='primary'
                  size='small'
                  type='submit'
                >
                  {t('Add')}
                </Button>
              </Box>
            </ListItem>
          </List>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SettingsPage;
