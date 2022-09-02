import React, { useState } from "react";
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useAutocomplete } from '@mui/base/AutocompleteUnstyled';
import { styled } from '@mui/material/styles';
import { Button, Tooltip }  from "@mui/material";
import { paymentMethods, swapDestinations } from "./payment-methods/Methods";

// Icons
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import AddIcon from '@mui/icons-material/Add';
import PaymentIcon from './payment-methods/Icons'
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const Root = styled('div')(
  ({ theme }) => `
  color: ${
    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,.85)'
  };
  font-size: ${14/16}em;
`,
);

const Label = styled('label')(
    ({ theme , error}) => `
  color: ${theme.palette.mode === 'dark' ? (error? '#f44336': '#cfcfcf') :  (error? '#dd0000':'#717171')};
  align: center;
  line-height: 1.5; f44336
  display: block;
  font-size: ${13/16}em;
`,
);

const InputWrapper = styled('div')(
  ({ theme , error}) => `
  width: ${244/16}em;
  min-height: ${44/16}em;
  max-height: ${124/16}em;
  border: 1px solid ${theme.palette.mode === 'dark' ? (error? '#f44336': '#434343') : (error? '#dd0000':'#c4c4c4')};
  background-color: ${theme.palette.mode === 'dark' ? '#141414' : '#fff'};
  border-radius: ${4/16}em;
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
    height: ;${30/16}em
    box-sizing: border-box;
    padding: ${4/16}em ${6/16}em;
    width: 0;
    min-width: ${30/16}em;
    font-size: ${15/16}em;
    flex-grow: 1;
    border: 0;
    margin: 0;
    outline: 0;
    max-height: ${124/16}em;
  }
`,
);

function Tag(props) {
  const { label, icon, onDelete, ...other } = props;
  return (
    <div {...other}>
        <div style={{position:'relative',left: `-${5/16}em`,top: `${4/16}em`}}>
          <PaymentIcon width={`22em`} height={`22em`} icon={icon}/>
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
  height: ${34/16}em;
  margin: ${2/16}em;
  line-height: ${22/16}em;
  background-color: ${
    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#fafafa'
  };
  border: 1px solid ${theme.palette.mode === 'dark' ? '#303030' : '#e8e8e8'};
  border-radius: 2px;
  box-sizing: content-box;
  padding: 0 ${4/16}em 0 ${10/16}em;
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
    font-size: ${15/16}em;
  }

  & svg {
    font-size: ${15/16}em;
    cursor: pointer;
    padding: ${4/16}em;
  }
`,
);

const ListHeader = styled('span')(
    ({ theme }) => `
  color: ${theme.palette.mode === 'dark' ? '#90caf9' : '#1976d2'};
  align: left;
  line-height: ${10/16}em;
  max-height: ${10/16}em;
  display: inline-block;
  background-color: ${theme.palette.mode === 'dark' ? '#141414' : '#ffffff'};
  font-size: ${12/16}em;
  pointer-events: none;
`,
);

const Listbox = styled('ul')(
  ({ theme }) => `
  width: ${244/16}em;
  margin: 2px 0 0;
  padding: 0;
  position: absolute;
  list-style: none;
  background-color: ${theme.palette.mode === 'dark' ? '#141414' : '#fff'};
  overflow: auto;
  max-height: ${250/16}em;
  border-radius: ${4/16}em;
  box-shadow: 0 ${2/16}em ${8/16}em rgba(0, 0, 0, 0.15);
  z-index: 999;

  & li {
    padding: ${5/16}em ${12/16}em;
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
  const { t } = useTranslation();
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
    sx: {width: `${200/16}em`, align:'left'},
    id: 'payment-methods',
    multiple: true,
    options: props.optionsType=="fiat" ? paymentMethods : swapDestinations,
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
    paymentMethods.push({name: inputProps.value, icon:'custom'})
    var a = value.push({name: inputProps.value, icon:'custom'});
    setVal(() => "");

    if(a || a == null){props.onAutocompleteChange(optionsToString(value))}
    return false
  };

  return (
    <Root>
      <div style={{height: `${5/16}em`}} />
      <Tooltip placement="top" enterTouchDelay={300} enterDelay={700} enterNextDelay={2000} title={props.tooltipTitle}>
        <div {...getRootProps()} >
          <Label {...getInputLabelProps()} error={props.error ? "error" : null}> {props.label}</Label>
          <InputWrapper ref={setAnchorEl} error={props.error ? "error" : null} className={focused ? 'focused' : ''}>
            {value.map((option, index) => (
              <StyledTag label={t(option.name)} icon={option.icon} {...getTagProps({ index })} />
            ))}
            <input {...getInputProps()} value={val ? val :""}/>
          </InputWrapper>
        </div>
      </Tooltip>
      {groupedOptions.length > 0 ? (
        <Listbox {...getListboxProps()}>
            <div style={{position:'fixed', minHeight: `${20/16}em`,  marginLeft: `${(120-3*props.listHeaderText.length)/16}em`, marginTop: `-${13/16}em`}}>
                <ListHeader ><i>{props.listHeaderText+" "} </i> </ListHeader>
            </div>
          {groupedOptions.map((option, index) => (
            <li key={option.name} {...getOptionProps({ option, index })}>
              <Button fullWidth={true} color='inherit' size="small" sx={{textTransform: "none"}} style={{justifyContent: "flex-start"}}>
                  <div style={{position:'relative', right: `${4/16}em`, top: `${4/16}em`}}>
                    <AddIcon style={{color : '#1976d2'}} sx={{width: `${18/24}em`, height: `${18/24}em`}} />
                  </div>
                  {t(option.name)}
              </Button>
              <div style={{position:'relative', top: `${5/16}em`}}><CheckIcon/></div>
            </li>
          ))}
          {val != null?
              (val.length > 2 ?
                  <Button size="small" fullWidth={true} onClick={() => handleAddNew(getInputProps())}><DashboardCustomizeIcon sx={{width: `${18/16}em`, height: `${18/16}em`}}/>{props.addNewButtonText}</Button>
              :null)
            :null}
        </Listbox>
      ) :
      //Here goes what happens if there is no groupedOptions
      (getInputProps().value.length > 0 ?
        <Listbox {...getListboxProps()}>
          <Button fullWidth={true} onClick={() => handleAddNew(getInputProps())}><DashboardCustomizeIcon sx={{width: `${20/16}em`, height: `${20/16}em`}}/>{props.addNewButtonText}</Button>
        </Listbox>
        :null)
      }
    </Root>
  );
}
