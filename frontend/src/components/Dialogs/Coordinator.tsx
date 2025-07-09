import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Dialog,
  Alert,
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
  AlertTitle,
  ListItemButton,
  Rating,
} from '@mui/material';

import {
  Inventory,
  Sell,
  SmartToy,
  Percent,
  PriceChange,
  Book,
  Reddit,
  Key,
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
  Web,
  VolunteerActivism,
  Circle,
  Flag,
  ApiOutlined,
} from '@mui/icons-material';
import LinkIcon from '@mui/icons-material/Link';

import { pn } from '../../utils';
import { type Contact } from '../../models';
import RobotAvatar from '../RobotAvatar';
import {
  AmbossIcon,
  BitcoinSignIcon,
  RoboSatsNoTextIcon,
  BadgeFounder,
  BadgeDevFund,
  BadgePrivacy,
  BadgeLimits,
  NostrIcon,
  SimplexIcon,
  XIcon,
} from '../Icons';
import { AppContext } from '../../contexts/AppContext';
import { systemClient } from '../../services/System';
import type Coordinator from '../../models/Coordinator.model';
import { type Badges } from '../../models/Coordinator.model';
import { type UseFederationStoreType, FederationContext } from '../../contexts/FederationContext';

interface Props {
  open: boolean;
  onClose: () => void;
  shortAlias: string | null;
  network: 'mainnet' | 'testnet' | undefined;
}

