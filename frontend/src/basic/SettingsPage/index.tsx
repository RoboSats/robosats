import React, { useContext, useState } from 'react';
import { Button, Grid, Paper, TextField, Typography, Box } from '@mui/material';
import SettingsForm from '../../components/SettingsForm';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import FederationTable from '../../components/FederationTable';
import { t } from 'i18next';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import { styled } from '@mui/system';

const SettingsPage = (): JSX.Element => {
  const { windowSize, navbarHeight } = useContext<UseAppStoreType>(AppContext);
  const { federation, addNewCoordinator } = useContext<UseFederationStoreType>(FederationContext);

  const maxHeight = (windowSize.height * 0.65);
  const [newAlias, setNewAlias] = useState<string>('');
  const [newUrl, setNewUrl] = useState<string>('');
  const [error, setError] = useState<string>();

  const onionUrlPattern = /^((http|https):\/\/)?[a-zA-Z2-7]{16,56}\.onion$/;

  const addCoordinator: () => void = () => {
    if (federation.coordinators[newAlias]) {
      setError(t('Alias already exists'));
    } else {
      if (onionUrlPattern.test(newUrl)) {
        let fullNewUrl = newUrl;
        if (!/^((http|https):\/\/)/.test(fullNewUrl)) {
          fullNewUrl = `http://${newUrl}`;
        }
        addNewCoordinator(newAlias, fullNewUrl);
        setNewAlias('');
        setNewUrl('');
      } else {
        setError(t('Invalid Onion URL'));
      }
    }
  };

  return (
    <SettingsContainer elevation={12}>
      <Grid container>
        <LeftGrid item xs={12} md={6}>
          <SettingsForm />
        </LeftGrid>
        <RightGrid item xs={12} md={6}>
          <FederationTableWrapper>
            <FederationTable maxHeight={18} />
          </FederationTableWrapper>
          {error && (
            <ErrorTypography align='center' component='h2' variant='subtitle2' color='secondary'>
              {error}
            </ErrorTypography>
          )}
          <InputContainer>
            <StyledTextField
              id='outlined-basic'
              label={t('Alias')}
              variant='outlined'
              size='small'
              value={newAlias}
              onChange={(e) => {
                setNewAlias(e.target.value);
              }}
            />
            <StyledTextField
              id='outlined-basic'
              label={t('URL')}
              variant='outlined'
              size='small'
              value={newUrl}
              onChange={(e) => {
                setNewUrl(e.target.value);
              }}
            />
            <StyledButton
              disabled={false}
              onClick={addCoordinator}
              variant='contained'
              color='primary'
              size='small'
              type='submit'
            >
              {t('Add')}
            </StyledButton>
          </InputContainer>
        </RightGrid>
      </Grid>
    </SettingsContainer>
  );
};

// Styled Components
const SettingsContainer = styled(Paper)(({ theme }) => ({
  display: 'flex',
  width: '80vw',
  height: '70vh',
  margin: '0 auto',
  border: '2px solid #000',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '8px 8px 0px #000',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    width: '90vw',
    height: 'fit-content',
    marginTop: '30rem',
  },
}));

const LeftGrid = styled(Grid)(({ theme }) => ({
  padding: '2rem',
  borderRight: '2px solid #000',
  [theme.breakpoints.down('md')]: {
    padding: '1rem',
    borderRight: 'none',
  },
}));

const RightGrid = styled(Grid)(({ theme }) => ({
  padding: '2rem',
  display: 'flex',
  flexDirection: 'column',
  [theme.breakpoints.down('md')]: {
    padding: '1rem',
  },
}));

const FederationTableWrapper = styled(Box)({
  flexGrow: 1,
  '& > *': {
    width: '100% !important',
  },
});

const ErrorTypography = styled(Typography)({
  // You can add specific styles for the error message here if needed
});

const InputContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  gap: theme.spacing(1),
  marginTop: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  flexGrow: 1,
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(2),
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  maxHeight: 40,
  [theme.breakpoints.down('sm')]: {
    width: '100%',
  },
}));

export default SettingsPage;