import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton, LinearProgress, TextField, Tooltip } from '@mui/material';
import { ContentCopy } from '@mui/icons-material';
import { systemClient } from '../../services/System';
import { type UseGarageStoreType, GarageContext } from '../../contexts/GarageContext';
import { validateTokenEntropy } from '../../utils';

interface TokenInputProps {
  editable?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  inputToken: string;
  autoFocusTarget?: 'textfield' | 'copyButton' | 'none';
  onPressEnter: () => void;
  setValidToken?: (valid: boolean) => void;
  setInputToken: (state: string) => void;
  showCopy?: boolean;
  label?: string;
}

const TokenInput = ({
  editable = true,
  showCopy = true,
  label,
  fullWidth = true,
  onPressEnter,
  autoFocusTarget = 'textfield',
  inputToken,
  loading = false,
  setInputToken,
  setValidToken = () => {},
}: TokenInputProps): JSX.Element => {
  const { t } = useTranslation();
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const [showCopied, setShowCopied] = useState<boolean>(false);
  const [badToken, setBadToken] = useState<string>('');

  useEffect(() => {}, [inputToken]);

  useEffect(() => {
    setShowCopied(false);
    if (inputToken.length < 20) {
      setBadToken(t('The token is too short'));
    } else if (!validateTokenEntropy(inputToken).hasEnoughEntropy) {
      setBadToken(t('Not enough entropy, make it more complex'));
    } else {
      setBadToken('');
    }
  }, [inputToken]);

  useEffect(() => {
    setShowCopied(false);
    setValidToken(badToken === '');
  }, [badToken]);

  useEffect(() => {
    setShowCopied(false);
  }, [showCopied]);

  if (loading) {
    return <LinearProgress sx={{ height: '0.8em' }} />;
  } else {
    return (
      <TextField
        error={inputToken.length > 20 ? Boolean(badToken) : false}
        disabled={!editable}
        required={true}
        label={label ?? ''}
        value={inputToken}
        autoFocus={autoFocusTarget === 'textfield'}
        fullWidth={fullWidth}
        sx={{ borderColor: 'primary' }}
        variant={editable ? 'outlined' : 'filled'}
        helperText={badToken}
        size='medium'
        onChange={(e) => {
          setInputToken(e.target.value.replace(/\s+/g, ''));
        }}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            onPressEnter();
          }
        }}
        InputProps={{
          endAdornment: showCopy ? (
            <Tooltip open={showCopied} title={t('Copied!')}>
              <IconButton
                autoFocus={autoFocusTarget === 'copyButton'}
                color={garage.getSlot()?.copiedToken ? 'inherit' : 'primary'}
                onClick={() => {
                  systemClient.copyToClipboard(inputToken);
                  setShowCopied(true);
                  setTimeout(() => {
                    setShowCopied(false);
                  }, 1000);
                  garage.updateSlot({ copiedToken: true }, inputToken);
                }}
              >
                <ContentCopy sx={{ width: '1em', height: '1em' }} />
              </IconButton>
            </Tooltip>
          ) : null,
        }}
      />
    );
  }
};

export default TokenInput;
