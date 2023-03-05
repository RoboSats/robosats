import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton, LinearProgress, TextField, Tooltip } from '@mui/material';
import { Robot } from '../../models';
import { ContentCopy } from '@mui/icons-material';
import { systemClient } from '../../services/System';

interface TokenInputProps {
  robot: Robot;
  editable?: boolean;
  showDownload?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
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
  fullWidth = true,
  onPressEnter,
  autoFocusTarget = 'textfield',
  inputToken,
  badRequest,
  loading = false,
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

  if (loading) {
    return <LinearProgress sx={{ height: '0.8em' }} />;
  } else {
    return (
      <TextField
        error={!!badRequest}
        disabled={!editable}
        required={true}
        label={label || undefined}
        value={inputToken}
        autoFocus={autoFocusTarget == 'textfield'}
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
  }
};

export default TokenInput;
