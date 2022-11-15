import React from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@mui/material';
import { Lock, LockOpen, Balance } from '@mui/icons-material';

interface BondStatusProps {
  status: 'locked' | 'settled' | 'returned' | 'hide';
  isMaker: boolean;
}

const BondStatus = ({ status, isMaker }: BondStatusProps): JSX.Element => {
  const { t } = useTranslation();

  let Icon = Lock;
  let color = 'primary';
  if (status === 'returned') {
    Icon = LockOpen;
    color = 'green';
  } else if (status === 'settled') {
    Icon = Balance;
    color = 'red';
  }

  if (status === 'hide') {
    return <></>;
  } else {
    return (
      <Typography color='primary' variant='subtitle1' align='center'>
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
