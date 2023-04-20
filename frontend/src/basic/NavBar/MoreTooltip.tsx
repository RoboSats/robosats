import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, styled, Grid, IconButton } from '@mui/material';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import { closeAll } from '../../contexts/AppContext';
import { OpenDialogs } from '../MainDialogs';

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
  open: OpenDialogs;
  setOpen: (state: OpenDialogs) => void;
  children: JSX.Element;
}

const MoreTooltip = ({ open, setOpen, children }: MoreTooltipProps): JSX.Element => {
  const { t } = useTranslation();
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
                onClick={() => setOpen({ ...closeAll, info: !open.info })}
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
                onClick={() => setOpen({ ...closeAll, learn: !open.learn })}
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
                onClick={() => setOpen({ ...closeAll, community: !open.community })}
              >
                <People />
              </IconButton>
            </Tooltip>
          </Grid>

          <Grid item sx={{ position: 'relative', right: '0.4em' }}>
            <Tooltip enterTouchDelay={250} placement='left' title={t('Coordinator summary')}>
              <IconButton
                sx={{
                  color: open.coordinator
                    ? theme.palette.primary.main
                    : theme.palette.text.secondary,
                }}
                onClick={() => setOpen({ ...closeAll, coordinator: !open.coordinator })}
              >
                <PriceChange />
              </IconButton>
            </Tooltip>
          </Grid>

          <Grid item sx={{ position: 'relative', right: '0.4em' }}>
            <Tooltip enterTouchDelay={250} placement='left' title={t('Stats for nerds')}>
              <IconButton
                sx={{
                  color: open.stats ? theme.palette.primary.main : theme.palette.text.secondary,
                }}
                onClick={() => setOpen({ ...closeAll, stats: !open.stats })}
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
