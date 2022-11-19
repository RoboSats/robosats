import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';
import { Lock, LockOpen, Balance } from '@mui/icons-material';

interface BondStatusProps {
  status: 'locked' | 'settled' | 'returned' | 'hide';
  isMaker: boolean;
}

const BondStatus = ({ status, isMaker }: BondStatusProps): JSX.Element => {
  const { t } = useTranslation();

  let Icon = Lock;
  if (status === 'returned') {
    Icon = LockOpen;
  } else if (status === 'settled') {
    Icon = Balance;
  }

  if (status === 'hide') {
    return <></>;
  } else {
    return (
      <Box>
        <Typography color='primary' variant='subtitle1' align='center'>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Icon />
            {t(`Your ${isMaker ? 'maker' : 'taker'} bond is ${status}`)}
          </div>
        </Typography>
      </Box>
    );
  }
};

export default BondStatus;
