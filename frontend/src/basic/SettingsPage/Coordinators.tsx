import React, { useState } from 'react';
import { Button, Dialog, DialogContent, Grid, Typography } from '@mui/material';
import FederationTable from '../../components/FederationTable';
import { t } from 'i18next';

const Coordinators = (): React.JSX.Element => {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '0.5em' }}>
      <Button
        onClick={() => {
          setOpen(true);
        }}
        color='primary'
        variant='contained'
      >
        {t('Coordinators')}
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        aria-labelledby='recovery-dialog-title'
        aria-describedby='recovery-description'
        fullWidth
        maxWidth='md'
      >
        <DialogContent>
          <Grid
            container
            sx={{ alignItems: 'center', flexDirection: 'column', padding: 2, gap: 1 }}
          >
            <Grid>
              <Typography variant='h5' align='center'>
                {t('Coordinators')}
              </Typography>
            </Grid>
            <Grid size={12}>
              <FederationTable fillContainer showTitle={false} />
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Coordinators;
