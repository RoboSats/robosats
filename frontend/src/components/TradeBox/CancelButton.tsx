import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Grid, Tooltip } from '@mui/material';
import { type Order } from '../../models';
import { LoadingButton } from '@mui/lab';
import CancelOrderDialog from '../Dialogs/CancelOrder';
import { UseFederationStoreType, FederationContext } from '../../contexts/FederationContext';
import { systemClient } from '../../services/System';

interface CancelButtonProps {
  order: Order | null;
  onClickCancel: () => void;
  openCancelDialog: () => void;
  loading: boolean;
}

const CancelButton = ({
  order,
  onClickCancel,
  openCancelDialog,
  loading = false,
}: CancelButtonProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const [openCancelWarning, setOpenCancelWarning] = useState<boolean>(false);

  const showCancelButton =
    Boolean(order?.is_maker && [0, 1, 2].includes(order?.status)) ||
    Boolean([3, 6, 7].includes(order?.status ?? -1));
  const unTaken = Boolean(order?.is_maker && [1, 2].includes(order?.status));
  const noConfirmation =
    Boolean(order?.is_maker && [0, 1, 2].includes(order?.status)) ||
    Boolean(order?.is_taker && order?.status === 3);
  const noBond =
    Boolean(order?.is_maker && order?.status === 0) ||
    Boolean(order?.is_taker && order?.status === 3);

  const copyOrderUrl = () => {
    const coordinator = federation.getCoordinator(order?.shortAlias ?? '');
    const orderOriginUrl = `${coordinator.url}/order/${coordinator.shortAlias}/${order?.id}`;
    systemClient.copyToClipboard(orderOriginUrl);
  };

  return (
    <Box>
      {showCancelButton ? (
        <Grid item style={{ paddingTop: '8px', display: 'flex', flexDirection: 'row' }}>
          <Tooltip
            placement='top'
            enterTouchDelay={500}
            enterDelay={700}
            enterNextDelay={2000}
            title={t('Copy order URL')}
          >
            <div style={{ marginRight: 18 }}>
              <LoadingButton size='large' variant='outlined' color='primary' onClick={copyOrderUrl}>
                {t('Copy URL')}
              </LoadingButton>
            </div>
          </Tooltip>
          <Tooltip
            placement='top'
            enterTouchDelay={500}
            enterDelay={700}
            enterNextDelay={2000}
            title={noConfirmation ? t('Cancel order') : t('Unilateral cancelation (bond at risk!)')}
          >
            <LoadingButton
              size='large'
              loading={loading}
              variant='outlined'
              color='secondary'
              onClick={
                noBond
                  ? () => {
                      setOpenCancelWarning(true);
                    }
                  : unTaken
                    ? onClickCancel
                    : openCancelDialog
              }
            >
              {t('Cancel')}
            </LoadingButton>
          </Tooltip>
        </Grid>
      ) : (
        <></>
      )}
      <CancelOrderDialog
        open={openCancelWarning}
        onClose={() => {
          setOpenCancelWarning(false);
        }}
        onAccept={onClickCancel}
      />
    </Box>
  );
};

export default CancelButton;
