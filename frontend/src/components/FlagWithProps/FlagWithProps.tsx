import React from "react";
import Flags from 'country-flag-icons/react/3x2'
import SwapCallsIcon from '@mui/icons-material/SwapCalls';
import { GoldIcon, EarthIcon } from "../Icons";

type Props = {
  code: string;
}

const FlagWithProps = ({ code }: Props): JSX.Element => {
  const defaultProps = {
    width: 20,
    height: 20,
  };

  let flag: JSX.Element | null = null;

  if(code === 'AED') flag = <Flags.AE {...defaultProps}/>;
  if(code === 'AUD') flag = <Flags.AU {...defaultProps}/>;
  if(code === 'ARS') flag = <Flags.AR {...defaultProps}/>;
  if(code === 'BRL') flag = <Flags.BR {...defaultProps}/>;
  if(code === 'BYN') flag = <Flags.BY {...defaultProps}/>;
  if(code === 'CAD') flag = <Flags.CA {...defaultProps}/>;
  if(code === 'CHF') flag = <Flags.CH {...defaultProps}/>;
  if(code === 'CLP') flag = <Flags.CL {...defaultProps}/>;
  if(code === 'CNY') flag = <Flags.CN {...defaultProps}/>;
  if(code === 'EGP') flag = <Flags.EG {...defaultProps}/>;
  if(code === 'EUR') flag = <Flags.EU {...defaultProps}/>;
  if(code === 'HRK') flag = <Flags.HR {...defaultProps}/>;
  if(code === 'CZK') flag = <Flags.CZ {...defaultProps}/>;
  if(code === 'DKK') flag = <Flags.DK {...defaultProps}/>;
  if(code === 'GBP') flag = <Flags.GB {...defaultProps}/>;
  if(code === 'HKD') flag = <Flags.HK {...defaultProps}/>;
  if(code === 'HUF') flag = <Flags.HU {...defaultProps}/>;
  if(code === 'INR') flag = <Flags.IN {...defaultProps}/>;
  if(code === 'ISK') flag = <Flags.IS {...defaultProps}/>;
  if(code === 'JPY') flag = <Flags.JP {...defaultProps}/>;
  if(code === 'KRW') flag = <Flags.KR {...defaultProps}/>;
  if(code === 'LKR') flag = <Flags.LK {...defaultProps}/>;
  if(code === 'MAD') flag = <Flags.MA {...defaultProps}/>;
  if(code === 'MXN') flag = <Flags.MX {...defaultProps}/>;
  if(code === 'NOK') flag = <Flags.NO {...defaultProps}/>;
  if(code === 'NZD') flag = <Flags.NZ {...defaultProps}/>;
  if(code === 'PLN') flag = <Flags.PL {...defaultProps}/>;
  if(code === 'RON') flag = <Flags.RO {...defaultProps}/>;
  if(code === 'RUB') flag = <Flags.RU {...defaultProps}/>;
  if(code === 'SEK') flag = <Flags.SE {...defaultProps}/>;
  if(code === 'SGD') flag = <Flags.SG {...defaultProps}/>;
  if(code === 'VES') flag = <Flags.VE {...defaultProps}/>;
  if(code === 'TRY') flag = <Flags.TR {...defaultProps}/>;
  if(code === 'USD') flag = <Flags.US {...defaultProps}/>;
  if(code === 'ZAR') flag = <Flags.ZA {...defaultProps}/>;
  if(code === 'COP') flag = <Flags.CO {...defaultProps}/>;
  if(code === 'PEN') flag = <Flags.PE {...defaultProps}/>;
  if(code === 'UYU') flag = <Flags.UY {...defaultProps}/>;
  if(code === 'PYG') flag = <Flags.PY {...defaultProps}/>;
  if(code === 'BOB') flag = <Flags.BO {...defaultProps}/>;
  if(code === 'IDR') flag = <Flags.ID {...defaultProps}/>;
  if(code === 'ANG') flag = <Flags.CW {...defaultProps}/>;
  if(code === 'CRC') flag = <Flags.CR {...defaultProps}/>;
  if(code === 'CUP') flag = <Flags.CU {...defaultProps}/>;
  if(code === 'DOP') flag = <Flags.DO {...defaultProps}/>;
  if(code === 'GHS') flag = <Flags.GH {...defaultProps}/>;
  if(code === 'GTQ') flag = <Flags.GT {...defaultProps}/>;
  if(code === 'ILS') flag = <Flags.IL {...defaultProps}/>;
  if(code === 'JMD') flag = <Flags.JM {...defaultProps}/>;
  if(code === 'KES') flag = <Flags.KE {...defaultProps}/>;
  if(code === 'KZT') flag = <Flags.KZ {...defaultProps}/>;
  if(code === 'MYR') flag = <Flags.MY {...defaultProps}/>;
  if(code === 'NAD') flag = <Flags.NA {...defaultProps}/>;
  if(code === 'NGN') flag = <Flags.NG {...defaultProps}/>;
  if(code === 'AZN') flag = <Flags.AZ {...defaultProps}/>;
  if(code === 'PAB') flag = <Flags.PA {...defaultProps}/>;
  if(code === 'PHP') flag = <Flags.PH {...defaultProps}/>;
  if(code === 'PKR') flag = <Flags.PK {...defaultProps}/>;
  if(code === 'QAR') flag = <Flags.QA {...defaultProps}/>;
  if(code === 'SAR') flag = <Flags.SA {...defaultProps}/>;
  if(code === 'THB') flag = <Flags.TH {...defaultProps}/>;
  if(code === 'TTD') flag = <Flags.TT {...defaultProps}/>;
  if(code === 'VND') flag = <Flags.VN {...defaultProps}/>;
  if(code === 'XOF') flag = <Flags.BJ {...defaultProps}/>;
  if(code === 'TWD') flag = <Flags.TW {...defaultProps}/>;
  if(code === 'TZS') flag = <Flags.TZ {...defaultProps}/>;
  if(code === 'XAF') flag = <Flags.CM {...defaultProps}/>;
  if(code === 'UAH') flag = <Flags.UA {...defaultProps}/>;
  if(code === 'TND') flag = <Flags.TN {...defaultProps}/>;
  if(code === 'ANY') flag = <EarthIcon {...defaultProps}/>;
  if(code === 'XAU') flag = <GoldIcon {...defaultProps}/>;
  if(code === 'BTC') flag = <SwapCallsIcon color="primary"/>;

  return (
    <div style={{width:28, height: 20}}>{flag}</div>
  );
};

export default FlagWithProps;