const ContactButtons = ({
  nostr,
  pgp,
  fingerprint,
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
      {nostr !== undefined && (
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

      {pgp && fingerprint && (
        <Grid item>
          <Tooltip
            enterTouchDelay={0}
            enterNextDelay={2000}
            title={t('Download PGP Pubkey. Fingerprint: ') + fingerprint.match(/.{1,4}/g).join(' ')}
          >
            <IconButton component='a' target='_blank' href={pgp} rel='noreferrer'>
              <Key />
            </IconButton>
          </Tooltip>
        </Grid>
      )}

      {email !== undefined && (
        <Grid item>
          <Tooltip enterTouchDelay={0} enterNextDelay={2000} title={t('Send Email')}>
            <IconButton component='a' href={`mailto: ${email}`}>
              <Email />
            </IconButton>
          </Tooltip>
        </Grid>
      )}

      {telegram !== undefined && (
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

      {twitter !== undefined && (
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

      {reddit !== undefined && (
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

      {website !== undefined && (
        <Grid item>
          <Tooltip enterTouchDelay={0} enterNextDelay={2000} title={t('Website')}>
            <IconButton component='a' target='_blank' href={website} rel='noreferrer'>
              <Language />
            </IconButton>
          </Tooltip>
        </Grid>
      )}

      {matrix !== undefined && (
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

      {simplex !== undefined && (
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

interface BadgesProps {
  badges: Badges | undefined;
  size_limit: number | undefined;
}

const BadgesHall = ({ badges, size_limit }: BadgesProps): React.JSX.Element => {
  const { t } = useTranslation();
  const sxProps = {
    width: '3em',
    height: '3em',
    filter: 'drop-shadow(3px 3px 3px RGB(0,0,0,0.3))',
  };
  const tooltipProps = { enterTouchDelay: 0, enterNextDelay: 2000 };
  return (
    <Grid container direction='row' alignItems='center' justifyContent='center' spacing={1}>
      <Tooltip
        {...tooltipProps}
        title={
          <Typography align='center' variant='body2'>
            {badges?.isFounder === true
              ? t('Founder: coordinating trades since the testnet federation.')
              : t('Not a federation founder')}
          </Typography>
        }
      >
        <Grid item sx={{ filter: badges?.isFounder !== true ? 'grayscale(100%)' : undefined }}>
          <BadgeFounder sx={sxProps} />
        </Grid>
      </Tooltip>

      <Tooltip
        {...tooltipProps}
        title={
          <Typography align='center' variant='body2'>
            {t('Development fund supporter: donates {{percent}}% to make RoboSats better.', {
              percent: badges?.donatesToDevFund,
            })}
          </Typography>
        }
      >
        <Grid
          item
          sx={{ filter: Number(badges?.donatesToDevFund) >= 20 ? undefined : 'grayscale(100%)' }}
        >
          <BadgeDevFund sx={sxProps} />
        </Grid>
      </Tooltip>

      <Tooltip
        {...tooltipProps}
        title={
          <Typography align='center' variant='body2'>
            {badges?.hasGoodOpSec === true
              ? t(
                  'Good OpSec: the coordinator follows best practices to protect his and your privacy.',
                )
              : t('The privacy practices of this coordinator could improve')}
          </Typography>
        }
      >
        <Grid item sx={{ filter: badges?.hasGoodOpSec === true ? undefined : 'grayscale(100%)' }}>
          <BadgePrivacy sx={sxProps} />
        </Grid>
      </Tooltip>

      <Tooltip
        {...tooltipProps}
        title={
          <Typography align='center' variant='body2'>
            {size_limit > 3000000
              ? t('Large limits: the coordinator has large trade limits.')
              : t('Does not have large trade limits.')}
          </Typography>
        }
      >
        <Grid item sx={{ filter: size_limit > 3000000 ? undefined : 'grayscale(100%)' }}>
          <BadgeLimits sx={sxProps} />
        </Grid>
      </Tooltip>
    </Grid>
  );
};

const CoordinatorDialog = ({ open = false, onClose, shortAlias }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const { clientVersion, page, settings, origin } = useContext(AppContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);

  const [rating, setRating] = useState<Record<string, number>>({});
  const [averageRating, setAvergeRating] = useState<number>(0);
  const [expanded, setExpanded] = useState<'summary' | 'stats' | 'policies' | undefined>(undefined);
  const [coordinator, setCoordinator] = useState<Coordinator>(
    federation.getCoordinator(shortAlias ?? ''),
  );

  const listItemProps = { sx: { maxHeight: '3em', width: '100%' } };
  const coordinatorVersion = `v${coordinator?.info?.version?.major ?? '?'}.${
    coordinator?.info?.version?.minor ?? '?'
  }.${coordinator?.info?.version?.patch ?? '?'}`;

  useEffect(() => {
    setCoordinator(federation.getCoordinator(shortAlias ?? ''));
    setRating({});
    setAvergeRating(0);
  }, [shortAlias]);

  useEffect(() => {
    if (open) {
      const coordinator = federation.getCoordinator(shortAlias ?? '');
      if (settings.connection === 'nostr') {
        federation.roboPool.subscribeRatings(
          {
            onevent: (event) => {
              const coordinatorPubKey = event.tags.find((t) => t[0] === 'p')?.[1];
              if (coordinatorPubKey === coordinator.nostrHexPubkey) {
                const eventRating = event.tags.find((t) => t[0] === 'rating')?.[1];
                if (eventRating) {
                  setRating((prev) => {
                    prev[event.pubkey] = parseFloat(eventRating);
                    const totalRatings = Object.values(prev);
                    const sum: number = Object.values(prev).reduce((accumulator, currentValue) => {
                      return accumulator + currentValue;
                    }, 0);
                    setAvergeRating(sum / totalRatings.length);
                    return prev;
                  });
                }
              }
            },
            oneose: () => {},
          },
          [coordinator.nostrHexPubkey],
          coordinator.shortAlias,
        );
      }
      coordinator?.loadInfo();
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent style={{ width: 600 }}>
        <Typography align='center' component='h5' variant='h5'>
          {String(coordinator?.longAlias)}
        </Typography>
        <List dense>
          <ListItem sx={{ display: 'flex', justifyContent: 'center' }}>
            <Grid container direction='column' alignItems='center' padding={0}>
              <Grid item>
                <RobotAvatar
                  shortAlias={coordinator?.federated ? coordinator?.shortAlias : undefined}
                  hashId={coordinator?.federated ? undefined : coordinator?.mainnet.onion}
                  style={{ width: '7.5em', height: '7.5em' }}
                  smooth={true}
                />
              </Grid>
              <Grid item>
                <Typography align='center' variant='body2'>
                  <i>{String(coordinator?.motto)}</i>
                </Typography>
              </Grid>
              <Grid container direction='column' alignItems='center' padding={0}>
                <Grid item>
                  <Rating
                    readOnly
                    precision={0.5}
                    name='size-large'
                    value={averageRating * 5}
                    defaultValue={0}
                    disabled={settings.connection !== 'nostr'}
                  />
                  <Typography variant='caption' color='text.secondary'>
                    {`(${Object.keys(rating).length ?? 0})`}
                  </Typography>
                </Grid>
              </Grid>
              <Grid item>
                <ContactButtons {...coordinator?.contact} />
              </Grid>
            </Grid>
          </ListItem>

          {['create'].includes(page) && (
            <>
              <ListItem {...listItemProps}>
                <ListItemIcon>
                  <Percent />
                </ListItemIcon>

                <Grid container>
                  <Grid item xs={6}>
                    <ListItemText secondary={t('Maker fee')}>
                      {((coordinator?.info?.maker_fee ?? 0) * 100).toFixed(3)}%
                    </ListItemText>
                  </Grid>

                  <Grid item xs={6}>
                    <ListItemText secondary={t('Taker fee')}>
                      {((coordinator?.info?.taker_fee ?? 0) * 100).toFixed(3)}%
                    </ListItemText>
                  </Grid>
                </Grid>
              </ListItem>

              <ListItem {...listItemProps}>
                <ListItemIcon>
                  <LinkIcon />
                </ListItemIcon>

                <ListItemText
                  primary={`${String(coordinator?.info?.current_swap_fee_rate.toPrecision(3))}%`}
                  secondary={t('Current onchain payout fee')}
                />
              </ListItem>
            </>
          )}

          {Boolean(coordinator?.info?.notice_severity) &&
            coordinator?.info?.notice_severity !== 'none' && (
              <ListItem>
                <Alert severity={coordinator?.info?.notice_severity} sx={{ width: '100%' }}>
                  <AlertTitle>{t('Coordinator Notice')}</AlertTitle>
                  <div
                    dangerouslySetInnerHTML={{ __html: coordinator?.info?.notice_message ?? '' }}
                  />
                </Alert>
              </ListItem>
            )}
          <ListItem>
            <BadgesHall badges={coordinator?.badges} size_limit={coordinator?.size_limit} />
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

          <ListItem>
            <ListItemIcon>
              <Flag />
            </ListItemIcon>

            <ListItemText
              primary={coordinator?.established.toLocaleDateString(settings.language)}
              secondary={t('Established')}
            />
          </ListItem>

          {coordinator?.[settings.network] && (
            <ListItemButton
              target='_blank'
              href={coordinator[settings.network][settings.selfhostedClient ? 'onion' : origin]}
              rel='noreferrer'
            >
              <ListItemIcon>
                <Web />
              </ListItemIcon>
              <ListItemText
                secondary={t('Coordinator hosted web app')}
                primaryTypographyProps={{
                  style: {
                    maxWidth: '20em',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                  },
                }}
              >
                {`${String(
                  coordinator?.[settings.network][settings.selfhostedClient ? 'onion' : origin],
                )}`}
              </ListItemText>
            </ListItemButton>
          )}
        </List>

        {!coordinator || coordinator?.loadingInfo ? (
          <Box style={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : coordinator?.info ? (
          <Box>
            {Boolean(coordinator?.policies) && (
              <Accordion
                expanded={expanded === 'policies'}
                onChange={() => {
                  setExpanded(expanded === 'policies' ? undefined : 'policies');
                }}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>{t('Policies')}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ padding: 0 }}>
                  <List dense>
                    {Object.keys(coordinator?.policies).map((key, index) => (
                      <ListItem key={index} sx={{ maxWidth: '24em' }}>
                        <ListItemIcon>{index + 1}</ListItemIcon>
                        <ListItemText primary={key} secondary={coordinator?.policies[key]} />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}
            <Accordion
              expanded={expanded === 'summary'}
              onChange={() => {
                setExpanded(expanded === 'summary' ? undefined : 'summary');
              }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>{t('Summary')}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ padding: 0 }}>
                <List dense>
                  <ListItem {...listItemProps}>
                    <ListItemIcon>
                      <Circle />
                    </ListItemIcon>

                    <ListItemText
                      primary={`${pn(
                        Math.min(coordinator?.size_limit, coordinator?.info?.max_order_size),
                      )} Sats`}
                      secondary={t('Maximum order size')}
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

                  {!coordinator?.info?.swap_enabled ? (
                    <ListItem {...listItemProps}>
                      <ListItemIcon>
                        <LinkIcon />
                      </ListItemIcon>

                      <ListItemText
                        primary={t('Onchain payouts disabled')}
                        primaryTypographyProps={{ color: 'red' }}
                        secondary={t('Current onchain payout status')}
                      />
                    </ListItem>
                  ) : (
                    <>
                      <ListItem {...listItemProps}>
                        <ListItemIcon>
                          <LinkIcon />
                        </ListItemIcon>

                        <ListItemText
                          primary={`${coordinator?.info?.current_swap_fee_rate.toPrecision(3)}%`}
                          secondary={t('Current onchain payout fee')}
                        />
                      </ListItem>

                      <ListItem {...listItemProps}>
                        <ListItemIcon />

                        <ListItemText
                          primary={`${pn(
                            Math.min(
                              coordinator?.size_limit,
                              coordinator?.info?.max_order_size,
                              coordinator?.info?.max_swap,
                            ),
                          )} Sats`}
                          secondary={t('Maximum onchain swap size')}
                        />
                      </ListItem>
                    </>
                  )}

                  <Divider />

                  <ListItem {...listItemProps}>
                    <ListItemIcon>
                      <VolunteerActivism />
                    </ListItemIcon>

                    <ListItemText
                      primary={`${coordinator?.badges?.donatesToDevFund}% of profits`}
                      secondary={t('Zaps voluntarily for development')}
                    />
                  </ListItem>

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
                      <ApiOutlined />
                    </ListItemIcon>

                    <ListItemText
                      primary={coordinator?.info?.market_price_apis}
                      secondary={t('Market price sources (for multiple the median is calculated)')}
                    />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>

            <Accordion
              expanded={expanded === 'stats'}
              onChange={() => {
                setExpanded(expanded === 'stats' ? undefined : 'stats');
              }}
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
                      primary={`${t('Coordinator')} ${coordinatorVersion} - ${t('Client')} ${String(
                        clientVersion.short,
                      )}`}
                      secondary={t('RoboSats version')}
                    />
                  </ListItem>

                  <Divider />

                  {coordinator?.info?.lnd_version !== undefined && (
                    <ListItem {...listItemProps}>
                      <ListItemIcon>
                        <Bolt />
                      </ListItemIcon>
                      <ListItemText
                        primary={coordinator?.info?.lnd_version}
                        secondary={t('LND version')}
                      />
                    </ListItem>
                  )}

                  {Boolean(coordinator?.info?.cln_version) && (
                    <ListItem {...listItemProps}>
                      <ListItemIcon>
                        <Bolt />
                      </ListItemIcon>
                      <ListItemText
                        primary={coordinator?.info?.cln_version}
                        secondary={t('CLN version')}
                      />
                    </ListItem>
                  )}

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
                        {pn(parseFloat(coordinator?.info?.last_day_volume).toFixed(8))}
                        <BitcoinSignIcon
                          sx={{ width: '0.6em', height: '0.6em' }}
                          color={'text.secondary'}
                        />
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
                        {pn(parseFloat(coordinator?.info?.lifetime_volume).toFixed(8))}
                        <BitcoinSignIcon
                          sx={{ width: '0.6em', height: '0.6em' }}
                          color={'text.secondary'}
                        />
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
