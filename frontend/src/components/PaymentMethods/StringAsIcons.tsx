import React from 'react';
import { useTranslation } from 'react-i18next';
import PaymentIcon from './Icons';
import { Tooltip } from '@mui/material';
import { fiatMethods, swapMethods } from './MethodList';

const ns = [{ name: 'not specified', icon: 'notspecified' }];
const methods = ns.concat(swapMethods).concat(fiatMethods);

const StringAsIcons: React.FC = (props) => {
  const { t } = useTranslation();

  const parseText = () => {
    const rows = [];
    let custom_methods = props.text;
    // Adds icons for each PaymentMethod that matches
    methods.forEach((method, i) => {
      if (props.text.includes(method.name)) {
        custom_methods = custom_methods.replace(method.name, '');
        rows.push(
          <Tooltip
            key={`${method.name}-${i}`}
            placement='top'
            enterTouchDelay={0}
            title={t(method.name)}
          >
            <div
              style={{
                display: 'inline-block',
                width: props.size + 2,
                height: props.size,
              }}
            >
              <PaymentIcon width={props.size} height={props.size} icon={method.icon} />
            </div>
          </Tooltip>,
        );
      }
    });

    // Adds a Custom icon if there are words that do not match
    const chars_left = custom_methods
      .replace('   ', '')
      .replace('  ', '')
      .replace(' ', '')
      .replace(' ', '')
      .replace(' ', '');

    if (chars_left.length > 0) {
      rows.push(
        <Tooltip
          key={'pushed'}
          placement='top'
          enterTouchDelay={0}
          title={props.verbose ? props.othersText : props.othersText + ': ' + custom_methods}
        >
          <div
            style={{
              position: 'relative',
              display: 'inline-block',
              width: props.size + 2,
              maxHeight: props.size,
              top: '-1px',
            }}
          >
            <PaymentIcon width={props.size * 1.1} height={props.size * 1.1} icon={'custom'} />
          </div>
        </Tooltip>,
      );
    }

    if (props.verbose) {
      return (
        <>
          {rows}{' '}
          <div style={{ display: 'inline-block' }}>
            {' '}
            <span>{custom_methods}</span>
          </div>
        </>
      );
    } else {
      return rows;
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>{parseText()}</div>
  );
};

export default StringAsIcons;
