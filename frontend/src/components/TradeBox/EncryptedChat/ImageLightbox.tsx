import React from 'react';
import { Dialog, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface Props {
  open: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

const ImageLightbox: React.FC<Props> = ({ open, onClose, imageUrl }) => {
  if (!imageUrl) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='xl'
      PaperProps={{
        style: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
          overflow: 'hidden',
        },
      }}
    >
      <IconButton
        onClick={onClose}
        style={{
          position: 'fixed',
          right: 20,
          top: 20,
          color: 'white',
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1400,
        }}
        size='large'
      >
        <CloseIcon />
      </IconButton>
      <DialogContent style={{ padding: 0, textAlign: 'center' }}>
        <img
          src={imageUrl}
          alt='Full size'
          style={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            objectFit: 'contain',
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ImageLightbox;
