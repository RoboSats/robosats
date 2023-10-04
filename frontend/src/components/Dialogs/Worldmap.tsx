import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  List,
  ListItemText,
  ListItem,
  ListItemIcon,
  ListItemButton,
  Tooltip,
  Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import RedditIcon from '@mui/icons-material/Reddit';
import Flags from 'country-flag-icons/react/3x2';
import { NostrIcon, SimplexIcon } from '../Icons';

interface Props {
  open: boolean;
  onClose: () => void;
}

const WorldmapDialog = ({ open = false, onClose }: Props): JSX.Element => {
  const { t } = useTranslation();

  const flagProps = {
    width: 30,
    height: 30,
    opacity: 0.85,
    style: {
      filter: 'drop-shadow(2px 2px 2px #444444)',
    },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby='community-dialog-title'
      aria-describedby='community-description'
    >
      <DialogContent>
        <Typography component='h5' variant='h5'>
          {'Community'}
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default WorldmapDialog;
