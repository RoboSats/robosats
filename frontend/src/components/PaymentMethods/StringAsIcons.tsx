import React, { CSSProperties, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import PaymentIcon from './Icons';
import { Tooltip } from '@mui/material';
import { fiatMethods, swapMethods } from './MethodList';

const ns = [{ name: 'not specified', icon: 'notspecified' }];
const methods = ns.concat(swapMethods).concat(fiatMethods);

interface StringAsIconsProps {
  othersText: string;
  verbose: boolean;
  size: number;
  text: string;
  style?: CSSProperties;
}

const StringAsIcons: React.FC<StringAsIconsProps> = ({
  othersText,
  verbose,
  size,
  text = '',
  style = {},
}) => {
  const { t } = useTranslation();

  const parsedText = useMemo(() => {
    const rows = [];
    let customMethods = text.replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      '',
    ); // Remove emojis

    // Adds icons for each PaymentMethod that matches
    methods.forEach((method, i) => {
      const regex = new RegExp(`\\b${method.name.toLowerCase()}\\b`, 'g');

      if (regex.test(customMethods.toLowerCase())) {
        customMethods = customMethods.replace(regex, '');
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
              <PaymentIcon
                width={size}
                height={size}
                icon={method.icon}
                reversible={method.reversible}
              />
            </div>
          </Tooltip>,
        );
      }
    });

    // Adds a Custom icon if there are words that do not match
    const charsLeft = customMethods
      .replace('   ', '')
      .replace('  ', '')
      .replace(' ', '')
      .replace(' ', '')
      .replace(' ', '');

    if (charsLeft.length > 0) {
      rows.push(
        <Tooltip
          key={'pushed'}
          placement='top'
          enterTouchDelay={0}
          title={verbose ? othersText : othersText + ': ' + customMethods}
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
            <span>{customMethods}</span>
          </div>
        </>
      );
    } else {
      return rows;
    }
  }, [text]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', ...style }}>
      {parsedText}
    </div>
  );
};

export default StringAsIcons;
