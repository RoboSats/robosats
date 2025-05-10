import React, { useEffect, useState } from 'react';
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
import { checkVer } from '../../utils';
import { type Version } from '../../models';

interface Props {
  coordinatorVersion: Version;
  clientVersion: Version;
  onClose: () => void;
}

const UpdateDialog = ({ coordinatorVersion, clientVersion }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const [open, setOpen] = useState<boolean>(() => checkVer(coordinatorVersion));
  const coordinatorString = `v${coordinatorVersion.major}-${coordinatorVersion.minor}-${coordinatorVersion.patch}`;
  const clientString = `v${clientVersion.major}-${clientVersion.minor}-${clientVersion.patch}`;

  useEffect(() => {
    setOpen(checkVer(coordinatorVersion));
  }, [coordinatorVersion]);

  return (
    <Dialog
      open={open}
      onClose={() => {
        setOpen(false);
      }}
    >
      <DialogContent>
        <Typography component='h5' variant='h5'>
          {t('Update your RoboSats client')}
        </Typography>

        <br />

        <Typography>
          {t(
            'The RoboSats coordinator is on version {{coordinatorString}}, but your client app is {{clientString}}. This version mismatch might lead to a bad user experience.',
            { coordinatorString, clientString },
          )}
        </Typography>

        <List dense>
          <ListItemButton
            component='a'
            target='_blank'
            href={`https://github.com/RoboSats/robosats/releases/tag/${coordinatorString}-alpha`}
            rel='noreferrer'
          >
            <ListItemIcon>
              <AndroidIcon color='primary' sx={{ height: 32, width: 32 }} />
            </ListItemIcon>

            <ListItemText
              secondary={t('Download RoboSats {{coordinatorString}} APK from Github releases', {
                coordinatorString,
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

          <ListItemButton
            component='a'
            onClick={() => {
              location.reload(true);
            }}
          >
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
            <Button
              onClick={() => {
                setOpen(false);
              }}
            >
              {t('Go away!')}
            </Button>
          </DialogActions>
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateDialog;
