import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  List,
  ListItemText,
  ListItem,
  ListItemIcon,
  ListItemButton,
  Tooltip,
  Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import GitHubIcon from '@mui/icons-material/GitHub';
import RedditIcon from '@mui/icons-material/Reddit';
import Flags from 'country-flag-icons/react/3x2';
import { NostrIcon, SimplexIcon } from '../Icons';

interface Props {
  open: boolean;
  onClose: () => void;
}

const CommunityDialog = ({ open = false, onClose }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const [client] = window.RobosatsSettings.split('-');

  const flagProps = {
    width: 30,
    height: 30,
    opacity: 0.85,
    style: {
      filter: 'drop-shadow(2px 2px 2px #444444)',
    },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby='community-dialog-title'
      aria-describedby='community-description'
    >
      <DialogContent>
        <Typography component='h5' variant='h5'>
          {t('Community')}
        </Typography>

        <Typography component='div' variant='body2'>
          <p>
            {t(
              'Support is only offered via SimpleX. Join our community if you have questions or want to hang out with other cool robots. Please, use our Github Issues if you find a bug or want to see new features!',
            )}
          </p>
        </Typography>

        <List dense>
          <Divider />

          <ListItemButton
            component='a'
            target='_blank'
            href='https://simplex.chat/contact#/?v=1-2&smp=smp%3A%2F%2F0YuTwO05YJWS8rkjn9eLJDjQhFKvIYd8d4xG8X1blIU%3D%40smp8.simplex.im%2FyEX_vdhWew_FkovCQC3mRYRWZB1j_cBq%23%2F%3Fv%3D1-2%26dh%3DMCowBQYDK2VuAyEAnrf9Jw3Ajdp4EQw71kqA64VgsIIzw8YNn68WjF09jFY%253D%26srv%3Dbeccx4yfxxbvyhqypaavemqurytl6hozr47wfc7uuecacjqdvwpw2xid.onion&data=%7B%22type%22%3A%22group%22%2C%22groupLinkId%22%3A%22hWnMVPnJl-KT3-virDk0JA%3D%3D%22%7D'
            rel='noreferrer'
          >
            <ListItemIcon>
              <SimplexIcon color='primary' sx={{ height: 32, width: 32 }} />
            </ListItemIcon>

            <ListItemText
              primary={t('Join RoboSats SimpleX group')}
              secondary={t('RoboSats main public support')}
            />
          </ListItemButton>

          <Divider />

          <ListItemButton
            component='a'
            onClick={() => {
              if (client === 'mobile') {
                window.location.href =
                  'nostr:npub1p2psats79rypr8lpnl9t5qdekfp700x660qsgw284xvq4s09lqrqqk3m82';
              } else {
                window.open(
                  'https://njump.me/npub1p2psats79rypr8lpnl9t5qdekfp700x660qsgw284xvq4s09lqrqqk3m82',
                  '_blank',
                  'noopener,noreferrer',
                );
              }
            }}
          >
            <ListItemIcon>
              <NostrIcon color='primary' sx={{ height: 32, width: 32 }} />
            </ListItemIcon>

            <ListItemText
              primary={t('Follow RoboSats in Nostr')}
              secondary={t('Nostr Official Account')}
            />
          </ListItemButton>

          <Divider />

          <ListItemButton
            component='a'
            target='_blank'
            href='https://github.com/RoboSats/robosats/issues'
            rel='noreferrer'
          >
            <ListItemIcon>
              <GitHubIcon color='primary' sx={{ height: 32, width: 32 }} />
            </ListItemIcon>

            <ListItemText
              primary={t('Tell us about a new feature or a bug')}
              secondary={t('Github Issues - The Robotic Satoshis Open Source Project')}
            />
          </ListItemButton>

          <Divider />

          <ListItemButton
            component='a'
            target='_blank'
            href='https://reddit.com/r/robosats'
            rel='noreferrer'
          >
            <ListItemIcon>
              <RedditIcon color='primary' sx={{ height: 35, width: 35 }} />
            </ListItemIcon>

            <ListItemText
              primary={t("Join RoboSats' Subreddit")}
              secondary={t('RoboSats in Reddit')}
            />
          </ListItemButton>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <SendIcon color='primary' sx={{ height: 32, width: 32 }} />
            </ListItemIcon>

            <ListItemText secondary={t('We are abandoning Telegram! Our old TG groups')}>
              <Tooltip title={t('Join RoboSats Spanish speaking community!')}>
                <IconButton
                  component='a'
                  target='_blank'
                  href='https://t.me/robosats_es'
                  rel='noreferrer'
                >
                  <Flags.ES {...flagProps} />
                </IconButton>
              </Tooltip>

              <Tooltip title={t('Join RoboSats English speaking community!')}>
                <IconButton
                  component='a'
                  target='_blank'
                  href='https://t.me/robosats'
                  rel='noreferrer'
                >
                  <Flags.US {...flagProps} />
                </IconButton>
              </Tooltip>
            </ListItemText>
          </ListItem>
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default CommunityDialog;
