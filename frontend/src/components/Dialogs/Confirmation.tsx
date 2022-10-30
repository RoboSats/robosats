import React from 'react';
import { NoRobotDialog, StoreTokenDialog } from '.';
import { Page } from '../../basic/NavBar';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  setPage: (state: Page) => void;
  onClickDone: () => void;
  hasRobot: boolean;
}

const ConfirmationDialog = ({
  open,
  onClose,
  hasRobot,
  setPage,
  onClickDone,
}: ConfirmationDialogProps): JSX.Element => {
  return hasRobot ? (
    <StoreTokenDialog
      open={open}
      onClose={onClose}
      onClickBack={onClose}
      onClickDone={onClickDone}
    />
  ) : (
    <NoRobotDialog open={open} onClose={onClose} setPage={setPage} />
  );
};

export default ConfirmationDialog;
