import React from 'react';
import { NoRobotDialog, StoreTokenDialog } from '.';
import { Page } from '../../basic/NavBar';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onClickDone: () => void;
  hasRobot: boolean;
}

const ConfirmationDialog = ({
  open,
  onClose,
  hasRobot,
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
    <NoRobotDialog open={open} onClose={onClose} />
  );
};

export default ConfirmationDialog;
