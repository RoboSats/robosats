import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import PaymentIcon from './payment-methods/Icons';
import { Tooltip } from '@mui/material';
import { paymentMethods, swapDestinations } from './payment-methods/Methods';

const ns = [{ name: 'not specified', icon: 'notspecified' }];
const methods = ns.concat(swapDestinations).concat(paymentMethods);

class PaymentText extends Component {
  constructor(props) {
    super(props);
  }

  parseText() {
    const { t } = this.props;
    const rows = [];
    let custom_methods = this.props.text;
    // Adds icons for each PaymentMethod that matches
    methods.forEach((method, i) => {
      if (this.props.text.includes(method.name)) {
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
                width: this.props.size + 2,
                height: this.props.size,
              }}
            >
              <PaymentIcon width={this.props.size} height={this.props.size} icon={method.icon} />
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
          title={
            this.props.verbose
              ? this.props.othersText
              : this.props.othersText + ': ' + custom_methods
          }
        >
          <div
            style={{
              position: 'relative',
              display: 'inline-block',
              width: this.props.size + 2,
              maxHeight: this.props.size,
              top: '-1px',
            }}
          >
            <PaymentIcon
              width={this.props.size * 1.1}
              height={this.props.size * 1.1}
              icon={'custom'}
            />
          </div>
        </Tooltip>,
      );
    }

    if (this.props.verbose) {
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
  }

  render() {
    return (
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
        {this.parseText()}
      </div>
    );
  }
}

export default withTranslation()(PaymentText);
