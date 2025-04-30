import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Tooltip } from '@mui/material';
import { type Order } from '../../models';
import { LoadingButton } from '@mui/lab';
import CancelOrderDialog from '../Dialogs/CancelOrder';

interface CancelButtonProps {
  order: Order | null;
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
  const [openCancelWarning, setOpenCancelWarning] = useState<boolean>(false);

  const showCancelButton =
    Boolean(order?.is_maker && [0, 1, 2].includes(order?.status)) ||
    Boolean([3, 6, 7].includes(order?.status ?? -1));
  const showCollabCancelButton = order?.status === 9 && !order?.asked_for_cancel;
  const unTaken = Boolean(order?.is_maker && [1, 2].includes(order?.status));
  const noConfirmation =
    Boolean(order?.is_maker && [0, 1, 2].includes(order?.status)) ||
    Boolean(order?.is_taker && order?.status === 3);
  const noBond =
    Boolean(order?.is_maker && order?.status === 0) ||
    Boolean(order?.is_taker && order?.status === 3);

  return (
    <Box>
      {showCancelButton ? (
        <Tooltip
          placement='top'
          enterTouchDelay={500}
          enterDelay={700}
          enterNextDelay={2000}
          title={noConfirmation ? t('Cancel order') : t('Unilateral cancelation (bond at risk!)')}
        >
          <div>
            <LoadingButton
              size='small'
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
          </div>
        </Tooltip>
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
