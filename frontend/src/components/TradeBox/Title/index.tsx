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
}

export const Title = ({
  order,
  text,
  variables = {},
  color = 'primary',
}: TakerFoundPrompProps): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Typography color={color} variant='subtitle1' align='center'>
      <b>{t(text, variables)}</b> {stepXofY(order)}
    </Typography>
  );
};

export default Title;
