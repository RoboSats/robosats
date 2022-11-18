import React from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@mui/material';
import { Order } from '../../../models';
import stepXofY from '../stepXofY';
import { pn } from '../../../utils';

interface TakerFoundPrompProps {
  order: Order;
  text: string;
  variables?: Object;
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

  return (
    <Typography color={color} variant='subtitle1' align='center'>
      {icon()}
      <b>{t(text, variables)}</b> {stepXofY(order)}
      {icon()}
    </Typography>
  );
};

export default Title;
