import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import PaymentIcon from './Icons';
import { Tooltip } from '@mui/material';
import { fiatMethods, swapMethods } from './MethodList';

const ns = [{ name: 'not specified', icon: 'notspecified' }];
const methods = ns.concat(swapMethods).concat(fiatMethods);

interface Props {
  othersText: string;
  verbose: boolean;
  size: number;
  text: string;
}

const StringAsIcons: React.FC = ({ othersText, verbose, size, text }: Props) => {
  const { t } = useTranslation();

  const parsedText = useMemo(() => {
    const rows = [];
    let custom_methods = text;
    // Adds icons for each PaymentMethod that matches
    methods.forEach((method, i) => {
      if (text.includes(method.name)) {
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
                width: size + 2,
                height: size,
              }}
            >
              <PaymentIcon width={size} height={size} icon={method.icon} />
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
          title={verbose ? othersText : othersText + ': ' + custom_methods}
        >
          <div
            style={{
              position: 'relative',
              display: 'inline-block',
              width: size + 2,
              maxHeight: size,
              top: '-1px',
            }}
          >
            <PaymentIcon width={size * 1.1} height={size * 1.1} icon={'custom'} />
          </div>
        </Tooltip>,
      );
    }

    if (verbose) {
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
  }, [text]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>{parsedText}</div>
  );
};

export default StringAsIcons;
