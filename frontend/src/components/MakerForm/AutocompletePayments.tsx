import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useAutocomplete from '@mui/base/useAutocomplete';
import { styled } from '@mui/material/styles';
import {
  Button,
  Fade,
  Tooltip,
  Typography,
  Grow,
  useTheme,
  type SxProps,
  type Theme,
} from '@mui/material';
import { fiatMethods, swapMethods, PaymentIcon } from '../PaymentMethods';

// Icons
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const Root = styled('div')(
  ({ theme }) => `
  color: ${theme.palette.text.primary};
  font-size: ${theme.typography.fontSize};
`,
);

const Label = styled('label')(
  ({ theme, error, sx }) => `
  color: ${
    theme.palette.mode === 'dark'
      ? error === true
        ? '#f44336'
        : '#cfcfcf'
      : error === true
      ? '#dd0000'
      : '#717171'
  };
  pointer-events: none;
  position: relative;
  left: 1em;
  top: ${String(sx.top) ?? '0.72em'};
  maxHeight: 0em;
  height: 0em;
  white-space: no-wrap;
  font-size: 1em;
`,
);

const InputWrapper = styled('div')(
  ({ theme, error, sx }) => `
  min-height: ${String(sx.minHeight)};
  max-height: ${String(sx.maxHeight)};
  border: 1px solid ${
    theme.palette.mode === 'dark'
      ? error === ''
        ? '#f44336'
        : '#434343'
      : error === ''
      ? '#dd0000'
      : '#c4c4c4'
  };
  background-color: ${theme.palette.mode === 'dark' ? '#141414' : '#fff'};
  border-radius: 4px;
  border-color: ${sx.borderColor !== undefined ? `border-color ${String(sx.borderColor)}` : ''}
  padding: 1px;
  display: flex;
  flex-wrap: wrap;
  overflow-y:auto;
  align-items: center;

  &:hover {
    border-color: ${
      theme.palette.mode === 'dark'
        ? error === true
          ? '#f44336'
          : String(sx.hoverBorderColor)
        : error === true
        ? '#dd0000'
        : '#2f2f2f'
    };
  }

  &.focused {
    border: 2px solid ${
      theme.palette.mode === 'dark'
        ? error === true
          ? '#f44336'
          : '#90caf9'
        : error === true
        ? '#dd0000'
        : '#1976d2'
    };
  }

  & input {
    background-color: ${theme.palette.mode === 'dark' ? '#141414' : '#fff'};
    color: ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,.85)'};
    height: 2em;
    box-sizing: border-box;
    padding: 0.28em 0.4em;
    width: 0;
    min-width: 2.15em;
    font-size: ${theme.typography.fontSize * 1.0714};
    flex-grow: 1;
    border: 0;
    margin: 0;
    outline: 0;
    max-height: 8.6em;
  }
`,
);

interface TagProps {
  label: string;
  icon: string;
  onDelete: () => void;
}

const Tag: React.FC<TagProps> = ({ label, icon, onDelete, ...other }) => {
  const theme = useTheme();
  const iconSize = 1.5 * theme.typography.fontSize;
  return (
    <div {...other}>
      <div style={{ position: 'relative', left: '-5px', top: '0.28em' }}>
        <PaymentIcon width={iconSize} height={iconSize} icon={icon} />
      </div>
      <span style={{ position: 'relative', left: '2px' }}>{label}</span>
      <CloseIcon onClick={onDelete} />
    </div>
  );
};

const StyledTag = styled(Tag)(
  ({ theme, sx }) => `
  display: flex;
  align-items: center;
  height: ${String(sx?.height ?? '2.1em')};
  margin: 2px;
  line-height: 1.5em;
  background-color: ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#fafafa'};
  border: 1px solid ${theme.palette.mode === 'dark' ? '#303030' : '#e8e8e8'};
  border-radius: 2px;
  box-sizing: content-box;
  padding: 0 0.28em 0 0.65em;
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
    font-size: 0.928em;
  }

  & svg {
    font-size: 0.857em;
    cursor: pointer;
    padding: 0.28em;
  }
`,
);

const ListHeader = styled('span')(
  ({ theme }) => `
  color: ${theme.palette.mode === 'dark' ? '#90caf9' : '#1976d2'};
  align: left;
  line-height:0.7em;
  max-height: 10.7em;
  display: inline-block;
  background-color: ${theme.palette.mode === 'dark' ? '#141414' : '#ffffff'};
  font-size: 0.875em;
  pointer-events: none;
`,
);

