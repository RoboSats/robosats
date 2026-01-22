import React, { useContext, useEffect, useRef, useState } from 'react';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';

import MakerForm from '../../components/MakerForm';
import { Paper, Box } from '@mui/material';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';

const BASE_WIDTH = 380;
const MakerWidget = React.forwardRef(function Component() {
  const { fav } = useContext<UseAppStoreType>(AppContext);
  const { federationUpdatedAt } = useContext<UseAppStoreType>(AppContext);
  const { maker } = useContext<UseGarageStoreType>(GarageContext);

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
  }, [maker, fav]);

  return React.useMemo(() => {
    return (
      <Paper
        elevation={3}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
          <MakerForm />
        </Box>
      </Paper>
    );
  }, [maker, fav, federationUpdatedAt, scale]);
});

export default MakerWidget;
