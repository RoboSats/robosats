import React, { Component } from "react";

export default class OrderPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
        status: 0,
        type: 0,
        currency: 0,
        currencyCode: 'USD',
        is_participant: false,
        amount: 1,
        paymentMethod:"",
        explicit: false,
        premium: 0,
        satoshis: null,
        makerId: "", 
        // makerNick:"",
        // takerId: "", 
        // takerNick:"",
    };
    this.orderId = this.props.match.params.orderId;
    this.getOrderDetails();
  }

  getOrderDetails() {
    fetch('/api/order' + '?order_id=' + this.orderId)
      .then((response) => response.json())
      .then((data) => {
        this.setState({
            status: data.status,
            type: data.type,
            currency: data.currency,
            amount: data.amount,
            paymentMethod: data.payment_method,
            explicit: data.explicit,
            //premium: data.premium,
            // satoshis: satoshis,
            // makerId: maker, 
            // isParticipant: is_participant,
            // makerNick: maker_nick,
            // takerId: taker,
            // takerNick: taker_nick,
        });
      });
  }

  render (){
    return (
      <div>
        <p>This is the single order detail view page</p>
        <p>Order id: {this.orderId}</p>
        <p>Order status: {this.state.status}</p>
        <p>Order type: {this.state.type}</p>
        <p>Currency: {this.state.currencyCode}</p>
        <p>Amount: {this.state.amount}</p>
        <p>Payment method: {this.state.paymentMethod}</p>
        <p>Pricing method is explicit: {this.state.explicit.toString()}</p>
        {/* <p>Premium: {this.state.premium}</p>
        <p>Maker: {this.makerId}</p> */}
      </div>
    );
  }
}