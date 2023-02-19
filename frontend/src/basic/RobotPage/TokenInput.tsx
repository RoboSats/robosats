import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Collapse,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useParams } from 'react-router-dom';

import { Page } from '../NavBar';
import { Robot } from '../../models';
import { Casino, Download, ContentCopy, SmartToy, Bolt } from '@mui/icons-material';
import RobotAvatar from '../../components/RobotAvatar';
import { systemClient } from '../../services/System';
import { saveAsJson } from '../../utils';

interface TokenInputProps {
  robot: Robot;
  editable?: boolean;
  showDownload?: boolean;
  fullWidth?: boolean;
  setRobot: (state: Robot) => void;
  inputToken: string;
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
  inputToken,
  badRequest,
  setInputToken,
}: TokenInputProps): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

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
      label={label ? label : undefined}
      value={inputToken}
      autoFocus
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
          <Tooltip enterTouchDelay={250} title={t('Save token to file')}>
            <span>
              <IconButton
                color='primary'
                onClick={() => saveAsJson(robot.nickname + '.json', createJsonFile())}
              >
                <Download sx={{ width: '1em', height: '1em' }} />
              </IconButton>
            </span>
          </Tooltip>
        ) : null,
        endAdornment: showCopy ? (
          <Tooltip disableHoverListener enterTouchDelay={0} title={t('Copied!')}>
            <IconButton
              color={robot.copiedToken ? 'inherit' : 'primary'}
              onClick={() => {
                systemClient.copyToClipboard(inputToken);
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
