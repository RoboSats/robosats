import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconButton,
  TextField,
  Tooltip,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { ContentCopy, Check } from '@mui/icons-material';
import { validateGarageKey } from '../../utils';

interface GarageKeyInputProps {
  garageKey: string;
  setGarageKey: (key: string) => void;
  editable?: boolean;
  loading?: boolean;
  onPressEnter?: () => void;
  autoFocusTarget?: 'textField' | 'copyButton';
  label?: string;
}

const GarageKeyInput = ({
  garageKey,
  setGarageKey,
  editable = true,
  loading = false,
  onPressEnter,
  autoFocusTarget = 'textField',
  label,
}: GarageKeyInputProps): React.JSX.Element => {
  const { t } = useTranslation();

  const [showCopied, setShowCopied] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setShowCopied(false);
    if (!garageKey) {
      setError('');
      return;
    }

    const validation = validateGarageKey(garageKey);
    if (!validation.valid) {
      setError(validation.error ?? t('Invalid garage key'));
    } else {
      setError('');
    }
  }, [garageKey]);

  const handleCopy = (): void => {
    if (garageKey) {
      void navigator.clipboard.writeText(garageKey);
      setShowCopied(true);
      setTimeout(() => {
        setShowCopied(false);
      }, 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && onPressEnter) {
      onPressEnter();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const cleanedKey = e.target.value.replace(/\s+/g, '').toLowerCase();
    setGarageKey(cleanedKey);
  };

  return (
    <TextField
      fullWidth
      disabled={!editable || loading}
      label={label ?? t('Garage Key')}
      value={garageKey}
      onChange={handleChange}
      onKeyPress={handleKeyPress}
      error={!!error && garageKey.length > 0}
      helperText={error && garageKey.length > 0 ? error : t('Format: robo1...')}
      autoFocus={autoFocusTarget === 'textField'}
      InputProps={{
        endAdornment: (
          <InputAdornment position='end'>
            {loading ? (
              <CircularProgress size={20} />
            ) : (
              <Tooltip
                title={showCopied ? t('Copied!') : t('Copy')}
                enterTouchDelay={0}
                placement='top'
              >
                <IconButton
                  autoFocus={autoFocusTarget === 'copyButton'}
                  onClick={handleCopy}
                  disabled={!garageKey}
                >
                  {showCopied ? <Check color='success' /> : <ContentCopy />}
                </IconButton>
              </Tooltip>
            )}
          </InputAdornment>
        ),
      }}
      inputProps={{
        style: {
          fontFamily: 'monospace',
          fontSize: '0.85em',
        },
      }}
    />
  );
};

export default GarageKeyInput;
