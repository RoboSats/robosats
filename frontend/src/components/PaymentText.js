import React, { Component } from 'react'
import { withTranslation, Trans} from "react-i18next";
import PaymentIcon from './PaymentIcons'
import {Tooltip} from "@mui/material"

const someMethods = [
    {name: "Revolut",icon:'revolut'},
    {name: "CashApp",icon:'cashapp'},
    {name: "Zelle",icon:'zelle'},
    {name: "Strike",icon:'strike'},
    {name: "Rebellion",icon:'rebellion'},
    {name: "Instant SEPA", icon:'sepa'},
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
    {name: "ShakePay",icon:'shakepay'},
    {name: "DaviPlata",icon:'daviplata'},
    {name: "CoDi",icon:'codi'},
    {name: "TaiwanPay",icon:'taiwanpay'},
    {name: "MaiCoin",icon:'maicoin'},
    {name: "MercadoPago",icon:'mercadopago'},
    {name: "Monero",icon:'monero'},
    {name: "USDT",icon:'usdt'},
    {name: "Airtel Money",icon:'airtel'},
    {name: "MTN Money",icon:'mtn'},
    {name: "M-Pesa",icon:'mpesa'},
    {name: "MoMo",icon:'momo'},
    {name: "Tigo Pesa",icon:'tigopesa'},
    {name: "Cash F2F",icon:'cash'},
    {name: "On-Chain BTC",icon:'onchain'},
    {name: "RBTC",icon:'rbtc'},
    {name: "LBTC",icon:'lbtc'},
    {name: "WBTC",icon:'wbtc'},
  ];

class PaymentText extends Component {
    constructor(props) {
      super(props);
    }
    

    parseText(){
        const { t } = this.props;
        var rows = [];
        var custom_methods = this.props.text;
        // Adds icons for each PaymentMethod that matches
        someMethods.forEach((method, i) =>{
            if(this.props.text.includes(method.name)){
                custom_methods = custom_methods.replace(method.name,'')
                rows.push(
                    <Tooltip placement="top" enterTouchDelay="0" title={t(method.name)}>
                        <div style={{display: 'inline-block', width: this.props.size+2, height: this.props.size}}>
                            <PaymentIcon width={this.props.size} height={this.props.size} icon={method.icon}/>
                        </div>
                    </Tooltip>
                );
            }
        })

        // Adds a Custom icon if there are words that do not match
        var chars_left = custom_methods.replace('   ','').replace('  ','').replace(' ','').replace(' ','').replace(' ','')
        
        if(chars_left.length > 0){rows.push(
            <Tooltip placement="top" enterTouchDelay="0" title={this.props.verbose ? this.props.othersText: this.props.othersText+": "+ custom_methods} >
                <div style={{position:'relative', display: 'inline-block',width: this.props.size+2, maxHeight: this.props.size, top:'-1px'}}>
                    <PaymentIcon width={this.props.size*1.1} height={this.props.size*1.1} icon={"custom"}/>
                </div>
            </Tooltip>
            )}

        if(this.props.verbose){
            return (<>{rows} <div style={{display: 'inline-block'}}> <span>{custom_methods}</span></div></>)
        }else{
            return rows
        }
    }

    render() {
      return ( 
        <div style={{display:'flex',alignItems:'center', flexWrap:'wrap'}}>
            {this.parseText()}
        </div>
      )
    }
};

export default withTranslation()(PaymentText);