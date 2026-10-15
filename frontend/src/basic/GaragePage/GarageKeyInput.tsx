import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton, TextField, Tooltip, InputAdornment, CircularProgress } from '@mui/material';
import { ContentCopy, Check } from '@mui/icons-material';
import { validateGarageKey } from '../../utils';
import { systemClient } from '../../services/System';

const GARAGE_KEY_VISIBLE_PREFIX_LENGTH = 12;

interface GarageKeyInputProps {
  garageKey: string;
  setGarageKey: (key: string) => void;
  editable?: boolean;
  masked?: boolean;
  loading?: boolean;
  onPressEnter?: () => void;
  autoFocusTarget?: 'textField' | 'copyButton';
  label?: string;
}

const GarageKeyInput = ({
  garageKey,
  setGarageKey,
  editable = true,
  masked = false,
  loading = false,
  onPressEnter,
  autoFocusTarget = 'textField',
}: GarageKeyInputProps): React.JSX.Element => {
  const { t } = useTranslation();

  const [showCopied, setShowCopied] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const displayValue =
    masked && garageKey.length > GARAGE_KEY_VISIBLE_PREFIX_LENGTH
      ? `${garageKey.slice(0, GARAGE_KEY_VISIBLE_PREFIX_LENGTH)}${'*'.repeat(garageKey.length - GARAGE_KEY_VISIBLE_PREFIX_LENGTH)}`
      : garageKey;

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
      systemClient.copyToClipboard(garageKey);
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
      value={displayValue}
      onChange={handleChange}
      onKeyPress={handleKeyPress}
      error={!!error && garageKey.length > 0}
      helperText={error && garageKey.length > 0 ? error : undefined}
      autoFocus={autoFocusTarget === 'textField'}
      slotProps={{
        input: {
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
        },
        htmlInput: {
          style: {
            fontFamily: 'monospace',
            fontSize: '0.85em',
          },
        },
      }}
    />
  );
};

export default GarageKeyInput;
