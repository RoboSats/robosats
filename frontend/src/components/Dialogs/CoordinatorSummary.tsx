import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogContent,
  Divider,
  Grid,
  List,
  ListItemText,
  ListItem,
  ListItemIcon,
  Typography,
  ListItemAvatar,
  IconButton,
  Tooltip,
  Link,
} from '@mui/material';

import InventoryIcon from '@mui/icons-material/Inventory';
import SellIcon from '@mui/icons-material/Sell';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PercentIcon from '@mui/icons-material/Percent';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import BookIcon from '@mui/icons-material/Book';
import LinkIcon from '@mui/icons-material/Link';

import { pn } from '../../utils';
import { Coordinator, Info } from '../../models';
import RobotAvatar from '../RobotAvatar';
import {
  Bolt,
  ContactSupport,
  Description,
  Dns,
  Email,
  Equalizer,
  GitHub,
  Language,
  Send,
  Tag,
  Twitter,
} from '@mui/icons-material';
import { AmbossIcon, BitcoinSignIcon, RoboSatsNoTextIcon } from '../Icons';

interface Props {
  open: boolean;
  onClose: () => void;
  coordinator: Coordinator | undefined;
  baseUrl: string;
}

interface ContactProps {
  email?: string;
  telegram?: string;
  twitter?: string;
  matrix?: string;
  website?: string;
}
const ContactButtons = ({
  email,
  telegram,
  twitter,
  matrix,
  website,
}: ContactProps): JSX.Element => {
  const { t } = useTranslation();
  const [showMatrix, setShowMatrix] = useState<boolean>(false);
  return (
    <Grid container direction='row' alignItems='center' justifyItems='space-between'>
      {email ? (
        <Grid item>
          <IconButton component='a' href={`mailto: ${email}`}>
            <Email />
          </IconButton>
        </Grid>
      ) : (
        <></>
      )}

      {telegram ? (
        <Grid item>
          <IconButton
            component='a'
            target='_blank'
            href={`https://t.me/${telegram}`}
            rel='noreferrer'
          >
            <Send />
          </IconButton>
        </Grid>
      ) : (
        <></>
      )}

      {twitter ? (
        <Grid item>
          <IconButton
            component='a'
            target='_blank'
            href={`https://twitter.com/${twitter}`}
            rel='noreferrer'
          >
            <Twitter />
          </IconButton>
        </Grid>
      ) : (
        <></>
      )}

      {website ? (
        <Grid item>
          <IconButton component='a' target='_blank' href={website} rel='noreferrer'>
            <Language />
          </IconButton>
        </Grid>
      ) : (
        <></>
      )}

      {matrix ? (
        <Grid item>
          <Tooltip
            title={<Typography variant='body2'>{`Matrix: ${matrix}`}</Typography>}
            open={showMatrix}
          >
            <IconButton
              onClick={() => {
                setShowMatrix(true);
                setTimeout(() => setShowMatrix(false), 10000);
              }}
            >
              <Tag />
            </IconButton>
          </Tooltip>
        </Grid>
      ) : (
        <></>
      )}
    </Grid>
  );
};

