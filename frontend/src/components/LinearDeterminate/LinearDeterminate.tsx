import React, { useState, useEffect } from 'react';
import { Box, LinearProgress } from '@mui/material';
import { calcTimeDelta } from 'react-countdown';

interface Props {
  expiresAt: string;
  totalSecsExp: number;
}

const LinearDeterminate = ({ expiresAt, totalSecsExp }: Props): JSX.Element => {
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const left = calcTimeDelta(new Date(expiresAt)).total / 1000;
      const newProgress = (left / totalSecsExp) * 100;

      setProgress(newProgress);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [expiresAt, totalSecsExp]);

  return (
    <Box sx={{ width: '100%' }}>
      <LinearProgress variant='determinate' value={progress} />
    </Box>
  );
};

export default LinearDeterminate;
