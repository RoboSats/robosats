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
  ContactSupport,
  Description,
  Email,
  Language,
  Send,
  Tag,
  Twitter,
} from '@mui/icons-material';

interface Props {
  open: boolean;
  onClose: () => void;
  info: Info;
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
          <ListItem>
            <ListItemAvatar sx={{ position: 'relative', right: '1em' }}>
              <RobotAvatar
                nickname={coordinator?.alias}
                coordinator={true}
                style={{ width: '3.215em', height: '3.215em' }}
                smooth={true}
                flipHorizontally={true}
                baseUrl={baseUrl}
              />
            </ListItemAvatar>

            <ListItemText primary={coordinator?.alias} secondary={t('Alias')} />
          </ListItem>

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

          <Divider />

          <ListItem>
            <ListItemIcon>
              <BookIcon />
            </ListItemIcon>

            <ListItemText primary={'a'} secondary={t('Book liquidity')} />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <PriceChangeIcon />
            </ListItemIcon>

            <ListItemText
              primaryTypographyProps={{ fontSize: '14px' }}
              secondaryTypographyProps={{ fontSize: '12px' }}
              primary={`${info.last_day_nonkyc_btc_premium}%`}
              secondary={t('Last 24h mean premium')}
            />
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <PercentIcon />
            </ListItemIcon>

            <Grid container>
              <Grid item xs={6}>
                <ListItemText
                  primaryTypographyProps={{ fontSize: '14px' }}
                  secondaryTypographyProps={{ fontSize: '12px' }}
                  secondary={t('Maker fee')}
                >
                  {(info.maker_fee * 100).toFixed(3)}%
                </ListItemText>
              </Grid>

              <Grid item xs={6}>
                <ListItemText
                  primaryTypographyProps={{ fontSize: '14px' }}
                  secondaryTypographyProps={{ fontSize: '12px' }}
                  secondary={t('Taker fee')}
                >
                  {(info.taker_fee * 100).toFixed(3)}%
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
              primary={<ContactButtons {...coordinator?.contact} />}
              secondary={t('Contact')}
            />
          </ListItem>
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default CoordinatorSummaryDialog;
