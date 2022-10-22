import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogTitle, DialogContent, Grid, Box } from '@mui/material';
import { useTheme } from '@mui/system';

interface Props {
  open: boolean;
  onClose: () => void;
}

const LandingDialog = ({ open, onClose }: Props): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Dialog fullWidth maxWidth={'md'} open={open} onClose={onClose}>
      <DialogTitle>{t('Oh... a robot technician has arrived...')}</DialogTitle>

      <DialogContent sx={{ height: '30em' }}>
        <Grid container sx={{ width: '100%', height: '100%' }}>
          <Grid item xs={6} sx={{ padding: '1em', width: '100%', height: '100%' }}>
            <Box
              sx={{
                width: '100%',
                height: '100%',
                backgroundColor: theme.palette.background.paper,
                justifyContent: 'center',
                alignContent: 'center',
              }}
            >
              {t('Indeed, but it is my first time. Generate a new workspace and extended token.')}
            </Box>
          </Grid>
          <Grid item xs={6} sx={{ padding: '1em', width: '100%', height: '100%' }}>
            <Box
              sx={{
                width: '100%',
                height: '100%',
                backgroundColor: theme.palette.background.paper,
                justifyContent: 'center',
                alignContent: 'center',
              }}
            >
              {t('Yup, here are my robots. Drag and drop workspace.json')}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default LandingDialog;
