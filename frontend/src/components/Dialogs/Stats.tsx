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
  LinearProgress,
} from '@mui/material';

import BoltIcon from '@mui/icons-material/Bolt';
import PublicIcon from '@mui/icons-material/Public';
import DnsIcon from '@mui/icons-material/Dns';
import WebIcon from '@mui/icons-material/Web';
import FavoriteIcon from '@mui/icons-material/Favorite';
import GitHubIcon from '@mui/icons-material/GitHub';
import EqualizerIcon from '@mui/icons-material/Equalizer';

import { AmbossIcon, BitcoinSignIcon, RoboSatsNoTextIcon } from '../Icons';

import { pn } from '../../utils';
import { type Info } from '../../models';

interface Props {
  open: boolean;
  onClose: () => void;
  info: Info;
}

const StatsDialog = ({ open = false, onClose, info }: Props): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose}>
      <div style={info.loading ? {} : { display: 'none' }}>
        <LinearProgress />
      </div>

      <DialogContent>
        <Typography component='h5' variant='h5'>
          {t('Stats For Nerds')}
        </Typography>

        <List dense>
          <Divider />

          <ListItem>
            <ListItemIcon>
              <RoboSatsNoTextIcon
                sx={{ width: '1.4em', height: '1.4em', right: '0.2em', position: 'relative' }}
              />
            </ListItemIcon>
            <ListItemText
              primary={`${t('Client')} ${info.clientVersion} - ${t('Coordinator')} ${
                info.coordinatorVersion
              }`}
              secondary={t('RoboSats version')}
            />
          </ListItem>

          <Divider />

          {info.lnd_version ? (
            <ListItem>
              <ListItemIcon>
                <BoltIcon />
              </ListItemIcon>
              <ListItemText primary={info.lnd_version} secondary={t('LND version')} />
            </ListItem>
          ) : null}

          {info.cln_version ? (
            <ListItem>
              <ListItemIcon>
                <BoltIcon />
              </ListItemIcon>
              <ListItemText primary={info.cln_version} secondary={t('CLN version')} />
            </ListItem>
          ) : null}

          <Divider />

          {info.network === 'testnet' ? (
            <ListItem>
              <ListItemIcon>
                <DnsIcon />
              </ListItemIcon>
              <ListItemText secondary={`${t('LN Node')}: ${info.node_alias}`}>
                <Link
                  target='_blank'
                  href={`https://1ml.com/testnet/node/${info.node_id}`}
                  rel='noreferrer'
                >
                  {`${info.node_id.slice(0, 12)}... (1ML)`}
                </Link>
              </ListItemText>
            </ListItem>
          ) : (
            <ListItem>
              <ListItemIcon>
                <AmbossIcon />
              </ListItemIcon>
              <ListItemText secondary={info.node_alias}>
                <Link
                  target='_blank'
                  href={`https://amboss.space/node/${info.node_id}`}
                  rel='noreferrer'
                >
                  {`${info.node_id.slice(0, 12)}... (AMBOSS)`}
                </Link>
              </ListItemText>
            </ListItem>
          )}

          <Divider />

          <ListItem>
            <ListItemIcon>
              <WebIcon />
            </ListItemIcon>
            <ListItemText secondary={info.alternative_name}>
              <Link target='_blank' href={`http://${info.alternative_site}`} rel='noreferrer'>
                {`${info.alternative_site.slice(0, 12)}...onion`}
              </Link>
            </ListItemText>
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <GitHubIcon />
            </ListItemIcon>
            <ListItemText secondary={t('Coordinator commit hash')}>
              <Link
                target='_blank'
                href={`https://github.com/RoboSats/robosats/tree/${info.robosats_running_commit_hash}`}
                rel='noreferrer'
              >
                {`${info.robosats_running_commit_hash.slice(0, 12)}...`}
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
                {pn(info.last_day_volume)}
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
                {pn(info.lifetime_volume)}
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
