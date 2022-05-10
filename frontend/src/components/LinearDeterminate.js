import React, { useState, useEffect } from "react";
import { Box, LinearProgress } from "@mui/material"
import { calcTimeDelta } from 'react-countdown';

export default function LinearDeterminate(props) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        var left = calcTimeDelta( new Date(props.expires_at)).total /1000;
        return (left / props.total_secs_exp) * 100;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <Box sx={{ width: '100%' }}>
      <LinearProgress variant="determinate" value={progress} />
    </Box>
  );
}