const Listbox = styled('ul')(
  ({ theme, sx }) => `
  width: ${String(sx?.width ?? '15.6em')};
  margin: 2px 0 0;
  padding: 0;
  position: absolute;
  list-style: none;
  background-color: ${theme.palette.mode === 'dark' ? '#141414' : '#fff'};
  overflow: auto;
  max-height: 17em;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 999;

  & li {
    padding: 0em 0em;
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

interface AutocompletePaymentsProps {
  value: string;
  optionsType: 'fiat' | 'swap';
  onAutocompleteChange: (value: string) => void;
  tooltipTitle: string;
  labelProps: any;
  tagProps: any;
  listBoxProps: any;
  error: string;
  label: string;
  sx: SxProps<Theme>;
  addNewButtonText: string;
  isFilter: boolean;
  listHeaderText: string;
}

const AutocompletePayments: React.FC<AutocompletePaymentsProps> = (props) => {
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
    focused = true,
    setAnchorEl,
  } = useAutocomplete({
    fullWidth: true,
    id: 'payment-methods',
    multiple: true,
    value: props.value,
    options: props.optionsType === 'fiat' ? fiatMethods : swapMethods,
    getOptionLabel: (option) => option.name,
    onInputChange: (e) => {
      setVal(e.target.value ?? '');
    },
    onChange: (event, value) => {
      props.onAutocompleteChange(value);
    },
    onClose: () => {
      setVal(() => '');
    },
  });

  const [val, setVal] = useState('');
  const fewerOptions = groupedOptions.length > 8 ? groupedOptions.slice(0, 8) : groupedOptions;
  const theme = useTheme();
  const iconSize = 1.5 * theme.typography.fontSize;

  function handleAddNew(inputProps: any): void {
    fiatMethods.push({ name: inputProps.value, icon: 'custom' });
    const a = value.push({ name: inputProps.value, icon: 'custom' });
    setVal(() => '');

    if (a !== undefined) {
      props.onAutocompleteChange(value);
    }
  }

  return (
    <Root>
      <Tooltip
        placement='top'
        enterTouchDelay={props.tooltipTitle === '' ? 99999 : 300}
        enterDelay={props.tooltipTitle === '' ? 99999 : 700}
        enterNextDelay={2000}
        title={props.tooltipTitle}
      >
        <div {...getRootProps()}>
          <Fade
            appear={false}
            in={fewerOptions.length === 0 && value.length === 0 && val.length === 0}
          >
            <div style={{ height: 0, display: 'flex', alignItems: 'flex-start' }}>
              <Label
                {...getInputLabelProps()}
                sx={{ top: '0.72em', ...(props.labelProps?.sx ?? {}) }}
                error={Boolean(props.error)}
              >
                {props.label}
              </Label>
            </div>
          </Fade>
          <InputWrapper
            ref={setAnchorEl}
            error={Boolean(props.error)}
            className={focused ? 'focused' : ''}
            sx={{
              minHeight: '2.9em',
              maxHeight: '8.6em',
              hoverBorderColor: '#ffffff',
              ...props.sx,
            }}
          >
            {value.map((option, index) => (
              <StyledTag
                key={index}
                label={t(option.name)}
                icon={option.icon}
                sx={{ height: '2.1em', ...(props.tagProps ?? {}) }}
                {...getTagProps({ index })}
              />
            ))}
            {value.length > 0 && props.isFilter ? null : <input {...getInputProps()} value={val} />}
          </InputWrapper>
        </div>
      </Tooltip>
      <Grow in={fewerOptions.length > 0}>
        <Listbox sx={props.listBoxProps?.sx ?? undefined} {...getListboxProps()}>
          {!props.isFilter ? (
            <div
              style={{
                position: 'fixed',
                minHeight: '1.428em',
                marginLeft: `${3 - props.listHeaderText.length * 0.05}em`,
                marginTop: '-0.928em',
              }}
            >
              <ListHeader>
                <i>{props.listHeaderText + ' '} </i>{' '}
              </ListHeader>
            </div>
          ) : null}
          {fewerOptions.map((option, index) => (
            <li key={option.name} {...getOptionProps({ option, index })}>
              <Button
                fullWidth={true}
                color='inherit'
                size='small'
                sx={{ textTransform: 'none' }}
                style={{ justifyContent: 'flex-start' }}
              >
                <div style={{ padding: '0.286em', position: 'relative', top: '0.35em' }}>
                  <PaymentIcon width={iconSize} height={iconSize} icon={option.icon} />
                </div>
                <Typography variant='inherit' align='left'>
                  {t(option.name)}
                </Typography>
              </Button>
              <div style={{ position: 'relative', top: '0.357em' }}>
                <CheckIcon />
              </div>
            </li>
          ))}
          {val != null || !props.isFilter ? (
            val.length > 2 ? (
              <Button
                size='small'
                fullWidth={true}
                onClick={() => {
                  handleAddNew(getInputProps());
                }}
              >
                <DashboardCustomizeIcon sx={{ width: '1em', height: '1em' }} />
                {props.addNewButtonText}
              </Button>
            ) : null
          ) : null}
        </Listbox>
      </Grow>

      {/* Here goes what happens if there is no fewerOptions */}
      <Grow in={getInputProps().value.length > 0 && !props.isFilter && fewerOptions.length === 0}>
        <Listbox {...getListboxProps()}>
          <Button
            fullWidth={true}
            onClick={() => {
              handleAddNew(getInputProps());
            }}
          >
            <DashboardCustomizeIcon sx={{ width: '1.28em', height: '1.28em' }} />
            {props.addNewButtonText}
          </Button>
        </Listbox>
      </Grow>
    </Root>
  );
};

export default AutocompletePayments;
