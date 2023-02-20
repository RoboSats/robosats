import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton, TextField, Tooltip, useTheme } from '@mui/material';
import { Robot } from '../../models';
import { Download, ContentCopy } from '@mui/icons-material';
import { systemClient } from '../../services/System';
import { saveAsJson } from '../../utils';

interface TokenInputProps {
  robot: Robot;
  editable?: boolean;
  showDownload?: boolean;
  fullWidth?: boolean;
  setRobot: (state: Robot) => void;
  inputToken: string;
  autoFocusTarget?: 'textfield' | 'copyButton' | 'none';
  onPressEnter: () => void;
  badRequest: string | undefined;
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
  showDownload = false,
  fullWidth = true,
  onPressEnter,
  autoFocusTarget = 'textfield',
  inputToken,
  badRequest,
  setInputToken,
}: TokenInputProps): JSX.Element => {
  const { t } = useTranslation();
  const [showCopied, setShowCopied] = useState<boolean>(false);

  useEffect(() => {
    setShowCopied(false);
  }, [inputToken]);

  const createJsonFile = () => {
    return {
      token: robot.token,
      token_shannon_entropy: robot.shannonEntropy,
      token_bit_entropy: robot.bitsEntropy,
      public_key: robot.pubKey,
      encrypted_private_key: robot.encPrivKey,
    };
  };

  return (
    <TextField
      error={!!badRequest}
      disabled={!editable}
      required={true}
      label={label || undefined}
      value={inputToken}
      autoFocus={autoFocusTarget == 'texfield'}
      fullWidth={fullWidth}
      sx={{ borderColor: 'primary' }}
      variant={editable ? 'outlined' : 'filled'}
      helperText={badRequest}
      size='medium'
      onChange={(e) => setInputToken(e.target.value)}
      onKeyPress={(e) => {
        if (e.key === 'Enter') {
          onPressEnter();
        }
      }}
      InputProps={{
        startAdornment: showDownload ? (
          <Tooltip enterTouchDelay={250} title={t('Download token and PGP credentials')}>
            <IconButton
              color='primary'
              sx={{ position: 'relative', top: label ? '0.4em' : '0em' }}
              onClick={() => saveAsJson(robot.nickname + '.json', createJsonFile())}
            >
              <Download sx={{ width: '1em', height: '1em' }} />
            </IconButton>
          </Tooltip>
        ) : null,
        endAdornment: showCopy ? (
          <Tooltip open={showCopied} title={t('Copied!')}>
            <IconButton
              autoFocus={autoFocusTarget == 'copyButton'}
              color={robot.copiedToken ? 'inherit' : 'primary'}
              onClick={() => {
                systemClient.copyToClipboard(inputToken);
                setShowCopied(true);
                setTimeout(() => setShowCopied(false), 1000);
                setRobot({ ...robot, copiedToken: true });
              }}
            >
              <ContentCopy sx={{ width: '1em', height: '1em' }} />
            </IconButton>
          </Tooltip>
        ) : null,
      }}
    />
  );
};

export default TokenInput;
