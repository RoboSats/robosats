import { type Order } from '../../models';

const stepXofY = function (order: Order): string {
  // set y value
  let x: number | null = null;
  let y: number | null = null;

  if (order.is_maker) {
    y = 5;
  } else if (order.is_taker) {
    y = 4;
  }

  // set x values
  if (order.is_maker) {
    if (order.status === 0) {
      x = 1;
    } else if ([1, 2, 3].includes(order.status)) {
      x = 2;
    } else if ([6, 7, 8].includes(order.status)) {
      x = 3;
    } else if (order.status === 9) {
      x = 4;
    } else if (order.status === 10) {
      x = 5;
    }
  } else if (order.is_taker) {
    if (order.status === 3) {
      x = 1;
    } else if ([6, 7, 8].includes(order.status)) {
      x = 2;
    } else if (order.status === 9) {
      x = 3;
    } else if (order.status === 10) {
      x = 4;
    }
  }

  // Return "(x/y)"
  if (x != null && y != null) {
    return `(${x}/${y})`;
  } else {
    return '';
  }
};

export default stepXofY;
