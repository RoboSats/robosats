import React from 'react';
import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogContent,
  Divider,
  Link,
  List,
  ListItemText,
  ListItem,
  ListItemIcon,
  Typography,
} from '@mui/material';

import BoltIcon from '@mui/icons-material/Bolt';
import PublicIcon from '@mui/icons-material/Public';
import DnsIcon from '@mui/icons-material/Dns';
import WebIcon from '@mui/icons-material/Web';
import FavoriteIcon from '@mui/icons-material/Favorite';
import GitHubIcon from '@mui/icons-material/GitHub';
import EqualizerIcon from '@mui/icons-material/Equalizer';

import { AmbossIcon, BitcoinSignIcon } from '../Icons';

import { pn } from '../../utils/prettyNumbers';

interface Props {
  isOpen: boolean;
  handleClickCloseStatsForNerds: () => void;
  lndVersion: string;
  network: string;
  nodeAlias: string;
  nodeId: string;
  alternativeName: string;
  alternativeSite: string;
  robosatsRunningCommitHash: string;
  lastDayVolume: number;
  lifetimeVolume: number;
}

const StatsDialog = ({
  isOpen,
  handleClickCloseStatsForNerds,
  lndVersion,
  network,
  nodeAlias,
  nodeId,
  alternativeName,
  alternativeSite,
  robosatsRunningCommitHash,
  lastDayVolume,
  lifetimeVolume,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={isOpen}
      onClose={handleClickCloseStatsForNerds}
      aria-labelledby='stats-for-nerds-dialog-title'
      aria-describedby='stats-for-nerds-description'
    >
      <DialogContent>
        <Typography component='h5' variant='h5'>
          {t('Stats For Nerds')}
        </Typography>

        <List dense>
          <Divider />

          <ListItem>
            <ListItemIcon>
              <BoltIcon />
            </ListItemIcon>
            <ListItemText primary={lndVersion} secondary={t('LND version')} />
          </ListItem>

          <Divider />

          {network === 'testnet' ? (
            <ListItem>
              <ListItemIcon>
                <DnsIcon />
              </ListItemIcon>
              <ListItemText secondary={nodeAlias}>
                <Link
                  target='_blank'
                  href={`https://1ml.com/testnet/node/${nodeId}`}
                  rel='noreferrer'
                >
                  {`${nodeId.slice(0, 12)}... (1ML)`}
                </Link>
              </ListItemText>
            </ListItem>
          ) : (
            <ListItem>
              <ListItemIcon>
                <AmbossIcon />
              </ListItemIcon>
              <ListItemText secondary={nodeAlias}>
                <Link target='_blank' href={`https://amboss.space/node/${nodeId}`} rel='noreferrer'>
                  {`${nodeId.slice(0, 12)}... (AMBOSS)`}
                </Link>
              </ListItemText>
            </ListItem>
          )}

          <Divider />

          <ListItem>
            <ListItemIcon>
              <WebIcon />
            </ListItemIcon>
            <ListItemText secondary={alternativeName}>
              <Link target='_blank' href={`http://${alternativeSite}`} rel='noreferrer'>
                {`${alternativeSite.slice(0, 12)}...onion`}
              </Link>
            </ListItemText>
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <GitHubIcon />
            </ListItemIcon>
            <ListItemText secondary={t('Currently running commit hash')}>
              <Link
                target='_blank'
                href={`https://github.com/Reckless-Satoshi/robosats/tree/${robosatsRunningCommitHash}`}
                rel='noreferrer'
              >
                {`${robosatsRunningCommitHash.slice(0, 12)}...`}
              </Link>
            </ListItemText>
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <EqualizerIcon />
            </ListItemIcon>
            <ListItemText secondary={t('24h contracted volume')}>
              <div
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                {pn(lastDayVolume)}
                <BitcoinSignIcon sx={{ width: 14, height: 14 }} color={'text.secondary'} />
              </div>
            </ListItemText>
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <EqualizerIcon />
            </ListItemIcon>
            <ListItemText secondary={t('Lifetime contracted volume')}>
              <div
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                {pn(lifetimeVolume)}
                <BitcoinSignIcon sx={{ width: 14, height: 14 }} color={'text.secondary'} />
              </div>
            </ListItemText>
          </ListItem>

          <Divider />
          <ListItem>
            <ListItemIcon>
              <PublicIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'left',
                    flexWrap: 'wrap',
                  }}
                >
                  <span>{`${t('Made with')} `}</span>
                  <FavoriteIcon sx={{ color: '#ff0000', height: '22px', width: '22px' }} />
                  <span>{` ${t('and')} `}</span>
                  <BoltIcon sx={{ color: '#fcba03', height: '23px', width: '23px' }} />
                </div>
              }
              secondary={t('... somewhere on Earth!')}
            />
          </ListItem>
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default StatsDialog;
