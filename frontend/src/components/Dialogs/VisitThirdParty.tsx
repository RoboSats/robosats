import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
} from '@mui/material';
import { type PublicOrder } from '../../models';
import { NewTabIcon } from '../Icons';

interface Props {
  open: boolean;
  onClose: () => void;
  thirdPartyOrder?: PublicOrder;
}

const VisitThirdParty = ({ open, onClose, thirdPartyOrder }: Props): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('Open external order')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {thirdPartyOrder?.link
            ? t(
                'This order is not managed by a RoboSats coordinator. Please ensure you are comfortable with the privacy and trust trade-offs. You will open an external link or app',
              )
            : t(
                "This order is not managed by a RoboSats coordinator. {{alias}} does not provide web access to it; please check {{alias}}'s platform for more details.",
                { alias: thirdPartyOrder?.coordinatorShortAlias },
              )}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            onClose();
          }}
        >
          {t('Cancel')}
        </Button>
        {thirdPartyOrder?.link && (
          <Button
            onClick={() => {
              if (thirdPartyOrder?.link) window.open(thirdPartyOrder?.link, '_blank')?.focus();
              onClose();
            }}
          >
            {t('Browser')}
            <div style={{ width: '0.5em' }} />
            <NewTabIcon sx={{ width: '0.7em', height: '0.7em' }} />
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default VisitThirdParty;
