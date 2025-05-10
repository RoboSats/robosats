import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Switch,
  Tooltip,
  Grid,
  Typography,
} from '@mui/material';
import { PhotoSizeSelectActual } from '@mui/icons-material';
import Map from '../Map';

interface Props {
  open: boolean;
  orderType: number;
  latitude?: number;
  longitude?: number;
  onClose?: (position?: [number, number]) => void;
  interactive?: boolean;
  zoom?: number;
  message?: string;
}

const F2fMapDialog = ({
  open = false,
  orderType,
  onClose = () => {},
  latitude,
  longitude,
  interactive = false,
  zoom,
  message = '',
}: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const [position, setPosition] = useState<[number, number]>();
  const [useTiles, setUseTiles] = useState<boolean>(false);
  const [acceptedTilesWarning, setAcceptedTilesWarning] = useState<boolean>(false);
  const [openWarningDialog, setOpenWarningDialog] = useState<boolean>(false);

  const onSave: () => void = () => {
    if (position?.[0] != null && position?.[1] != null) {
      onClose([position[0] + Math.random() * 0.1 - 0.05, position[1] + Math.random() * 0.1 - 0.05]);
    }
  };

  useEffect(() => {
    if (open && latitude != null && longitude != null) {
      setPosition([latitude, longitude]);
    } else {
      setPosition(undefined);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      fullWidth
      onClose={() => {
        onClose();
      }}
      aria-labelledby='worldmap-dialog-title'
      aria-describedby='worldmap-description'
      maxWidth={false}
    >
      <Dialog
        open={openWarningDialog}
        onClose={() => {
          setOpenWarningDialog(false);
        }}
      >
        <DialogTitle>{t('Download high resolution map?')}</DialogTitle>
        <DialogContent>
          {t(
            'By doing so, you will be fetching map tiles from a third-party provider. Depending on your setup, private information might be leaked to servers outside the RoboSats federation.',
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenWarningDialog(false);
            }}
          >
            {t('Close')}
          </Button>
          <Button
            onClick={() => {
              setOpenWarningDialog(false);
              setAcceptedTilesWarning(true);
              setUseTiles(true);
            }}
          >
            {t('Accept')}
          </Button>
        </DialogActions>
      </Dialog>

      <DialogTitle>
        <Grid container justifyContent='space-between' spacing={0} sx={{ maxHeight: '1em' }}>
          <Grid item>{interactive ? t('Choose a location') : t('Map')}</Grid>
          <Grid item>
            <Tooltip enterTouchDelay={0} placement='top' title={t('Show tiles')}>
              <div
                style={{
                  display: 'flex',
                  width: '4em',
                  height: '1.1em',
                }}
              >
                <Switch
                  size='small'
                  checked={useTiles}
                  onChange={() => {
                    if (acceptedTilesWarning) {
                      setUseTiles((value) => !value);
                    } else {
                      setOpenWarningDialog(true);
                    }
                  }}
                />
                <PhotoSizeSelectActual sx={{ color: 'text.secondary' }} />
              </div>
            </Tooltip>
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent
        style={{
          height: '100vh',
          width: '100%',
          padding: 0,
          paddingBottom: '0.5em',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Map
          interactive={interactive}
          orderType={orderType}
          useTiles={useTiles}
          position={position}
          setPosition={setPosition}
          zoom={zoom}
          center={[latitude ?? 0, longitude ?? 0]}
        />
      </DialogContent>
      <DialogActions sx={{ paddingTop: 0 }}>
        <Grid container direction='row' spacing={1} justifyContent='flex-end'>
          <Grid item>
            <Typography variant='caption' color='text.secondary'>
              {message}
            </Typography>
          </Grid>
          <Grid item>
            {interactive ? (
              <Button
                color='primary'
                variant='contained'
                onClick={onSave}
                disabled={position == null}
              >
                {t('Save')}
              </Button>
            ) : (
              <Button
                color='primary'
                variant='contained'
                onClick={() => {
                  onClose();
                }}
                disabled={position == null}
              >
                {t('Close')}
              </Button>
            )}
          </Grid>
        </Grid>
      </DialogActions>
    </Dialog>
  );
};

export default F2fMapDialog;
