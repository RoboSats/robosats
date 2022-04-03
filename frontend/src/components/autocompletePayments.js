import React, { useState } from "react";
import PropTypes from 'prop-types';
import { useAutocomplete } from '@mui/base/AutocompleteUnstyled';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/material/styles';
import PaymentIcon from './PaymentIcons';
import {Button} from "@mui/material";

import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import AddIcon from '@mui/icons-material/Add';

const Root = styled('div')(
  ({ theme }) => `
  color: ${
    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,.85)'
  };
  font-size: 14px;
`,
);

const Label = styled('label')(
    ({ theme , error}) => `
  color: ${theme.palette.mode === 'dark' ? (error? '#f44336': '#cfcfcf') :  (error? '#dd0000':'#717171')};
  aling: center;
  padding: 0 0 4px;
  line-height: 1.5; f44336
  display: block;
  font-size: 13px;
`,
);

const InputWrapper = styled('div')(
  ({ theme , error}) => `
  width: 244px;
  min-height: 44px;
  max-height: 124px;
  border: 1px solid ${theme.palette.mode === 'dark' ? (error? '#f44336': '#434343') : (error? '#dd0000':'#c4c4c4')};
  background-color: ${theme.palette.mode === 'dark' ? '#141414' : '#fff'};
  border-radius: 4px;
  padding: 1px;
  display: flex;
  flex-wrap: wrap;
  overflow-y:auto;
  
  &:hover {
    border-color: ${theme.palette.mode === 'dark' ? (error? '#f44336':'#ffffff') : (error? '#dd0000' :'#2f2f2f')};
  }

  &.focused {
    border: 2px solid ${theme.palette.mode === 'dark' ? (error? '#f44336':'#90caf9') : (error? '#dd0000' :'#1976d2')};
  }

  & input {
    background-color: ${theme.palette.mode === 'dark' ? '#141414' : '#fff'};
    color: ${
      theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,.85)'
    };
    height: 30px;
    box-sizing: border-box;
    padding: 4px 6px;
    width: 0;
    min-width: 30px;
    font-size: 15px;
    flex-grow: 1;
    border: 0;
    margin: 0;
    outline: 0;
    max-height: 124px;
  }
`,
);

function Tag(props) {
  const { label, icon, onDelete, ...other } = props;
  return (
    <div {...other}>
        <div style={{position:'relative',left:'-5px',top:'4px'}}>
          <PaymentIcon width={22} height={22} icon={icon}/>
        </div>
        <span style={{position:'relative',left:'2px'}}>{label}</span>
      <CloseIcon onClick={onDelete} />
    </div>
  );
}

Tag.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  onDelete: PropTypes.func.isRequired,
};

const StyledTag = styled(Tag)(
  ({ theme }) => `
  display: flex;
  align-items: center;
  height: 34px;
  margin: 2px;
  line-height: 22px;
  background-color: ${
    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#fafafa'
  };
  border: 1px solid ${theme.palette.mode === 'dark' ? '#303030' : '#e8e8e8'};
  border-radius: 2px;
  box-sizing: content-box;
  padding: 0 4px 0 10px;
  outline: 0;
  overflow: hidden;

  &:focus {
    border-color: ${theme.palette.mode === 'dark' ? '#177ddc' : '#40a9ff'};
    background-color: ${theme.palette.mode === 'dark' ? '#003b57' : '#e6f7ff'};
  }

  & span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 15px;
  }

  & svg {
    font-size: 15px;
    cursor: pointer;
    padding: 4px;
  }
`,
);

const ListHeader = styled('span')(
    ({ theme }) => `
  color: ${theme.palette.mode === 'dark' ? '#90caf9' : '#1976d2'};
  aling: center;
  width: 141px;
  line-height:10px;
  max-height: 10px;
  display: inline-block;
  background-color: ${theme.palette.mode === 'dark' ? '#141414' : '#ffffff'};
  font-size: 12px;
  pointer-events: none;
`,
);

const Listbox = styled('ul')(
  ({ theme }) => `
  width: 244px;
  margin: 2px 0 0;
  padding: 0;
  position: absolute;
  list-style: none;
  background-color: ${theme.palette.mode === 'dark' ? '#141414' : '#fff'};
  overflow: auto;
  max-height: 250px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 999;

  & li {
    padding: 5px 12px;
    display: flex;

    & span {
      flex-grow: 1;
    }

    & svg {
      color: transparent;
    }

  }

  & li[aria-selected='true'] {
    background-color: ${theme.palette.mode === 'dark' ? '#2b2b2b' : '#fafafa'};
    font-weight: 600;

    & svg {
      color: ${theme.palette.primary.main};
    }
  }

  & li[data-focus='true'] {
    background-color: ${theme.palette.mode === 'dark' ? '#003b57' : '#e6f7ff'};
    cursor: pointer;

    & svg {
      color: currentColor;
    }
  }
`,
);

