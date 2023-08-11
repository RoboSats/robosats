import React from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, useTheme } from '@mui/material';
import { type Order } from '../../../models';
import stepXofY from '../stepXofY';

interface TakerFoundPrompProps {
  order: Order;
  text: string;
  variables?: any;
  color?: string;
  icon?: () => JSX.Element;
}

export const Title = ({
  order,
  text,
  variables = {},
  color = 'primary',
  icon = function () {
    return <></>;
  },
}: TakerFoundPrompProps): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

  let textColor = color;
  if (color === 'warning') {
    textColor = theme.palette.warning.main;
  } else if (color === 'success') {
    textColor = theme.palette.success.main;
  }

  return (
    <Typography
      color={textColor}
      variant='subtitle1'
      align='center'
      style={{ display: 'flex', alignItems: 'center' }}
    >
      {icon()}
      <span>
        <b>{t(text, variables)}</b> {stepXofY(order)}
      </span>
      {icon()}
    </Typography>
  );
};

export default Title;
