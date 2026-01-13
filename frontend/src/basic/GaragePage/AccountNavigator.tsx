import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  IconButton,
  Typography,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

interface AccountNavigatorProps {
  accountIndex: number;
  onPrevious: () => void;
  onNext: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const AccountNavigator = ({
  accountIndex,
  onPrevious,
  onNext,
  loading = false,
  disabled = false,
}: AccountNavigatorProps): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
      }}
    >
      <Tooltip title={t('Previous account')} placement='top'>
        <span>
          <IconButton
            onClick={onPrevious}
            disabled={disabled || loading || accountIndex === 0}
            size='small'
          >
            <ChevronLeft />
          </IconButton>
        </span>
      </Tooltip>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          minWidth: '6em',
          justifyContent: 'center',
        }}
      >
        {loading ? (
          <CircularProgress size={20} />
        ) : (
          <Typography variant='body1' sx={{ fontFamily: 'monospace' }}>
            {t('Account')} #{accountIndex}
          </Typography>
        )}
      </Box>

      <Tooltip title={t('Next account')} placement='top'>
        <span>
          <IconButton
            onClick={onNext}
            disabled={disabled || loading}
            size='small'
          >
            <ChevronRight />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
};

export default AccountNavigator;
