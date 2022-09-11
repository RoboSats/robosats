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
import TwitterIcon from '@mui/icons-material/Twitter';
import RedditIcon from '@mui/icons-material/Reddit';
import Flags from 'country-flag-icons/react/3x2';

interface Props {
  isOpen: boolean;
  handleClickCloseCommunity: () => void;
}

const CommunityDialog = ({ isOpen, handleClickCloseCommunity }: Props): JSX.Element => {
  const { t } = useTranslation();

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
      open={isOpen}
      onClose={handleClickCloseCommunity}
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
              'Support is only offered via public channels. Join our Telegram community if you have questions or want to hang out with other cool robots. Please, use our Github Issues if you find a bug or want to see new features!',
            )}
          </p>
        </Typography>

        <List dense>
          <Divider />

          <ListItemButton
            component='a'
            target='_blank'
            href='https://twitter.com/robosats'
            rel='noreferrer'
          >
            <ListItemIcon>
              <TwitterIcon color='primary' sx={{ height: 32, width: 32 }} />
            </ListItemIcon>

            <ListItemText
              primary={t('Follow RoboSats in Twitter')}
              secondary={t('Twitter Official Account')}
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

            <ListItemText secondary={t('RoboSats Telegram Communities')}>
              <Tooltip title={t('Join RoboSats Spanish speaking community!') || ''}>
                <IconButton
                  component='a'
                  target='_blank'
                  href='https://t.me/robosats_es'
                  rel='noreferrer'
                >
                  <Flags.ES {...flagProps} />
                </IconButton>
              </Tooltip>

              <Tooltip title={t('Join RoboSats Russian speaking community!') || ''}>
                <IconButton
                  component='a'
                  target='_blank'
                  href='https://t.me/robosats_ru'
                  rel='noreferrer'
                >
                  <Flags.RU {...flagProps} />
                </IconButton>
              </Tooltip>

              <Tooltip title={t('Join RoboSats Chinese speaking community!') || ''}>
                <IconButton
                  component='a'
                  target='_blank'
                  href='https://t.me/robosats_cn'
                  rel='noreferrer'
                >
                  <Flags.CN {...flagProps} />
                </IconButton>
              </Tooltip>

              <Tooltip title={t('Join RoboSats English speaking community!') || ''}>
                <IconButton
                  component='a'
                  target='_blank'
                  href='https://t.me/robosats'
                  rel='noreferrer'
                >
                  <Flags.US {...flagProps} />
                </IconButton>
              </Tooltip>

              <Tooltip title={t('Join RoboSats Portuguese speaking community!') || ''}>
                <IconButton
                  component='a'
                  target='_blank'
                  href='https://t.me/robosats_pt'
                  rel='noreferrer'
                >
                  <Flags.BR {...flagProps} />
                </IconButton>
              </Tooltip>
            </ListItemText>
          </ListItem>

          <Divider />

          <ListItemButton
            component='a'
            target='_blank'
            href='https://github.com/Reckless-Satoshi/robosats/issues'
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
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default CommunityDialog;
