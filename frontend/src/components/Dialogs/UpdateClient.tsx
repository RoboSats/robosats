import React from 'react';
import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  List,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Typography,
} from '@mui/material';

import WebIcon from '@mui/icons-material/Web';
import AndroidIcon from '@mui/icons-material/Android';
import UpcomingIcon from '@mui/icons-material/Upcoming';

interface Props {
  open: boolean;
  clientVersion: string;
  coordinatorVersion: string;
  onClose: () => void;
}

const UpdateClientDialog = ({
  open = false,
  clientVersion,
  coordinatorVersion,
  onClose,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <Typography component='h5' variant='h5'>
          {t('Update your RoboSats client')}
        </Typography>

        <br />

        <Typography>
          {t(
            'The RoboSats coordinator is on version {{coordinatorVersion}}, but your client app is {{clientVersion}}. This version mismatch might lead to a bad user experience.',
            { coordinatorVersion, clientVersion },
          )}
        </Typography>

        <List dense>
          <ListItemButton
            component='a'
            target='_blank'
            href={`https://github.com/Reckless-Satoshi/robosats/releases/tag/${coordinatorVersion}-alpha`}
            rel='noreferrer'
          >
            <ListItemIcon>
              <AndroidIcon color='primary' sx={{ height: 32, width: 32 }} />
            </ListItemIcon>

            <ListItemText
              secondary={t('Download RoboSats {{coordinatorVersion}} APK from Github releases', {
                coordinatorVersion,
              })}
              primary={t('On Android RoboSats app ')}
            />
          </ListItemButton>

          <Divider />

          <ListItemButton
            component='a'
            target='_blank'
            href={`https://hub.docker.com/r/recksato/robosats-client`}
            rel='noreferrer'
          >
            <ListItemIcon>
              <UpcomingIcon color='primary' sx={{ height: 32, width: 32 }} />
            </ListItemIcon>

            <ListItemText
              secondary={t("Check your node's store or update the Docker image yourself")}
              primary={t('On your own soverign node')}
            />
          </ListItemButton>

          <Divider />

          <ListItemButton component='a' onClick={() => location.reload(true)}>
            <ListItemIcon>
              <WebIcon color='primary' sx={{ height: 32, width: 32 }} />
            </ListItemIcon>

            <ListItemText
              secondary={t(
                'On Tor Browser client simply refresh your tab (click here or press Ctrl+Shift+R)',
              )}
              primary={t('On remotely served browser client')}
            />
          </ListItemButton>

          <DialogActions>
            <Button onClick={onClose}>{t('Go away!')}</Button>
          </DialogActions>
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateClientDialog;
