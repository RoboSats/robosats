import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Paper, Alert, AlertTitle, Button } from '@mui/material';

const SelfhostedAlert = (): React.JSX.Element => {
  const { t } = useTranslation();
  const [show, setShow] = useState<boolean>(true);

  // If alert is hidden return null
  if (!show) {
    return <></>;
  }
  // Show selfhosted notice
  else {
    return (
      <div>
        <Paper elevation={6} className='unsafeAlert'>
          <Alert
            severity='success'
            sx={{ maxHeight: '8em' }}
            action={
              <Button
                color='success'
                onClick={() => {
                  setShow(false);
                }}
              >
                {t('Hide')}
              </Button>
            }
          >
            <AlertTitle>{t('You are self-hosting RoboSats')}</AlertTitle>
            {t(
              'RoboSats client is served from your own node granting you the strongest security and privacy.',
            )}
          </Alert>
        </Paper>
      </div>
    );
  }
};

export default SelfhostedAlert;
