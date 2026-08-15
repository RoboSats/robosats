import React, { useState } from 'react';
import { Button, Dialog, DialogContent, Grid, Typography } from '@mui/material';
import FederationTable from '../../components/FederationTable';
import { t } from 'i18next';

const Coordinators = (): React.JSX.Element => {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Grid item xs={12}>
      <Grid
        container
        sx={{ alignItems: 'center', justifyItems: 'center', flexDirection: 'column' }}
      >
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
        fullWidth
      >
        <DialogContent>
          <Grid
            container
            spacing={1}
            sx={{ alignItems: 'center', flexDirection: 'column', padding: 2 }}
          >
            <Grid item>
              <Typography variant='h5' align='center'>
                {t('Coordinators')}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FederationTable fillContainer showTitle={false} />
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </Grid>
  );
};

export default Coordinators;
