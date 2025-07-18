import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAutocomplete } from '@mui/base/useAutocomplete';
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
  Chip,
} from '@mui/material';
import { fiatMethods, swapMethods, PaymentIcon } from '../PaymentMethods';

// Icons
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { MUIStyledCommonProps } from '@mui/system';
import { PaymentMethod } from '../PaymentMethods/MethodList';

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
  top: ${String(sx?.top ?? '0.72em')};
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
  icon?: string;
  onDelete?: () => void;
  onClick: () => void;
}

const Tag: React.FC<TagProps> = ({ label, icon, onDelete, onClick, ...other }) => {
  const theme = useTheme();
  const iconSize = 1.5 * theme.typography.fontSize;
  return (
    <div {...other}>
      {icon ? (
        <div style={{ position: 'relative', left: '-5px', top: '0.28em' }} onClick={onClick}>
          <PaymentIcon width={iconSize} height={iconSize} icon={icon} />
        </div>
      ) : null}
      <span style={{ position: 'relative', left: '2px' }} onClick={onClick}>
        {label}
      </span>
      <CloseIcon className='delete-icon' onClick={onDelete} />
    </div>
  );
};

const StyledChip = styled(Chip)(
  ({ theme, sx }) => `
  display: flex;
  align-items: center;
  height: ${String(sx?.height ?? '1.6rem')};
  margin: 2px;
  line-height: 1.5em;
  background-color: ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#fafafa'};
  border: 1px solid ${theme.palette.mode === 'dark' ? '#303030' : '#e8e8e8'};
  border-radius: 2px;
  box-sizing: content-box;
  padding: 0;
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
`,
);

const StyledTag = styled(Tag)(
  ({ theme, sx }) => `
  display: flex;
  align-items: center;
  height: ${String(sx?.height ?? '1.6rem')};
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
  paymentMethods: string[];
  paymentMethodsText: string;
  optionsType: 'fiat' | 'swap';
  setHasCustomPaymentMethod?: (value: boolean) => void;
  onAutocompleteChange: (value: string[]) => void;
  tooltipTitle: string;
  labelProps: MUIStyledCommonProps;
  tagProps: MUIStyledCommonProps;
  listBoxProps: MUIStyledCommonProps;
  error: boolean;
  label: string;
  sx: SxProps<Theme>;
  addNewButtonText: string;
  isFilter: boolean;
  multiple: boolean;
  optionsDisplayLimit?: number;
  listHeaderText: string;
}

const AutocompletePayments: React.FC<AutocompletePaymentsProps> = (props) => {
  // ** State
  const [val, setVal] = useState('');
  const [showFilterInput, setShowFilterInput] = useState(false);
  const [customOptions, setCustomOptions] = useState<PaymentMethod[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<PaymentMethod[]>([]);
  const [options, setOptions] = useState<PaymentMethod[]>([]);

  // ** Hooks
  const { t } = useTranslation();
  const filterInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOptions(props.optionsType === 'fiat' ? [...customOptions, ...fiatMethods] : swapMethods);
  }, [props.optionsType]);

  useEffect(() => {
    const selectedOptions: PaymentMethod[] = [];
    const customSelectedOptions: PaymentMethod[] = [];

    props.paymentMethods?.forEach((pm) => {
      const paymentMethod = [...fiatMethods, ...swapMethods].find(
        (defaultPaymentMethod) => pm === defaultPaymentMethod.name,
      );
      if (paymentMethod) {
        selectedOptions.push(paymentMethod);
      } else {
        customSelectedOptions.push({ name: pm, icon: 'custom' });
      }
    });

    setCustomOptions(customSelectedOptions);
    if (props.setHasCustomPaymentMethod)
      props.setHasCustomPaymentMethod(customSelectedOptions.length > 0);
    setSelectedOptions([...selectedOptions, ...customSelectedOptions]);
  }, [props.paymentMethodsText]);

  const {
    getRootProps,
    getInputLabelProps,
    getInputProps,
    getTagProps,
    getListboxProps,
    getOptionProps,
    groupedOptions,
    value,
    popupOpen,
    setAnchorEl,
  } = useAutocomplete({
    id: 'payment-methods',
    multiple: true,
    value: selectedOptions,
    options: options,
    open: props.isFilter ? showFilterInput : undefined,
    getOptionLabel: (option) => option.name,
    onInputChange: (e) => {
      if (e?.target) setVal(e?.target?.value ?? '');
    },
    onChange: (event, value) => {
      if (props.isFilter) setShowFilterInput(false);
      setSelectedOptions(value);
      props.onAutocompleteChange(value.map((v) => v.name));
    },
    onOpen: () => {
      if (props.isFilter) setShowFilterInput(true);
    },
    onClose: () => {
      setVal(() => '');
    },
  });

  const theme = useTheme();
  const iconSize = 1.5 * theme.typography.fontSize;

  const tagsToDisplay = value.length
    ? props.optionsDisplayLimit
      ? value.slice(0, props.optionsDisplayLimit)
      : value
    : [];

  const qttHiddenTags = props.optionsDisplayLimit ? value.length - props.optionsDisplayLimit : 0;

  React.useEffect(() => {
    if (showFilterInput && props.isFilter) {
      filterInputRef.current?.focus();
      document.getElementById('payment-methods')?.focus();
    }
  }, [showFilterInput]);

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
            in={groupedOptions.length === 0 && value.length === 0 && val.length === 0}
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
            className={popupOpen ? 'focused' : ''}
            sx={{
              minHeight: '2.9em',
              maxHeight: '8.6em',
              hoverBorderColor: '#ffffff',
              ...props.sx,
            }}
            onClick={(evt) => {
              if (props.isFilter) {
                if (evt.target instanceof HTMLElement && !evt.target.matches('.delete-icon')) {
                  // Check if click is not on delete
                  setShowFilterInput(!showFilterInput);
                }
              }
            }}
          >
            {!showFilterInput || !props.isFilter ? (
              <>
                {tagsToDisplay.map((option, index) => (
                  <StyledTag
                    key={index}
                    label={t(option.name)}
                    icon={option.icon}
                    onClick={props.onClick}
                    sx={{ height: '1.6rem', ...(props.tagProps ?? {}) }}
                    {...getTagProps({ index })}
                  />
                ))}
                {qttHiddenTags > 0 ? (
                  <StyledChip
                    label={`+${qttHiddenTags}`}
                    sx={{ borderRadius: 1, height: '1.6rem' }}
                  />
                ) : null}
              </>
            ) : null}
            {value.length > 0 && !props.multiple ? null : (
              <input
                ref={filterInputRef}
                autoFocus={true}
                style={
                  props.isFilter
                    ? {
                        position: 'absolute',
                        backgroundColor: 'transparent',
                        display: showFilterInput ? 'block' : 'none',
                        width: '166px',
                      }
                    : {}
                }
                {...getInputProps()}
                value={val}
                onBlur={() => {
                  if (props.isFilter) setShowFilterInput(false);
                }}
              />
            )}
          </InputWrapper>
        </div>
      </Tooltip>
      <Grow in={groupedOptions.length > 0}>
        <Listbox sx={props.listBoxProps?.sx ?? undefined} {...getListboxProps()}>
          {props.listHeaderText ? (
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
          {groupedOptions.map((option, index) => (
            <li {...getOptionProps({ option, index })} key={index}>
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
        </Listbox>
      </Grow>
    </Root>
  );
};

export default AutocompletePayments;