export default function AutocompletePayments(props) {
  const {
    getRootProps,
    getInputLabelProps,
    getInputProps,
    getTagProps,
    getListboxProps,
    getOptionProps,
    groupedOptions,
    value,
    focused="true",
    setAnchorEl,
  } = useAutocomplete({
    sx: {width:'200px', align:'left'},
    id: 'payment-methods',
    multiple: true,
    options: props.optionsType=="fiat" ? somePaymentMethods : someSwapDestinations,
    getOptionLabel: (option) => option.name,
    onInputChange: (e) => setVal(e ? (e.target.value ? e.target.value : "") : ""),
    onChange: (event, value) => props.onAutocompleteChange(optionsToString(value)),
    onClose: () => (setVal(() => "")),
  });

  const [val, setVal] = useState();

  function optionsToString(newValue){
    var str = '';
    var arrayLength = newValue.length;
      for (var i = 0; i < arrayLength; i++) {
          str += newValue[i].name + ' ';
      }
    return str.slice(0, -1);
  }

  function handleAddNew(inputProps){
    somePaymentMethods.push({name: inputProps.value, icon:'custom'})
    var a = value.push({name: inputProps.value, icon:'custom'});
    setVal(() => "");

    if(a || a == null){props.onAutocompleteChange(optionsToString(value))}
    return false
  };
  
  return (
    <Root>
      <div style={{height:'5px'}}></div>
      <div {...getRootProps()} >
        <Label {...getInputLabelProps()} error={props.error}>{props.label}</Label>
        <InputWrapper ref={setAnchorEl} error={props.error} className={focused ? 'focused' : ''}>
          {value.map((option, index) => (
            <StyledTag label={option.name} icon={option.icon} {...getTagProps({ index })} />
          ))}
          <input {...getInputProps()} value={val}/>
        </InputWrapper>
      </div>
      {groupedOptions.length > 0 ? (
        <Listbox {...getListboxProps()}>
            <div style={{position:'fixed', minHeight:'20px',  marginLeft: '53px', marginTop: '-13px'}}>
                <ListHeader><i>{props.listHeaderText}</i></ListHeader>
            </div>
          {groupedOptions.map((option, index) => (
            <li {...getOptionProps({ option, index })}>
              <Button fullWidth={true} color='inherit' size="small" sx={{textTransform: "none"}} style={{justifyContent: "flex-start"}}>
                  <div style={{position:'relative', right: '4px', top:'4px'}}>
                    <AddIcon style={{color : '#1976d2'}} sx={{width:18,height:18}} />
                  </div>
                  {option.name}
              </Button>
              <div style={{position:'relative', top: '5px'}}><CheckIcon/></div>
            </li>
          ))}
          {val != null?
              (val.length > 2 ?
                  <Button size="small" fullWidth={true} onClick={() => handleAddNew(getInputProps())}><DashboardCustomizeIcon sx={{width:18,height:18}}/>{props.addNewButtonText}</Button>
              :null)
            :null}
        </Listbox>
      ) : 
      //Here goes what happens if there is no groupedOptions
      (getInputProps().value.length > 0 ?
        <Listbox {...getListboxProps()}>
          <Button fullWidth={true} onClick={() => handleAddNew(getInputProps())}><DashboardCustomizeIcon sx={{width:20,height:20}}/>{props.addNewButtonText}</Button>
        </Listbox>
        :null)
      }
    </Root>
  );
}

// Most used Payment Methods RoboSats (First Month)
var somePaymentMethods = [
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
  {name: "Airtel Money",icon:'airtel'},
  {name: "MTN Money",icon:'mtn'},
  {name: "M-Pesa",icon:'mpesa'},
  {name: "MoMo",icon:'momo'},
  {name: "Tigo Pesa",icon:'tigopesa'},
  {name: "Cash F2F",icon:'cash'},
];

var someSwapDestinations = [
  {name: "On-Chain BTC",icon:'onchain'},
  {name: "RBTC",icon:'rbtc'},
  {name: "LBTC",icon:'lbtc'},
  {name: "WBTC",icon:'wbtc'},
];