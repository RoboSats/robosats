import React from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, useTheme } from '@mui/material';
import { Order } from '../../../models';
import stepXofY from '../stepXofY';
import currencies from '../../../../static/assets/currencies.json';
import { pn } from '../../../utils';

interface TakerFoundPrompProps {
  order: Order;
}

export const Title = ({ order }: TakerFoundPrompProps): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();
  const currencyCode: string = currencies[`${order.currency}`];

  let text = '';
  let color = 'inherit';

  if (order.is_maker && order.status === 0) {
    text = t('Lock {{amountSats}} Sats to PUBLISH order', { amountSats: pn(order.bond_satoshis) });
    color = 'primary';
  } else if (order.is_taker && order.status === 3) {
    text = t('Lock {{amountSats}} Sats to TAKE order', { amountSats: pn(order.bond_satoshis) });
    color = 'primary';
  } else if (order.is_seller && [6, 7].includes(order.status)) {
    text = t('Lock {{amountSats}} Sats as collateral', { amountSats: pn(order.escrow_satoshis) });
    color = 'warning';
  }

  {
    /* Maker and taker Bond request */
  }
  //             {this.props.data.is_maker & (this.props.data.status == 0) ? this.showQRInvoice() : ''}
  //             {this.props.data.is_taker & (this.props.data.status == 3) ? this.showQRInvoice() : ''}

  //             {/* Waiting for taker and taker bond request */}
  //             {this.props.data.is_maker & (this.props.data.status == 2) ? this.showPausedOrder() : ''}
  //             {this.props.data.is_maker & (this.props.data.status == 1) ? this.showMakerWait() : ''}
  //             {this.props.data.is_maker & (this.props.data.status == 3) ? this.showTakerFound() : ''}

  //             {/* Send Invoice (buyer) and deposit collateral (seller) */}
  //             {this.props.data.is_seller &
  //             (this.props.data.status == 6 || this.props.data.status == 7)
  //               ? this.showEscrowQRInvoice()
  //               : ''}
  //             {this.props.data.is_buyer & (this.props.data.status == 6 || this.props.data.status == 8)
  //               ? this.showInputInvoice()
  //               : ''}
  //             {this.props.data.is_buyer & (this.props.data.status == 7)
  //               ? this.showWaitingForEscrow()
  //               : ''}
  //             {this.props.data.is_seller & (this.props.data.status == 8)
  //               ? this.showWaitingForBuyerInvoice()
  //               : ''}

  //             {/* In Chatroom  */}
  //             {this.props.data.status == 9 || this.props.data.status == 10 ? this.showChat() : ''}

  //             {/* Trade Finished */}
  //             {this.props.data.is_seller & [13, 14, 15].includes(this.props.data.status)
  //               ? this.showRateSelect()
  //               : ''}
  //             {this.props.data.is_buyer & (this.props.data.status == 14) ? this.showRateSelect() : ''}

  //             {/* Trade Finished - Payment Routing Failed */}
  //             {this.props.data.is_buyer & (this.props.data.status == 13)
  //               ? this.showSendingPayment()
  //               : ''}

  //             {/* Trade Finished - Payment Routing Failed */}
  //             {this.props.data.is_buyer & (this.props.data.status == 15)
  //               ? this.showRoutingFailed()
  //               : ''}

  //             {/* Trade Finished - TODO Needs more planning */}
  //             {this.props.data.status == 11 ? this.showInDisputeStatement() : ''}
  //             {this.props.data.status == 16 ? this.showWaitForDisputeResolution() : ''}
  //             {(this.props.data.status == 17) & this.props.data.is_taker ||
  //             (this.props.data.status == 18) & this.props.data.is_maker
  //               ? this.showDisputeWinner()
  //               : ''}
  //             {(this.props.data.status == 18) & this.props.data.is_taker ||
  //             (this.props.data.status == 17) & this.props.data.is_maker
  //               ? this.showDisputeLoser()
  //               : ''}

  //             {/* Order has expired */}
  //             {this.props.data.status == 5 ? this.showOrderExpired() : ''}

  return (
    <Typography color={color} variant='body2' align='center'>
      <b>{text}</b> {stepXofY(order)}
    </Typography>
  );
};

export default Title;
