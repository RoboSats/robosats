import React from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, useTheme } from '@mui/material';
import { Lock, LockOpen, Balance } from '@mui/icons-material';

interface BondStatusProps {
  status: 'locked' | 'settled' | 'unlocked' | 'hide';
  isMaker: boolean;
}

const BondStatus = ({ status, isMaker }: BondStatusProps): React.JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

  let Icon = Lock;
  let color = 'primary';
  if (status === 'unlocked') {
    Icon = LockOpen;
    color = theme.palette.mode === 'dark' ? 'lightgreen' : 'green';
  } else if (status === 'settled') {
    Icon = Balance;
    color = theme.palette.mode === 'dark' ? 'lightred' : 'red';
  }

  if (status === 'hide') {
    return <></>;
  } else {
    return (
      <Typography color={color} variant='subtitle1' align='center'>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Icon sx={{ height: '0.9em', width: '0.9em' }} />
          {t(`Your ${isMaker ? 'maker' : 'taker'} bond is ${status}`)}
        </div>
      </Typography>
    );
  }
};

export default BondStatus;
