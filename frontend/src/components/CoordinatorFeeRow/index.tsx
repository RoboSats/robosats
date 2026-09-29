import React from 'react';
import { Chip, Skeleton, Stack, Tooltip, Typography } from '@mui/material';
import { Link } from '@mui/icons-material';
import { type Coordinator } from '../../models';

interface CoordinatorFeeRowProps {
  coordinator: Coordinator;
  t: (key: string) => string;
  fullWidth?: boolean;
}

/**
 * Compact fee + swap row rendered inside the coordinator selector (MakerForm)
 * and inside the OrderDetails header, replacing the old on-chain Alert.
 *
 * Shows: Maker fee · Taker fee · onchain-swap chip (or disabled icon)
 *
 * Pass `fullWidth` to stretch the row across its container (used in OrderDetails).
 */
const CoordinatorFeeRow = ({
  coordinator,
  t,
  fullWidth = false,
}: CoordinatorFeeRowProps): React.JSX.Element => {
  const info = coordinator.info;

  if (coordinator.loadingInfo) {
    return <Skeleton variant='text' width={fullWidth ? undefined : 120} height={16} />;
  }

  if (!info) {
    return <></>;
  }

  return (
    <Stack
      direction='row'
      spacing={0.75}
      sx={{
        alignItems: 'center',
        ...(fullWidth && { width: '100%', justifyContent: 'space-evenly' }),
      }}
    >
      <Tooltip placement='top' enterTouchDelay={500} enterDelay={700} title={t('Maker fee')}>
        <Typography variant='caption' color='text.secondary' sx={{ whiteSpace: 'nowrap' }}>
          {t('Maker')[0]}&nbsp;{(info.maker_fee * 100).toFixed(3)}%
        </Typography>
      </Tooltip>
      <Typography variant='caption' color='text.disabled'>
        ·
      </Typography>
      <Tooltip placement='top' enterTouchDelay={500} enterDelay={700} title={t('Taker fee')}>
        <Typography variant='caption' color='text.secondary' sx={{ whiteSpace: 'nowrap' }}>
          {t('Taker')[0]}&nbsp;{(info.taker_fee * 100).toFixed(3)}%
        </Typography>
      </Tooltip>
      <Typography variant='caption' color='text.disabled'>
        ·
      </Typography>
      <Tooltip
        placement='top'
        enterTouchDelay={500}
        enterDelay={700}
        title={info.swap_enabled ? t('Onchain payouts enabled') : t('Onchain payouts disabled')}
      >
        {info.swap_enabled ? (
          <Chip
            icon={<Link sx={{ fontSize: '0.85rem !important' }} />}
            label={`${info.current_swap_fee_rate.toFixed(1)}%`}
            size='small'
            color='success'
            variant='outlined'
            sx={{ height: 16, fontSize: '0.65rem', '& .MuiChip-label': { px: 0.5 } }}
          />
        ) : (
          <Link sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
        )}
      </Tooltip>
    </Stack>
  );
};

export default CoordinatorFeeRow;
