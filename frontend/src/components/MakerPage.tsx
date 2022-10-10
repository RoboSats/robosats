import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Grid, useTheme, Paper } from '@mui/material';

import { LimitList } from '../models/Limit.model';
import Maker from '../models/Maker.model';
import MakerForm from './MakerForm';

import { useHistory } from 'react-router-dom';
import { StoreTokenDialog, NoRobotDialog } from './Dialogs';
import { apiClient } from '../services/api';

import { getCookie } from '../utils/cookies';
import { copyToClipboard } from '../utils/clipboard';

interface MakerPageProps {
  limits: LimitList;
  loadingLimits: boolean;
  type: number;
  windowHeight: number;
  currency: number;
  setAppState: (state: object) => void;
}

const MakerPage = ({
  limits,
  loadingLimits,
  currency,
  type,
  setAppState,
  windowHeight,
}: MakerPageProps): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();
  const history = useHistory();

  const [maker, setMaker] = useState<Maker>({
    isExplicit: false,
    amount: '',
    paymentMethod: [],
    paymentMethodText: 'Not specified',
    badPaymentMethod: false,
    premium: '',
    satoshis: '',
    publicExpiryTime: new Date(0, 0, 0, 23, 59),
    publicDuration: 86340,
    escrowExpiryTime: new Date(0, 0, 0, 3, 0),
    escrowDuration: 10800,
    bondSize: 3,
    amountRange: false,
    minAmount: '',
    maxAmount: '',
    badPremiumText: '',
    badSatoshisText: '',
  });

  const maxHeight = windowHeight ? windowHeight * 0.85 : 1000;
  const [openStoreToken, setOpenStoreToken] = useState<boolean>(false);
  return (
    <Grid container spacing={1} sx={{ minWidth: '60%' }}>
      {/* {getCookie('robot_token') ? (
      <StoreTokenDialog
        open={this.state.openStoreToken}
        onClose={() => this.setState({ openStoreToken: false })}
        onClickCopy={() =>
          copyToClipboard(getCookie('robot_token')) &
          props.setAppState({ copiedToken: true })
        }
        copyIconColor={this.props.copiedToken ? 'inherit' : 'primary'}
        onClickBack={() => this.setState({ openStoreToken: false })}
        onClickDone={this.handleCreateOfferButtonPressed}
      />
    ) : (
      <NoRobotDialog
        open={this.state.openStoreToken}
        onClose={() => this.setState({ openStoreToken: false })}
      />
    )} */}
      <Grid item xs={12}>
        <Paper elevation={12} style={{ padding: 8, width: '17.25em', maxHeight, overflow: 'auto' }}>
          <MakerForm
            limits={limits}
            loadingLimits={loadingLimits}
            pricingMethods={false}
            setAppState={setAppState}
            maker={maker}
            setMaker={setMaker}
            type={type}
            currency={currency}
          />
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Button
          color='secondary'
          variant='contained'
          onClick={() => history.goBack()}
          component='a'
        >
          {t('Back')}
        </Button>
      </Grid>
    </Grid>
  );
};

export default MakerPage;
