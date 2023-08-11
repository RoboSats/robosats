import React, { useState, useEffect } from 'react';
import { Box, LinearProgress } from '@mui/material';
import { calcTimeDelta } from 'react-countdown';

interface Props {
  expiresAt: string;
  totalSecsExp: number;
}

const LinearDeterminate: React.FC<Props> = ({ expiresAt, totalSecsExp }) => {
  const timePercentLeft = function (): number {
    if (Boolean(expiresAt) && Boolean(totalSecsExp)) {
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