const CoordinatorSummaryDialog = ({
  open = false,
  onClose,
  coordinator,
  baseUrl,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  //   {
  //     "alias": "Inception",
  //     "avatar": "/static/federation/Inception.png",
  //     "enabled": true,
  //     "description": "RoboSats experimental coordinator",
  //     "coverLetter": "P2P FTW!",
  //     "contact": {
  //       "email": "robosats@protonmail.com",
  //       "telegram": "@robosats",
  //       "twitter": "@robosats",
  //       "matrix": "#robosats:matrix.org",
  //       "website": "learn.robosats.com"
  //     },
  //     "color": "#9C27B0",
  //     "mainnetOnion": "robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion",
  //     "mainnetClearnet": "unsafe.robosats.com",
  //     "testnetOnion": "robotestagw3dcxmd66r4rgksb4nmmr43fh77bzn2ia2eucduyeafnyd.onion",
  //     "testnetClearnet": "unsafe.testnet.robosats.com",
  //     "mainnetNodesPubkeys": ["0282eb467bc073833a039940392592bf10cf338a830ba4e392c1667d7697654c7e"],
  //     "testnetNodesPubkeys": ["03ecb271b3e2e36f2b91c92c65bab665e5165f8cdfdada1b5f46cfdd3248c87fd6"]
  //   }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <Typography component='h5' variant='h5'>
          {t('Coordinator Summary')}
        </Typography>

        <List dense>
          <ListItem sx={{ display: 'flex', justifyContent: 'center' }}>
            <ListItemAvatar>
              <RobotAvatar
                nickname={coordinator?.alias}
                coordinator={true}
                style={{ width: '3.215em', height: '3.215em' }}
                smooth={true}
                flipHorizontally={true}
                baseUrl={baseUrl}
              />
            </ListItemAvatar>

            <ListItemText
              sx={{ maxWidth: '8em' }}
              primary={<Typography variant='h5'>{coordinator?.alias}</Typography>}
            />
          </ListItem>

          <ListItem>
            <ListItemText
              primary={<ContactButtons {...coordinator?.contact} />}
              secondary={t('Contact')}
            />
          </ListItem>

          <Divider sx={{ borderColor: coordinator?.color }} />

          <ListItem>
            <ListItemIcon>
              <Description />
            </ListItemIcon>

            <ListItemText
              primary={`${coordinator?.description}. ${coordinator?.coverLetter}`}
              primaryTypographyProps={{ sx: { width: '25em' } }}
              secondary={t('Description and motto')}
            />
          </ListItem>
        </List>

        {coordinator?.info ? (
          <List dense>
            <Divider />

            <ListItem>
              <ListItemIcon>
                <InventoryIcon />
              </ListItemIcon>

              <ListItemText
                primary={coordinator?.info?.num_public_buy_orders}
                secondary={t('Public buy orders')}
              />
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemIcon>
                <SellIcon />
              </ListItemIcon>

              <ListItemText
                primary={coordinator?.info?.num_public_sell_orders}
                secondary={t('Public sell orders')}
              />
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemIcon>
                <BookIcon />
              </ListItemIcon>

              <ListItemText
                primary={`${pn(coordinator?.info?.book_liquidity)} Sats`}
                secondary={t('Book liquidity')}
              />
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemIcon>
                <SmartToyIcon />
              </ListItemIcon>

              <ListItemText
                primary={coordinator?.info?.active_robots_today}
                secondary={t('Today active robots')}
              />
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemIcon>
                <PriceChangeIcon />
              </ListItemIcon>

              <ListItemText
                primary={`${coordinator?.info?.last_day_nonkyc_btc_premium}%`}
                secondary={t('24h non-KYC bitcoin premium')}
              />
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemIcon>
                <PercentIcon />
              </ListItemIcon>

              <Grid container>
                <Grid item xs={6}>
                  <ListItemText secondary={t('Maker fee')}>
                    {(coordinator?.info?.maker_fee * 100).toFixed(3)}%
                  </ListItemText>
                </Grid>

                <Grid item xs={6}>
                  <ListItemText secondary={t('Taker fee')}>
                    {(coordinator?.info?.taker_fee * 100).toFixed(3)}%
                  </ListItemText>
                </Grid>
              </Grid>
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemIcon>
                <LinkIcon />
              </ListItemIcon>

              <ListItemText
                primary={`${coordinator?.info?.current_swap_fee_rate.toPrecision(3)}%`}
                secondary={t('Current onchain payout fee')}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <RoboSatsNoTextIcon
                  sx={{ width: '1.4em', height: '1.4em', right: '0.2em', position: 'relative' }}
                />
              </ListItemIcon>
              <ListItemText
                primary={`${t('Client')} ${coordinator?.info?.clientVersion} - ${t(
                  'Coordinator',
                )} ${coordinator?.info?.coordinatorVersion}`}
                secondary={t('RoboSats version')}
              />
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemIcon>
                <Bolt />
              </ListItemIcon>
              <ListItemText primary={coordinator?.info?.lnd_version} secondary={t('LND version')} />
            </ListItem>

            <Divider />

            {coordinator?.info?.network === 'testnet' ? (
              <ListItem>
                <ListItemIcon>
                  <Dns />
                </ListItemIcon>
                <ListItemText secondary={`${t('LN Node')}: ${coordinator?.info?.node_alias}`}>
                  <Link
                    target='_blank'
                    href={`https://1ml.com/testnet/node/${coordinator?.info?.node_id}`}
                    rel='noreferrer'
                  >
                    {`${coordinator?.info?.node_id.slice(0, 12)}... (1ML)`}
                  </Link>
                </ListItemText>
              </ListItem>
            ) : (
              <ListItem>
                <ListItemIcon>
                  <AmbossIcon />
                </ListItemIcon>
                <ListItemText secondary={coordinator?.info?.node_alias}>
                  <Link
                    target='_blank'
                    href={`https://amboss.space/node/${coordinator?.info?.node_id}`}
                    rel='noreferrer'
                  >
                    {`${coordinator?.info?.node_id.slice(0, 12)}... (AMBOSS)`}
                  </Link>
                </ListItemText>
              </ListItem>
            )}

            <Divider />

            <ListItem>
              <ListItemIcon>
                <GitHub />
              </ListItemIcon>
              <ListItemText secondary={t('Coordinator commit hash')}>
                <Link
                  target='_blank'
                  href={`https://github.com/Reckless-Satoshi/robosats/tree/${coordinator?.info?.robosats_running_commit_hash}`}
                  rel='noreferrer'
                >
                  {`${coordinator?.info?.robosats_running_commit_hash.slice(0, 12)}...`}
                </Link>
              </ListItemText>
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemIcon>
                <Equalizer />
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
                  {pn(coordinator?.info?.last_day_volume)}
                  <BitcoinSignIcon sx={{ width: 14, height: 14 }} color={'text.secondary'} />
                </div>
              </ListItemText>
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemIcon>
                <Equalizer />
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
                  {pn(coordinator?.info?.lifetime_volume)}
                  <BitcoinSignIcon sx={{ width: 14, height: 14 }} color={'text.secondary'} />
                </div>
              </ListItemText>
            </ListItem>
          </List>
        ) : (
          <Typography color='error'>{t('Not online')}</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CoordinatorSummaryDialog;
