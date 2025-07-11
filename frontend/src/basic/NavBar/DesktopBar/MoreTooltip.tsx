import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, styled, Grid, IconButton } from '@mui/material';
import Tooltip, { type TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import { closeAll, type UseAppStoreType, AppContext } from '../../../contexts/AppContext';

import { BubbleChart, Info, People, PriceChange, School } from '@mui/icons-material';

const StyledTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[1],
    fontSize: theme.typography.fontSize,
    borderRadius: '2em',
  },
}));

interface MoreTooltipProps {
  children: React.JSX.Element;
}

const MoreTooltip = ({ children }: MoreTooltipProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { open, setOpen } = useContext<UseAppStoreType>(AppContext);

  const theme = useTheme();
  return (
    <StyledTooltip
      open={open.more}
      title={
        <Grid
          container
          direction='column'
          padding={0}
          sx={{ width: '2em', padding: '0em' }}
          justifyContent='center'
        >
          <Grid item sx={{ position: 'relative', right: '0.4em' }}>
            <Tooltip enterTouchDelay={250} placement='left' title={t('RoboSats information')}>
              <IconButton
                sx={{
                  color: open.info ? theme.palette.primary.main : theme.palette.text.secondary,
                }}
                onClick={() => {
                  setOpen({ ...closeAll, info: !open.info });
                }}
              >
                <Info />
              </IconButton>
            </Tooltip>
          </Grid>

          <Grid item sx={{ position: 'relative', right: '0.4em' }}>
            <Tooltip enterTouchDelay={250} placement='left' title={t('Learn RoboSats')}>
              <IconButton
                sx={{
                  color: open.learn ? theme.palette.primary.main : theme.palette.text.secondary,
                }}
                onClick={() => {
                  setOpen({ ...closeAll, learn: !open.learn });
                }}
              >
                <School />
              </IconButton>
            </Tooltip>
          </Grid>

          <Grid item sx={{ position: 'relative', right: '0.4em' }}>
            <Tooltip
              enterTouchDelay={250}
              placement='left'
              title={t('Community and public support')}
            >
              <IconButton
                sx={{
                  color: open.community ? theme.palette.primary.main : theme.palette.text.secondary,
                }}
                onClick={() => {
                  setOpen({ ...closeAll, community: !open.community });
                }}
              >
                <People />
              </IconButton>
            </Tooltip>
          </Grid>

          <Grid item sx={{ position: 'relative', right: '0.4em' }}>
            <Tooltip enterTouchDelay={250} placement='left' title={t('Exchange summary')}>
              <IconButton
                sx={{
                  color: open.exchange ? theme.palette.primary.main : theme.palette.text.secondary,
                }}
                onClick={() => {
                  setOpen({ ...closeAll, exchange: !open.exchange });
                }}
              >
                <PriceChange />
              </IconButton>
            </Tooltip>
          </Grid>

          <Grid item sx={{ position: 'relative', right: '0.4em' }}>
            <Tooltip enterTouchDelay={250} placement='left' title={t('client for nerds')}>
              <IconButton
                sx={{
                  color: open.client ? theme.palette.primary.main : theme.palette.text.secondary,
                }}
                onClick={() => {
                  setOpen({ ...closeAll, client: !open.client });
                }}
              >
                <BubbleChart />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      }
    >
      {children}
    </StyledTooltip>
  );
};

export default MoreTooltip;
