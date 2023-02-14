import React, { useContext, useState } from 'react';
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
  IconButton,
  Tooltip,
  Link,
  Box,
  CircularProgress,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
} from '@mui/material';

import {
  Inventory,
  Sell,
  SmartToy,
  Percent,
  PriceChange,
  Book,
  Reddit,
  Security,
  NoStrollerOutlined,
  Spoke,
  WorkspacePremium,
} from '@mui/icons-material';
import LinkIcon from '@mui/icons-material/Link';

import { pn } from '../../utils';
import { Contact, Coordinator } from '../../models';
import RobotAvatar from '../RobotAvatar';
import {
  Bolt,
  Description,
  Dns,
  Email,
  Equalizer,
  ExpandMore,
  GitHub,
  Language,
  Send,
  Tag,
  Twitter,
} from '@mui/icons-material';
import { AmbossIcon, BitcoinSignIcon, RoboSatsNoTextIcon } from '../Icons';
import { AppContext, AppContextProps } from '../../contexts/AppContext';
import { systemClient } from '../../services/System';

interface Props {
  open: boolean;
  onClose: () => void;
  coordinator: Coordinator | undefined;
  network: 'mainnet' | 'testnet' | undefined;
  baseUrl: string;
}

const ContactButtons = ({
  nostr,
  pgp,
  email,
  telegram,
  twitter,
  matrix,
  website,
  reddit,
}: Contact): JSX.Element => {
  const { t } = useTranslation();
  const [showMatrix, setShowMatrix] = useState<boolean>(false);
  const [showNostr, setShowNostr] = useState<boolean>(false);

  return (
    <Grid container direction='row' alignItems='center' justifyItems='space-between'>
      {nostr ? (
        <Grid item>
          <Tooltip
            title={<Typography variant='body2'>{`Nostr pubkey copied! ${nostr}`}</Typography>}
            open={showNostr}
          >
            <IconButton
              onClick={() => {
                setShowNostr(true);
                setTimeout(() => setShowNostr(false), 10000);
                systemClient.copyToClipboard(nostr);
              }}
            >
              <Spoke />
            </IconButton>
          </Tooltip>
        </Grid>
      ) : (
        <></>
      )}

      {pgp ? (
        <Grid item>
          <Tooltip enterTouchDelay={0} enterDelay={500} enterNextDelay={2000} title={'PGP'}>
            <IconButton component='a' target='_blank' href={`https://${pgp}`} rel='noreferrer'>
              <Security />
            </IconButton>
          </Tooltip>
        </Grid>
      ) : (
        <></>
      )}

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

      {reddit ? (
        <Grid item>
          <IconButton
            component='a'
            target='_blank'
            href={`https://reddit.com/${reddit}`}
            rel='noreferrer'
          >
            <Reddit />
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
            title={<Typography variant='body2'>{`Matrix copied! ${matrix}`}</Typography>}
            open={showMatrix}
          >
            <IconButton
              onClick={() => {
                setShowMatrix(true);
                setTimeout(() => setShowMatrix(false), 10000);
                systemClient.copyToClipboard(matrix);
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

const FounderBadge = (): JSX.Element => {
  return (
    <Tooltip
      enterTouchDelay={0}
      enterDelay={100}
      enterNextDelay={1000}
      title={'Awarded for contributing to the creation of the federation in testnet'}
    >
      <WorkspacePremium
        sx={{ position: 'relative', left: '0.5em', width: '1.5em', height: '1.5em' }}
        color='primary'
      />
    </Tooltip>
  );
};

const CoordinatorDialog = ({
  open = false,
  onClose,
  coordinator,
  network,
  baseUrl,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const { clientVersion } = useContext<AppContextProps>(AppContext);

  const [expanded, setExpanded] = useState<'summary' | 'stats' | undefined>(undefined);

  const listItemProps = { sx: { maxHeight: '3em' } };
  const coordinatorVersion = `v${coordinator?.info?.version?.major ?? '?'}.${
    coordinator?.info?.version?.minor ?? '?'
  }.${coordinator?.info?.version?.patch ?? '?'}`;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <Typography align='center' component='h5' variant='h5'>
          {`${coordinator?.alias}`}
        </Typography>
        <List dense>
          <ListItem sx={{ display: 'flex', justifyContent: 'center' }}>
            <Grid container direction='column' alignItems='center' padding={0}>
              <Grid item>
                <Badge
                  badgeContent={coordinator?.isFounder ? <FounderBadge /> : ''}
                  overlap='circular'
                >
                  <RobotAvatar
                    nickname={coordinator?.alias}
                    coordinator={true}
                    style={{ width: '5.5em', height: '5.5em' }}
                    smooth={true}
                    flipHorizontally={false}
                    baseUrl={baseUrl}
                  />
                </Badge>
              </Grid>
              <Grid item>
                <Typography align='center' variant='body2'>
                  <i>{`${coordinator?.motto}`}</i>
                </Typography>
              </Grid>
              <Grid item>
                <ContactButtons {...coordinator?.contact} />
              </Grid>
            </Grid>
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <Description />
            </ListItemIcon>

            <ListItemText
              primary={coordinator?.description}
              primaryTypographyProps={{ sx: { maxWidth: '20em' } }}
              secondary={t('Coordinator description')}
            />
          </ListItem>

          {coordinator?.mainnetNodesPubkeys[0] && network == 'mainnet' ? (
            <ListItem>
              <ListItemIcon>
                <AmbossIcon />
              </ListItemIcon>
              <ListItemText secondary={t('Mainnet LN Node')}>
                <Link
                  target='_blank'
                  href={`https://amboss.space/node/${coordinator?.mainnetNodesPubkeys[0]}`}
                  rel='noreferrer'
                >
                  {`${coordinator?.mainnetNodesPubkeys[0].slice(0, 12)}... (AMBOSS)`}
                </Link>
              </ListItemText>
            </ListItem>
          ) : (
            <></>
          )}

          {coordinator?.testnetNodesPubkeys[0] && network == 'testnet' ? (
            <ListItem>
              <ListItemIcon>
                <Dns />
              </ListItemIcon>
              <ListItemText secondary={t('Testnet LN Node')}>
                <Link
                  target='_blank'
                  href={`https://1ml.com/testnet/node/${coordinator?.testnetNodesPubkeys[0]}`}
                  rel='noreferrer'
                >
                  {`${coordinator?.testnetNodesPubkeys[0].slice(0, 12)}... (1ML)`}
                </Link>
              </ListItemText>
            </ListItem>
          ) : (
            <></>
          )}
        </List>
        {coordinator?.loadingInfo ? (
          <Box style={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : coordinator?.info ? (
          <Box>
            <Accordion
              expanded={expanded === 'summary'}
              onChange={() => setExpanded(expanded === 'summary' ? undefined : 'summary')}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>{t('Summary')}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ padding: 0 }}>
                <List dense>
                  <Divider />

                  <ListItem {...listItemProps}>
                    <ListItemIcon>
                      <Inventory />
                    </ListItemIcon>

                    <ListItemText
                      primary={coordinator?.info?.num_public_buy_orders}
                      secondary={t('Public buy orders')}
                    />
                  </ListItem>

                  <Divider />

                  <ListItem {...listItemProps}>
                    <ListItemIcon>
                      <Sell />
                    </ListItemIcon>

                    <ListItemText
                      primary={coordinator?.info?.num_public_sell_orders}
                      secondary={t('Public sell orders')}
                    />
                  </ListItem>

                  <Divider />

                  <ListItem {...listItemProps}>
                    <ListItemIcon>
                      <Book />
                    </ListItemIcon>

                    <ListItemText
                      primary={`${pn(coordinator?.info?.book_liquidity)} Sats`}
                      secondary={t('Book liquidity')}
                    />
                  </ListItem>

                  <Divider />

                  <ListItem {...listItemProps}>
                    <ListItemIcon>
                      <SmartToy />
                    </ListItemIcon>

                    <ListItemText
                      primary={coordinator?.info?.active_robots_today}
                      secondary={t('Today active robots')}
                    />
                  </ListItem>

                  <Divider />

                  <ListItem {...listItemProps}>
                    <ListItemIcon>
                      <PriceChange />
                    </ListItemIcon>

                    <ListItemText
                      primary={`${coordinator?.info?.last_day_nonkyc_btc_premium}%`}
                      secondary={t('24h non-KYC bitcoin premium')}
                    />
                  </ListItem>

                  <Divider />

                  <ListItem {...listItemProps}>
                    <ListItemIcon>
                      <Percent />
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

                  <ListItem {...listItemProps}>
                    <ListItemIcon>
                      <LinkIcon />
                    </ListItemIcon>

                    <ListItemText
                      primary={`${coordinator?.info?.current_swap_fee_rate.toPrecision(3)}%`}
                      secondary={t('Current onchain payout fee')}
                    />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>

            <Accordion
              expanded={expanded === 'stats'}
              onChange={() => setExpanded(expanded === 'stats' ? undefined : 'stats')}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>{t('Stats for Nerds')}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  <ListItem {...listItemProps}>
                    <ListItemIcon>
                      <RoboSatsNoTextIcon
                        sx={{
                          width: '1.4em',
                          height: '1.4em',
                          right: '0.2em',
                          position: 'relative',
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${t('Coordinator')} ${coordinatorVersion} - ${t('Client')} ${
                        clientVersion.short
                      }`}
                      secondary={t('RoboSats version')}
                    />
                  </ListItem>

                  <Divider />

                  <ListItem {...listItemProps}>
                    <ListItemIcon>
                      <Bolt />
                    </ListItemIcon>
                    <ListItemText
                      primary={coordinator?.info?.lnd_version}
                      secondary={t('LND version')}
                    />
                  </ListItem>

                  <Divider />

                  {coordinator?.info?.network === 'testnet' ? (
                    <ListItem {...listItemProps}>
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
                    <ListItem {...listItemProps}>
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

                  <ListItem {...listItemProps}>
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

                  <ListItem {...listItemProps}>
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

                  <ListItem {...listItemProps}>
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
              </AccordionDetails>
            </Accordion>
          </Box>
        ) : (
          <Typography align='center' variant='h6' color='error'>
            {t('Coordinator offline')}
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CoordinatorDialog;
