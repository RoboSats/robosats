import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton, LinearProgress, TextField, Tooltip } from '@mui/material';
import { type Robot } from '../../models';
import { ContentCopy } from '@mui/icons-material';
import { systemClient } from '../../services/System';

interface TokenInputProps {
  robot: Robot;
  editable?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  setRobot: (state: Robot) => void;
  inputToken: string;
  autoFocusTarget?: 'textfield' | 'copyButton' | 'none';
  onPressEnter: () => void;
  badToken?: string;
  setInputToken: (state: string) => void;
  showCopy?: boolean;
  label?: string;
}

const TokenInput = ({
  robot,
  editable = true,
  showCopy = true,
  label,
  setRobot,
  fullWidth = true,
  onPressEnter,
  autoFocusTarget = 'textfield',
  inputToken,
  badToken = '',
  loading = false,
  setInputToken,
}: TokenInputProps): JSX.Element => {
  const { t } = useTranslation();
  const [showCopied, setShowCopied] = useState<boolean>(false);

  useEffect(() => {
    setShowCopied(false);
  }, [inputToken]);

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
          setInputToken(e.target.value);
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
                color={robot.copiedToken ? 'inherit' : 'primary'}
                onClick={() => {
                  systemClient.copyToClipboard(inputToken);
                  setShowCopied(true);
                  setTimeout(() => {
                    setShowCopied(false);
                  }, 1000);
                  setRobot((robot) => {
                    return { ...robot, copiedToken: true };
                  });
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
