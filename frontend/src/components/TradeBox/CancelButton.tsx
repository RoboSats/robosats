import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Tooltip } from '@mui/material';
import { Order } from '../../models';
import { LoadingButton } from '@mui/lab';

interface CancelButtonProps {
  order: Order;
  onClickCancel: () => void;
  openCancelDialog: () => void;
  openCollabCancelDialog: () => void;
  loading: boolean;
}

const CancelButton = ({
  order,
  onClickCancel,
  openCancelDialog,
  openCollabCancelDialog,
  loading = false,
}: CancelButtonProps): JSX.Element => {
  const { t } = useTranslation();

  const showCancelButton =
    (order.is_maker && [0, 1, 2].includes(order.status)) || [3, 6, 7].includes(order.status);
  const showCollabCancelButton = [8, 9].includes(order.status) && !order.asked_for_cancel;
  const noConfirmation =
    (order.is_maker && [0, 1, 2].includes(order.status)) || (order.is_taker && order.status === 3);

  return (
    <Box>
      {showCancelButton ? (
        <Tooltip
          placement='top'
          enterTouchDelay={500}
          enterDelay={700}
          enterNextDelay={2000}
          title={
            noConfirmation
              ? t('Cancel order and unlock bond instantly')
              : t('Unilateral cancelation (bond at risk!)')
          }
        >
          <div>
            <LoadingButton
              size='small'
              loading={loading}
              variant='outlined'
              color='secondary'
              onClick={noConfirmation ? onClickCancel : openCancelDialog}
            >
              {t('Cancel')}
            </LoadingButton>
          </div>
        </Tooltip>
      ) : (
        <></>
      )}
      {showCollabCancelButton ? (
        <LoadingButton
          size='small'
          loading={loading}
          variant='outlined'
          color='secondary'
          onClick={openCollabCancelDialog}
        >
          {t('Collaborative Cancel')}
        </LoadingButton>
      ) : (
        <></>
      )}
    </Box>
  );
};

export default CancelButton;
