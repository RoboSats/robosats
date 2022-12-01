import React, { useState, useEffect } from 'react';
import { Box, LinearProgress } from '@mui/material';
import { calcTimeDelta } from 'react-countdown';

interface Props {
  expiresAt: string;
  totalSecsExp: number;
}

const LinearDeterminate = ({ expiresAt, totalSecsExp }: Props): JSX.Element => {
  const timePercentLeft = function () {
    if (expiresAt && totalSecsExp) {
      const lapseTime = calcTimeDelta(new Date(expiresAt)).total / 1000;
      return (lapseTime / totalSecsExp) * 100;
    } else {
      return 100;
    }
  };

  const [progress, setProgress] = useState<number>(timePercentLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(timePercentLeft);
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [expiresAt, totalSecsExp]);

  return (
    <Box sx={{ width: '100%' }}>
      <LinearProgress
        sx={{ height: '0.4em' }}
        variant='determinate'
        value={progress}
        color={progress < 25 ? 'secondary' : 'primary'}
      />
    </Box>
  );
};

export default LinearDeterminate;
