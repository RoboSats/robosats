import React, { useContext, useState } from 'react';
import { Button, Grid, List, ListItem, Paper, TextField, Typography } from '@mui/material';
import SettingsForm from '../../components/SettingsForm';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import FederationTable from '../../components/FederationTable';
import { t } from 'i18next';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';

const SettingsPage = (): JSX.Element => {
  const { windowSize, navbarHeight } = useContext<UseAppStoreType>(AppContext);
  const { federation, addNewCoordinator } = useContext<UseFederationStoreType>(FederationContext);
  const maxHeight = (windowSize.height * 0.65)
  const [newAlias, setNewAlias] = useState<string>('');
  const [newUrl, setNewUrl] = useState<string>('');
  const [error, setError] = useState<string>();
  // Regular expression to match a valid .onion URL
  const onionUrlPattern = /^((http|https):\/\/)?[a-zA-Z2-7]{16,56}\.onion$/;

  const addCoordinator: () => void = () => {
    if (federation.coordinators[newAlias]) {
      setError(t('Alias already exists'));
    } else {
      if (onionUrlPattern.test(newUrl)) {
        let fullNewUrl = newUrl;
        if (!/^((http|https):\/\/)/.test(fullNewUrl)) {
          fullNewUrl = `http://${newUrl}`;
        }
        addNewCoordinator(newAlias, fullNewUrl);
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
        <Grid item>
          <SettingsForm />
        </Grid>
        <Grid item>
          <FederationTable maxHeight={18} />
        </Grid>
        <Grid item>
          <Typography align='center' component='h2' variant='subtitle2' color='secondary'>
            {error}
          </Typography>
        </Grid>
        <List>
          <ListItem>
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
          </ListItem>
        </List>
      </Grid>
    </Paper>
  );
};

export default SettingsPage;
