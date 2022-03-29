import PaymentIcon from './PaymentIcons'
import React, { Component } from 'react'

const somePaymentMethods = [
    {name: "Revolut",icon:'revolut'},
    {name: "CashApp",icon:'cashapp'},
    {name: "Zelle",icon:'zelle'},
    {name: "Strike",icon:'strike'},
    {name: "Rebellion",icon:'rebellion'},
    {name: "Interac e-Transfer",icon:'interac'},
    {name: "Wise",icon:'wise'},
    {name: "Venmo",icon:'venmo'},
    {name: "Faster Payments",icon:'faster'},
    {name: "Paypal",icon:'paypal'},
    {name: "LINE Pay",icon:'linepay'},
    {name: "PromptPay",icon:'promptpay'},
    {name: "Bizum",icon:'bizum'},
    {name: "N26",icon:'n26'},
    {name: "Amazon GiftCard",icon:'amazon'},
    {name: "Bancolombia",icon:'bancolombia'},
    {name: "SPEI",icon:'spei'},
    {name: "PIX",icon:'pix'},
    {name: "HalCash",icon:'halcash'},
    {name: "Vivid",icon:'vivid'},
    {name: "Google Play Gift Code",icon:'googleplay'},
    {name: "Nequi",icon:'nequi'},
    {name: "MercadoPago",icon:'mercadopago'},
    {name: "Monero",icon:'monero'},
    {name: "USDT",icon:'usdt'},
    {name: "Dollar on Chain",icon:'doc'},
  ];

export default class PaymentText extends Component {
    constructor(props) {
      super(props);
    }
    this.props.text

    render() {
      return ( 
        <img {...this.props} src={icons[this.props.icon].image} style={{borderRadius: '23%'}}/>
      )
    }
  };