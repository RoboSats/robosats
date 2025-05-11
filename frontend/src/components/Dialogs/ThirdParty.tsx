import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogContent,
  Grid,
  List,
  ListItemText,
  ListItem,
  ListItemIcon,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';

import { Reddit, Description, Email, Language, Send, Tag } from '@mui/icons-material';
import { type Contact } from '../../models';
import RobotAvatar from '../RobotAvatar';
import { NostrIcon, SimplexIcon, XIcon } from '../Icons';
import { systemClient } from '../../services/System';
import type Coordinator from '../../models/Coordinator.model';
import { type UseFederationStoreType, FederationContext } from '../../contexts/FederationContext';
import thirdParties from '../../../static/thirdparties.json';

interface Props {
  open: boolean;
  onClose: () => void;
  shortAlias: string;
}

const ContactButtons = ({
  nostr,
  email,
  telegram,
  twitter,
  matrix,
  simplex,
  website,
  reddit,
}: Contact): React.JSX.Element => {
  const { t } = useTranslation();
  const [showMatrix, setShowMatrix] = useState<boolean>(false);
  const [showNostr, setShowNostr] = useState<boolean>(false);
  const [client] = window.RobosatsSettings.split('-');

  return (
    <Grid container direction='row' alignItems='center' justifyContent='center'>
      {nostr && (
        <Grid item>
          <Tooltip
            title={
              <div>
                <Typography variant='body2'>
                  {t('...Opening on Nostr gateway. Pubkey copied!')}
                </Typography>
                <Typography variant='body2'>
                  <i>{nostr}</i>
                </Typography>
              </div>
            }
            open={showNostr}
          >
            <IconButton
              onClick={() => {
                setShowNostr(true);
                setTimeout(() => {
                  if (client === 'mobile') {
                    window.location.href = `nostr:${nostr}`;
                  } else {
                    window.open(`https://njump.me/${nostr}`, '_blank', 'noopener,noreferrer');
                  }
                }, 1500);
                setTimeout(() => {
                  setShowNostr(false);
                }, 10000);
                systemClient.copyToClipboard(nostr);
              }}
            >
              <NostrIcon />
            </IconButton>
          </Tooltip>
        </Grid>
      )}

      {email && (
        <Grid item>
          <Tooltip enterTouchDelay={0} enterNextDelay={2000} title={t('Send Email')}>
            <IconButton component='a' href={`mailto: ${email}`}>
              <Email />
            </IconButton>
          </Tooltip>
        </Grid>
      )}

      {telegram && (
        <Grid item>
          <Tooltip enterTouchDelay={0} enterNextDelay={2000} title={t('Telegram')}>
            <IconButton
              component='a'
              target='_blank'
              href={`https://t.me/${telegram}`}
              rel='noreferrer'
            >
              <Send />
            </IconButton>
          </Tooltip>
        </Grid>
      )}

      {twitter && (
        <Grid item>
          <Tooltip enterTouchDelay={0} enterNextDelay={2000} title={t('X')}>
            <IconButton
              component='a'
              target='_blank'
              href={`https://x.com/${twitter}`}
              rel='noreferrer'
            >
              <XIcon sx={{ width: '0.8em', height: '0.8em' }} />
            </IconButton>
          </Tooltip>
        </Grid>
      )}

      {reddit && (
        <Grid item>
          <Tooltip enterTouchDelay={0} enterNextDelay={2000} title={t('Reddit')}>
            <IconButton
              component='a'
              target='_blank'
              href={`https://reddit.com/${reddit}`}
              rel='noreferrer'
            >
              <Reddit />
            </IconButton>
          </Tooltip>
        </Grid>
      )}

      {website && (
        <Grid item>
          <Tooltip enterTouchDelay={0} enterNextDelay={2000} title={t('Website')}>
            <IconButton component='a' target='_blank' href={website} rel='noreferrer'>
              <Language />
            </IconButton>
          </Tooltip>
        </Grid>
      )}

      {matrix && (
        <Grid item>
          <Tooltip
            title={
              <Typography variant='body2'>
                {t('Matrix channel copied! {{matrix}}', { matrix })}
              </Typography>
            }
            open={showMatrix}
          >
            <IconButton
              onClick={() => {
                setShowMatrix(true);
                setTimeout(() => {
                  setShowMatrix(false);
                }, 10000);
                systemClient.copyToClipboard(matrix);
              }}
            >
              <Tag />
            </IconButton>
          </Tooltip>
        </Grid>
      )}

      {simplex && (
        <Grid item>
          <Tooltip enterTouchDelay={0} enterNextDelay={2000} title={t('Simplex')}>
            <IconButton component='a' target='_blank' href={`${simplex}`} rel='noreferrer'>
              <SimplexIcon sx={{ width: '0.7em', height: '0.7em' }} />
            </IconButton>
          </Tooltip>
        </Grid>
      )}
    </Grid>
  );
};

const ThirdPartyDialog = ({ open = false, onClose, shortAlias }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const [thirdParty, setThirdParty] = useState<Coordinator>(thirdParties[shortAlias]);

  useEffect(() => {
    setThirdParty(thirdParties[shortAlias]);
  }, [shortAlias]);

  useEffect(() => {
    if (open) federation.getCoordinator(shortAlias ?? '')?.loadInfo();
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent style={{ width: 600 }}>
        <Typography align='center' component='h5' variant='h5'>
          {String(thirdParty?.longAlias)}
        </Typography>
        <List dense>
          <ListItem sx={{ display: 'flex', justifyContent: 'center' }}>
            <Grid container direction='column' alignItems='center' padding={0}>
              <Grid item>
                <RobotAvatar
                  shortAlias={thirdParty?.shortAlias}
                  style={{ width: '7.5em', height: '7.5em' }}
                  smooth={true}
                />
              </Grid>
              <Grid item>
                <ContactButtons {...thirdParty?.contact} />
              </Grid>
            </Grid>
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Description />
            </ListItemIcon>

            <ListItemText
              primary={thirdParty?.description}
              secondary={t('Third party description')}
            />
          </ListItem>
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default ThirdPartyDialog;
