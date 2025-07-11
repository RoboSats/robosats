import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogContent,
  Divider,
  List,
  ListItemText,
  ListItem,
  ListItemIcon,
  Typography,
} from '@mui/material';

import BoltIcon from '@mui/icons-material/Bolt';
import PublicIcon from '@mui/icons-material/Public';
import FavoriteIcon from '@mui/icons-material/Favorite';

import { RoboSatsNoTextIcon } from '../Icons';
import { AppContext, type AppContextProps } from '../../contexts/AppContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

const ClientDialog = ({ open = false, onClose }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const { clientVersion } = useContext<AppContextProps>(AppContext);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <Typography component='h5' variant='h5'>
          {t('Client')}
        </Typography>

        <List dense>
          <Divider />

          <ListItem>
            <ListItemIcon>
              <RoboSatsNoTextIcon
                sx={{ width: '1.4em', height: '1.4em', right: '0.2em', position: 'relative' }}
              />
            </ListItemIcon>
            <ListItemText primary={clientVersion.long} secondary={t('RoboSats client version')} />
          </ListItem>

          <Divider />
          <ListItem>
            <ListItemIcon>
              <PublicIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'left',
                    flexWrap: 'wrap',
                  }}
                >
                  <span>{`${t('Made with')} `}</span>
                  <FavoriteIcon sx={{ color: '#ff0000', height: '22px', width: '22px' }} />
                  <span>{` ${t('and')} `}</span>
                  <BoltIcon sx={{ color: '#fcba03', height: '23px', width: '23px' }} />
                </div>
              }
              secondary={t('... somewhere on Earth!')}
            />
          </ListItem>
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default ClientDialog;
