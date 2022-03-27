import React, { Component } from 'react';
import Flag from 'react-flagkit';
import SwapCallsIcon from '@mui/icons-material/SwapCalls';

export default function getFlags(code){
    if(code == 'BTC') return <SwapCallsIcon color="primary"/>;
    if(code == 'XAU') return '🟨';

    if(code == 'AZN') return '🇦🇿'; // code AZ not working
    if(code == 'XOF') code = 'SN';
    if(code == 'ANG') code = 'CW';
    return <div style={{width:24, height: 18}}><Flag country={code.substring(0,2)} size={18}/></div>;
};
