import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogTitle, DialogContent, Grid, Box, Typography } from '@mui/material';
import { useTheme } from '@mui/system';

interface Props {
  open: boolean;
  onClose: () => void;
}

const LandingDialog = ({ open, onClose }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Dialog fullWidth maxWidth={'md'} open={open} onClose={onClose}>
      <DialogTitle>{t('A robot technician has arrived!')}</DialogTitle>

      <DialogContent sx={{ height: '30em' }}>
        <Grid container sx={{ width: '100%', height: '100%' }}>
          <Grid item xs={6} sx={{ padding: '1em', width: '100%', height: '100%' }}>
            <Box
              sx={{
                width: '100%',
                height: '100%',
                backgroundColor: theme.palette.background.paper,
                textAlign: 'center',
                alignItems: 'center',
                display: 'flex',
                border: '1px dotted',
              }}
            >
              <Typography variant='body1'>
                {t(
                  'My first time here. Generate a new Robot Garage and extended robot token (xToken).',
                )}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sx={{ padding: '1em', width: '100%', height: '100%' }}>
            <Box
              sx={{
                width: '100%',
                height: '100%',
                backgroundColor: theme.palette.background.paper,
                textAlign: 'center',
                alignItems: 'center',
                display: 'flex',
                border: '1px dotted',
              }}
            >
              <Typography variant='body1'>
                {t('I bring my own robots, here they are. (Drag and drop workspace.json)')}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default LandingDialog;
