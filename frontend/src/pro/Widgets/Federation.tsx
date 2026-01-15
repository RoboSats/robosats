import React, { useContext, useEffect, useRef, useState } from 'react';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { Paper, Box } from '@mui/material';
import { type GridItem } from 'react-grid-layout';
import FederationTable from '../../components/FederationTable';

const BASE_WIDTH = 550;
const MIN_SCALE = 0.5;

interface FederationWidgetProps {
  layout: GridItem;
  gridCellSize: number;
  style?: React.StyleHTMLAttributes<HTMLElement>;
  className?: string;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onTouchEnd?: () => void;
}

const FederationWidget = React.forwardRef(function Component({
  layout: _layout,
  gridCellSize: _gridCellSize,
}: FederationWidgetProps) {
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const { federationUpdatedAt } = useContext<UseAppStoreType>(AppContext);

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

        const rawScale = Math.min(scaleX, scaleY);
        const newScale = Math.max(MIN_SCALE, rawScale);

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
  }, [federation, federationUpdatedAt]);

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
          <FederationTable maxWidth={BASE_WIDTH / 16} maxHeight={35} fillContainer={false} />
        </Box>
      </Paper>
    );
  }, [federation, federationUpdatedAt, scale]);
});

export default FederationWidget;
