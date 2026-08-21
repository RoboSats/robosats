import React, { useContext, useEffect, useRef, useState } from 'react';
import { type UseAppStoreType, AppContext } from '../../contexts/AppContext';
import { Paper, Box } from '@mui/material';
import SettingsForm from '../../components/SettingsForm';

const BASE_WIDTH = 320;

const SettingsWidget = React.forwardRef(function Component() {
  const { settings } = useContext<UseAppStoreType>(AppContext);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current && contentRef.current) {
        const { width: containerWidth, height: containerHeight } =
          containerRef.current.getBoundingClientRect();
        const contentHeight = contentRef.current.scrollHeight;

        const scaleX = containerWidth / BASE_WIDTH;
        const scaleY = containerHeight / contentHeight;

        const newScale = Math.min(scaleX, scaleY);

        setScale(newScale);
      }
    };

    updateScale();

    const resizeObserver = new ResizeObserver(() => {
      updateScale();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [settings]);

  return React.useMemo(() => {
    return (
      <Paper
        elevation={3}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
        ref={containerRef}
      >
        <Box
          ref={contentRef}
          sx={{
            width: BASE_WIDTH,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          <SettingsForm dense={true} />
        </Box>
      </Paper>
    );
  }, [settings, scale]);
});

export default SettingsWidget;
