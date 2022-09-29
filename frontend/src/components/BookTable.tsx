import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import {
  Box,
  Grid,
  Dialog,
  Typography,
  Paper,
  Stack,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  useTheme,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { DataGrid, GridFooterPlaceholder, GridPagination } from '@mui/x-data-grid';
import currencyDict from '../../static/assets/currencies.json';
import { Order } from '../models/Order.model';

import FlagWithProps from './FlagWithProps';
import { pn, amountToString } from '../utils/prettyNumbers';
import PaymentText from './PaymentText';
import RobotAvatar from './Robots/RobotAvatar';
import hexToRgb from '../utils/hexToRgb';
import statusBadgeColor from '../utils/statusBadgeColor';

// Icons
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

interface Props {
  loading: boolean;
  orders: Order[];
  type: number;
  currency: number;
  maxWidth: number;
  maxHeight: number;
  fullWidth: number;
  fullHeight: number;
  defaultFullscreen: boolean;
}

const BookTable = ({
  loading,
  orders,
  type,
  currency,
  maxWidth,
  maxHeight,
  fullWidth,
  fullHeight,
  defaultFullscreen,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();
  const history = useHistory();
  const [pageSize, setPageSize] = useState(0);
  const [fullscreen, setFullscreen] = useState(defaultFullscreen);

  // all sizes in 'em'
  const fontSize = theme.typography.fontSize;
  const verticalHeightFrame = 6.9075;
  const verticalHeightRow = 3.25;
  const defaultPageSize = Math.max(
    Math.floor(
      ((fullscreen ? fullHeight * 0.875 : maxHeight) - verticalHeightFrame) / verticalHeightRow,
    ),
    1,
  );
  const height = defaultPageSize * verticalHeightRow + verticalHeightFrame;

  const [useDefaultPageSize, setUseDefaultPageSize] = useState(true);
  useEffect(() => {
    if (useDefaultPageSize) {
      setPageSize(defaultPageSize);
    }
  });

  const premiumColor = function (baseColor: string, accentColor: string, point: number) {
    const baseRGB = hexToRgb(baseColor);
    const accentRGB = hexToRgb(accentColor);
    const redDiff = accentRGB[0] - baseRGB[0];
    const red = baseRGB[0] + redDiff * point;
    const greenDiff = accentRGB[1] - baseRGB[1];
    const green = baseRGB[1] + greenDiff * point;
    const blueDiff = accentRGB[2] - baseRGB[2];
    const blue = baseRGB[2] + blueDiff * point;
    return `rgb(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)}, ${
      0.7 + point * 0.3
    })`;
  };

  const localeText = {
    MuiTablePagination: { labelRowsPerPage: t('Orders per page:') },
    noRowsLabel: t('No rows'),
    noResultsOverlayLabel: t('No results found.'),
    errorOverlayDefaultLabel: t('An error occurred.'),
    toolbarColumns: t('Columns'),
    toolbarColumnsLabel: t('Select columns'),
    columnsPanelTextFieldLabel: t('Find column'),
    columnsPanelTextFieldPlaceholder: t('Column title'),
    columnsPanelDragIconLabel: t('Reorder column'),
    columnsPanelShowAllButton: t('Show all'),
    columnsPanelHideAllButton: t('Hide all'),
    filterPanelAddFilter: t('Add filter'),
    filterPanelDeleteIconLabel: t('Delete'),
    filterPanelLinkOperator: t('Logic operator'),
    filterPanelOperators: t('Operator'),
    filterPanelOperatorAnd: t('And'),
    filterPanelOperatorOr: t('Or'),
    filterPanelColumns: t('Columns'),
    filterPanelInputLabel: t('Value'),
    filterPanelInputPlaceholder: t('Filter value'),
    filterOperatorContains: t('contains'),
    filterOperatorEquals: t('equals'),
    filterOperatorStartsWith: t('starts with'),
    filterOperatorEndsWith: t('ends with'),
    filterOperatorIs: t('is'),
    filterOperatorNot: t('is not'),
    filterOperatorAfter: t('is after'),
    filterOperatorOnOrAfter: t('is on or after'),
    filterOperatorBefore: t('is before'),
    filterOperatorOnOrBefore: t('is on or before'),
    filterOperatorIsEmpty: t('is empty'),
    filterOperatorIsNotEmpty: t('is not empty'),
    filterOperatorIsAnyOf: t('is any of'),
    filterValueAny: t('any'),
    filterValueTrue: t('true'),
    filterValueFalse: t('false'),
    columnMenuLabel: t('Menu'),
    columnMenuShowColumns: t('Show columns'),
    columnMenuFilter: t('Filter'),
    columnMenuHideColumn: t('Hide'),
    columnMenuUnsort: t('Unsort'),
    columnMenuSortAsc: t('Sort by ASC'),
    columnMenuSortDesc: t('Sort by DESC'),
    columnHeaderFiltersLabel: t('Show filters'),
    columnHeaderSortIconLabel: t('Sort'),
    booleanCellTrueLabel: t('yes'),
    booleanCellFalseLabel: t('no'),
  };

  const robotObj = function (width: number, hide: boolean) {
    return {
      hide,
      field: 'maker_nick',
      headerName: t('Robot'),
      width: width * fontSize,
      renderCell: (params) => {
        return (
          <ListItemButton style={{ cursor: 'pointer', position: 'relative', left: '-1.3em' }}>
            <ListItemAvatar>
              <RobotAvatar
                nickname={params.row.maker_nick}
                style={{ width: '3.215em', height: '3.215em' }}
                smooth={true}
                orderType={params.row.type}
                statusColor={statusBadgeColor(params.row.maker_status)}
                tooltip={t(params.row.maker_status)}
              />
            </ListItemAvatar>
            <ListItemText primary={params.row.maker_nick} />
          </ListItemButton>
        );
      },
    };
  };

  const robotSmallObj = function (width: number, hide: boolean) {
    return {
      hide,
      field: 'maker_nick',
      headerName: t('Robot'),
      width: width * fontSize,
      renderCell: (params) => {
        return (
          <div style={{ position: 'relative', left: '-1.5em' }}>
            <ListItemButton style={{ cursor: 'pointer' }}>
              <RobotAvatar
                nickname={params.row.maker_nick}
                smooth={true}
                style={{ width: '3.215em', height: '3.215em' }}
                orderType={params.row.type}
                statusColor={statusBadgeColor(params.row.maker_status)}
                tooltip={t(params.row.maker_status)}
              />
            </ListItemButton>
          </div>
        );
      },
    };
  };

  const typeObj = function (width: number, hide: boolean) {
    return {
      hide,
      field: 'type',
      headerName: t('Is'),
      width: width * fontSize,
      renderCell: (params) => (params.row.type ? t('Seller') : t('Buyer')),
    };
  };

  const amountObj = function (width: number, hide: boolean) {
    return {
      hide,
      field: 'amount',
      headerName: t('Amount'),
      type: 'number',
      width: width * fontSize,
      renderCell: (params) => {
        return (
          <div style={{ cursor: 'pointer' }}>
            {amountToString(
              params.row.amount,
              params.row.has_range,
              params.row.min_amount,
              params.row.max_amount,
            )}
          </div>
        );
      },
    };
  };

  const currencyObj = function (width: number, hide: boolean) {
    return {
      hide,
      field: 'currency',
      headerName: t('Currency'),
      width: width * fontSize,
      renderCell: (params) => {
        const currencyCode = currencyDict[params.row.currency.toString()];
        return (
          <div
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {currencyCode + ' '}
            <FlagWithProps code={currencyCode} />
          </div>
        );
      },
    };
  };

  const paymentObj = function (width: number, hide: boolean) {
    return {
      hide,
      field: 'payment_method',
      headerName: t('Payment Method'),
      width: width * fontSize,
      renderCell: (params) => {
        return (
          <div style={{ cursor: 'pointer' }}>
            <PaymentText
              othersText={t('Others')}
              verbose={true}
              size={1.7 * fontSize}
              text={params.row.payment_method}
            />
          </div>
        );
      },
    };
  };

  const paymentSmallObj = function (width: number, hide: boolean) {
    return {
      hide,
      field: 'payment_icons',
      headerName: t('Pay'),
      width: width * fontSize,
      renderCell: (params) => {
        return (
          <div
            style={{
              position: 'relative',
              left: '-4px',
              cursor: 'pointer',
              align: 'center',
            }}
          >
            <PaymentText
              othersText={t('Others')}
              size={1.3 * fontSize}
              text={params.row.payment_method}
            />
          </div>
        );
      },
    };
  };

  const priceObj = function (width: number, hide: boolean) {
    return {
      hide,
      field: 'price',
      headerName: t('Price'),
      type: 'number',
      width: width * fontSize,
      renderCell: (params) => {
        const currencyCode = currencyDict[params.row.currency.toString()];
        return (
          <div style={{ cursor: 'pointer' }}>{`${pn(params.row.price)} ${currencyCode}/BTC`}</div>
        );
      },
    };
  };

  const premiumObj = function (width: number, hide: boolean) {
    // coloring premium texts based on 4 params:
    // Hardcoded: a sell order at 0% is an outstanding premium
    // Hardcoded: a buy order at 10% is an outstanding premium
    const sellStandardPremium = 10;
    const buyOutstandingPremium = 10;
    return {
      hide,
      field: 'premium',
      headerName: t('Premium'),
      type: 'number',
      width: width * fontSize,
      renderCell: (params) => {
        let fontColor = `rgb(0,0,0)`;
        if (params.row.type === 0) {
          var premiumPoint = params.row.premium / buyOutstandingPremium;
          premiumPoint = premiumPoint < 0 ? 0 : premiumPoint > 1 ? 1 : premiumPoint;
          fontColor = premiumColor(
            theme.palette.text.primary,
            theme.palette.secondary.dark,
            premiumPoint,
          );
        } else {
          var premiumPoint = (sellStandardPremium - params.row.premium) / sellStandardPremium;
          premiumPoint = premiumPoint < 0 ? 0 : premiumPoint > 1 ? 1 : premiumPoint;
          fontColor = premiumColor(
            theme.palette.text.primary,
            theme.palette.primary.dark,
            premiumPoint,
          );
        }
        const fontWeight = 400 + Math.round(premiumPoint * 5) * 100;
        return (
          <div style={{ cursor: 'pointer' }}>
            <Typography variant='inherit' color={fontColor} sx={{ fontWeight }}>
              {parseFloat(parseFloat(params.row.premium).toFixed(4)) + '%'}
            </Typography>
          </div>
        );
      },
    };
  };

  const timerObj = function (width: number, hide: boolean) {
    return {
      hide,
      field: 'escrow_duration',
      headerName: t('Timer'),
      type: 'number',
      width: width * fontSize,
      renderCell: (params) => {
        const hours = Math.round(params.row.escrow_duration / 3600);
        const minutes = Math.round((params.row.escrow_duration - hours * 3600) / 60);
        return <div style={{ cursor: 'pointer' }}>{hours > 0 ? `${hours}h` : `${minutes}m`}</div>;
      },
    };
  };

  const expiryObj = function (width: number, hide: boolean) {
    return {
      hide,
      field: 'expires_at',
      headerName: t('Expiry'),
      type: 'string',
      width: width * fontSize,
      renderCell: (params) => {
        const expiresAt = new Date(params.row.expires_at);
        const timeToExpiry = Math.abs(expiresAt - new Date());
        const percent = Math.round((timeToExpiry / (24 * 60 * 60 * 1000)) * 100);
        const hours = Math.round(timeToExpiry / (3600 * 1000));
        const minutes = Math.round((timeToExpiry - hours * (3600 * 1000)) / 60000);
        return (
          <Box sx={{ position: 'relative', display: 'inline-flex', left: '0.3em' }}>
            <CircularProgress
              value={percent}
              color={percent < 15 ? 'error' : percent < 30 ? 'warning' : 'success'}
              thickness={0.35 * fontSize}
              size={2.5 * fontSize}
              variant='determinate'
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant='caption' component='div' color='text.secondary'>
                {hours > 0 ? `${hours}h` : `${minutes}m`}
              </Typography>
            </Box>
          </Box>
        );
      },
    };
  };

  const satoshisObj = function (width: number, hide: boolean) {
    return {
      hide,
      field: 'satoshis_now',
      headerName: t('Sats now'),
      type: 'number',
      width: width * fontSize,
      renderCell: (params) => {
        return (
          <div style={{ cursor: 'pointer' }}>
            {`${pn(Math.round(params.row.satoshis_now / 1000))}K`}
          </div>
        );
      },
    };
  };

  const idObj = function (width: number, hide: boolean) {
    return {
      hide,
      field: 'id',
      headerName: 'Order ID',
      width: width * fontSize,
      renderCell: (params) => {
        return (
          <div style={{ cursor: 'pointer' }}>
            <Typography variant='caption' color='text.secondary'>
              {`#${params.row.id}`}
            </Typography>
          </div>
        );
      },
    };
  };

  const columnSpecs = {
    amount: {
      priority: 1,
      order: 4,
      normal: {
        width: 6.5,
        object: amountObj,
      },
    },
    currency: {
      priority: 2,
      order: 5,
      normal: {
        width: 5.8,
        object: currencyObj,
      },
    },
    premium: {
      priority: 3,
      order: 11,
      normal: {
        width: 6,
        object: premiumObj,
      },
    },
    robot: {
      priority: 4,
      order: 1,
      normal: {
        width: 17.14,
        object: robotObj,
      },
      small: {
        width: 4.3,
        object: robotSmallObj,
      },
    },
    paymentMethod: {
      priority: 5,
      order: 6,
      normal: {
        width: 12.85,
        object: paymentObj,
      },
      small: {
        width: 5.8,
        object: paymentSmallObj,
      },
    },
    price: {
      priority: 6,
      order: 10,
      normal: {
        width: 10,
        object: priceObj,
      },
    },
    expires_at: {
      priority: 7,
      order: 7,
      normal: {
        width: 5.8,
        object: expiryObj,
      },
    },
    escrow_duration: {
      priority: 8,
      order: 8,
      normal: {
        width: 3.8,
        object: timerObj,
      },
    },
    satoshisNow: {
      priority: 9,
      order: 9,
      normal: {
        width: 6,
        object: satoshisObj,
      },
    },
    type: {
      priority: 10,
      order: 2,
      normal: {
        width: 4.3,
        object: typeObj,
      },
    },
    id: {
      priority: 11,
      order: 12,
      normal: {
        width: 4.8,
        object: idObj,
      },
    },
  };

  const filteredColumns = function (maxWidth: number) {
    const useSmall = maxWidth < 70;
    const selectedColumns: object[] = [];
    let width: number = 0;

    for (const [key, value] of Object.entries(columnSpecs)) {
      const colWidth = useSmall && value.small ? value.small.width : value.normal.width;
      const colObject = useSmall && value.small ? value.small.object : value.normal.object;

      if (width + colWidth < maxWidth || selectedColumns.length < 2) {
        width = width + colWidth;
        selectedColumns.push([colObject(colWidth, false), value.order]);
      } else {
        selectedColumns.push([colObject(colWidth, true), value.order]);
      }
    }

    // sort columns by column.order value
    selectedColumns.sort(function (first, second) {
      return first[1] - second[1];
    });

    const columns = selectedColumns.map(function (item) {
      return item[0];
    });

    return [columns, width * 0.875 + 0.15];
  };

  const [columns, width] = filteredColumns(fullscreen ? fullWidth : maxWidth);

  const gridComponents = {
    NoResultsOverlay: () => (
      <Stack height='100%' alignItems='center' justifyContent='center'>
        {t('Filter has no results')}
      </Stack>
    ),
    Footer: () => (
      <Grid container alignItems='center' direction='row' justifyContent='space-between'>
        <Grid item>
          <IconButton onClick={() => setFullscreen(!fullscreen)}>
            {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </Grid>
        <Grid item>
          <GridPagination />
        </Grid>
      </Grid>
    ),
  };

  if (!fullscreen) {
    return (
      <Paper style={{ width: `${width}em`, height: `${height}em`, overflow: 'auto' }}>
        <DataGrid
          localeText={localeText}
          rows={orders.filter(
            (order) =>
              (order.type == type || type == null) && (order.currency == currency || currency == 0),
          )}
          loading={loading}
          columns={columns}
          components={gridComponents}
          pageSize={loading ? 0 : pageSize}
          rowsPerPageOptions={[0, pageSize, defaultPageSize * 2, 50, 100]}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize);
            setUseDefaultPageSize(false);
          }}
          onRowClick={(params) => history.push('/order/' + params.row.id)} // Whole row is clickable, but the mouse only looks clickly in some places.
        />
      </Paper>
    );
  } else {
    return (
      <Dialog open={fullscreen} fullScreen={true}>
        <Paper style={{ width: '100%', height: '100%', overflow: 'auto' }}>
          <DataGrid
            localeText={localeText}
            rows={orders.filter(
              (order) =>
                (order.type == type || type == null) &&
                (order.currency == currency || currency == 0),
            )}
            loading={loading}
            columns={columns}
            components={gridComponents}
            pageSize={loading ? 0 : pageSize}
            rowsPerPageOptions={[0, pageSize, defaultPageSize * 2, 50, 100]}
            onPageSizeChange={(newPageSize) => {
              setPageSize(newPageSize);
              setUseDefaultPageSize(false);
            }}
            onRowClick={(params) => history.push('/order/' + params.row.id)} // Whole row is clickable, but the mouse only looks clickly in some places.
          />
        </Paper>
      </Dialog>
    );
  }
};

export default BookTable;
