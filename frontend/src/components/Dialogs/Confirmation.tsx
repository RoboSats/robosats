import React from 'react';
import { NoRobotDialog, StoreTokenDialog } from '.';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onClickDone: () => void;
  hasRobot: boolean;
  onClickGenerateRobot?: () => Promise<void>;
}

const ConfirmationDialog = ({
  open,
  onClose,
  hasRobot,
  onClickDone,
  onClickGenerateRobot = async () => {},
}: ConfirmationDialogProps): React.JSX.Element => {
  return hasRobot ? (
    <StoreTokenDialog
      open={open}
      onClose={onClose}
      onClickBack={onClose}
      onClickDone={onClickDone}
    />
  ) : (
    <NoRobotDialog open={open} onClose={onClose} onClickGenerateRobot={onClickGenerateRobot} />
  );
};

export default ConfirmationDialog;
