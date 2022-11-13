import React from 'react';
import { useTranslation } from 'react-i18next';
import { Collapse, Box } from '@mui/material';
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
  const showCollabCancelButton = [8, 9].includes(order.status);
  const noConfirmation =
    (order.is_maker && [0, 1, 2].includes(order.status)) || (order.is_taker && order.status === 3);

  return (
    <Box>
      {showCancelButton ? (
        <Collapse in={showCancelButton}>
          <LoadingButton
            size='small'
            loading={loading}
            variant='outlined'
            color='secondary'
            onClick={noConfirmation ? onClickCancel : openCancelDialog}
          >
            {t('Cancel')}
          </LoadingButton>
        </Collapse>
      ) : (
        <></>
      )}
      {showCollabCancelButton ? (
        <Collapse in={showCollabCancelButton}>
          <LoadingButton
            size='small'
            loading={loading}
            variant='outlined'
            color='secondary'
            onClick={openCollabCancelDialog}
          >
            {t('Collaborative Cancel')}
          </LoadingButton>
        </Collapse>
      ) : (
        <></>
      )}
    </Box>
  );
};

export default CancelButton;
