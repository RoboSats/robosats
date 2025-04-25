import React, { useContext, useState } from 'react';
import { Button, Dialog, DialogContent, Grid, TextField, Typography } from '@mui/material';
import FederationTable from '../../components/FederationTable';
import { t } from 'i18next';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';

const Coordinators = (): JSX.Element => {
  const { federation, addNewCoordinator } = useContext<UseFederationStoreType>(FederationContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const [newAlias, setNewAlias] = useState<string>('');
  const [newUrl, setNewUrl] = useState<string>('');
  const [error, setError] = useState<string>();
  const [open, setOpen] = useState<boolean>(false);
  // Regular expression to match a valid .onion URL
  const onionUrlPattern = /^((http|https):\/\/)?[a-zA-Z2-7]{16,56}\.onion$\/?/;

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
    <Grid item xs={12}>
      <Grid container direction='column' justifyItems='center' alignItems='center'>
        <Grid item>
          <Button
            onClick={() => {
              setOpen(true);
            }}
            color='primary'
            variant='contained'
          >
            {t('Coordinators')}
          </Button>
        </Grid>
      </Grid>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        aria-labelledby='recovery-dialog-title'
        aria-describedby='recovery-description'
      >
        <DialogContent>
          <Grid container direction='column' alignItems='center' spacing={1} padding={2}>
            <Grid item>
              <Typography variant='h5' align='center'>
                {t('Coordinators')}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FederationTable fillContainer />
            </Grid>
            {error ?? (
              <Grid item xs={12}>
                <Typography align='center' component='h2' variant='subtitle2' color='secondary'>
                  {error}
                </Typography>
              </Grid>
            )}
            <Grid item xs={12}>
              <Grid container direction='row' alignItems='center' spacing={1} padding={2}>
                <Grid item xs={4}>
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
                </Grid>
                <Grid item xs={6}>
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
                </Grid>
                <Grid item xs={1}>
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
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </Grid>
  );
};

export default Coordinators;
