import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Dialog,
  Typography,
  Paper,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  useTheme,
  CircularProgress,
  LinearProgress,
  IconButton,
  Tooltip,
  type LinearProgressProps,
  styled,
} from '@mui/material';
import {
  DataGrid,
  type GridColumnVisibilityModel,
  GridPagination,
  type GridPaginationModel,
} from '@mui/x-data-grid';
import currencyDict from '../../../static/assets/currencies.json';
import { type PublicOrder } from '../../models';
import { filterOrders, hexToRgb, statusBadgeColor, pn, amountToString } from '../../utils';
import BookControl from './BookControl';

import { FlagWithProps } from '../Icons';
import { PaymentStringAsIcons } from '../PaymentMethods';
import RobotAvatar from '../RobotAvatar';

// Icons
import { Fullscreen, FullscreenExit, Refresh } from '@mui/icons-material';
import { AppContext, hostUrl, origin, type UseAppStoreType } from '../../contexts/AppContext';

const ClickThroughDataGrid = styled(DataGrid)({
  '& .MuiDataGrid-overlayWrapperInner': {
    pointerEvents: 'none',
  },
  // Temporary fix for regression for hidden column labels on Mobile:
  // https://github.com/mui/mui-x/issues/9776#issuecomment-1648306844
  '@media (hover: none)': {
    '&& .MuiDataGrid-menuIcon': {
      width: 0,
      visibility: 'hidden',
    },
    '&& .MuiDataGrid-sortIcon': {
      width: 0,
      visibility: 'hidden',
    },
  },
  '&& .MuiDataGrid-columnHeader--sorted .MuiDataGrid-menuIcon': {
    width: 'auto',
    visibility: 'visible',
  },
  '&& .MuiDataGrid-columnHeader--sorted .MuiDataGrid-sortIcon': {
    width: 'auto',
    visibility: 'visible',
  },
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
  return `rgb(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)}, ${0.7 + point * 0.3})`;
};

interface BookTableProps {
  orderList?: PublicOrder[];
  maxWidth: number;
  maxHeight: number;
  fullWidth?: number;
  fullHeight?: number;
  elevation?: number;
  defaultFullscreen?: boolean;
  fillContainer?: boolean;
  showControls?: boolean;
  showFooter?: boolean;
  showNoResults?: boolean;
  onOrderClicked?: (id: number, shortAlias: string) => void;
}

const BookTable = ({
  orderList,
  maxWidth = 100,
  maxHeight = 70,
  fullWidth = 100,
  fullHeight = 70,
  defaultFullscreen = false,
  elevation = 6,
  fillContainer = false,
  showControls = true,
  showFooter = true,
  showNoResults = true,
  onOrderClicked = () => null,
}: BookTableProps): JSX.Element => {
  const {
    book,
    federation,
    fetchFederationBook,
    fav,
    setFav,
    setFocusedCoordinator,
    settings,
    setOpen,
  } = useContext<UseAppStoreType>(AppContext);

  const { t } = useTranslation();
  const theme = useTheme();
  const orders = orderList ?? book.orders;
  const loadingProgress = useMemo(() => {
    return (book.loadedCoordinators / book.totalCoordinators) * 100;
  }, [book.loadedCoordinators, book.totalCoordinators]);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    pageSize: 0,
    page: 0,
  });
  const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({});
  const [fullscreen, setFullscreen] = useState(defaultFullscreen);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);

  // all sizes in 'em'
  const [fontSize, defaultPageSize, height] = useMemo(() => {
    const fontSize = theme.typography.fontSize;
    const verticalHeightFrame = 3.25 + (showControls ? 3.7 : 0.35) + (showFooter ? 2.35 : 0);
    const verticalHeightRow = 3.25;
    const defaultPageSize = Math.max(
      Math.floor(
        ((fullscreen ? fullHeight * 0.9 : maxHeight) - verticalHeightFrame) / verticalHeightRow,
      ),
      1,
    );
    const height = defaultPageSize * verticalHeightRow + verticalHeightFrame;
    return [fontSize, defaultPageSize, height];
  }, [theme.typography.fontSize, maxHeight, fullscreen, fullHeight, showControls, showFooter]);

  useEffect(() => {
    setPaginationModel({
      pageSize: book.loading && orders.length == 0 ? 0 : defaultPageSize,
      page: paginationModel.page,
    });
  }, [book.loading, orders, defaultPageSize]);

  const localeText = useMemo(() => {
    return {
      MuiTablePagination: { labelRowsPerPage: t('Orders per page:') },
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
      columnMenuManageColumns: t('Manage columns'),
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
  }, []);

  const robotObj = useCallback((width: number) => {
    return {
      field: 'maker_nick',
      headerName: t('Robot'),
      width: width * fontSize,
      renderCell: (params: any) => {
        return (
          <ListItemButton
            style={{ cursor: 'pointer', position: 'relative', left: '-1.3em' }}
            onClick={() => {
              onOrderClicked(params.row.id, params.row.coordinatorShortAlias);
            }}
          >
            <ListItemAvatar>
              <RobotAvatar
                nickname={params.row.maker_nick}
                style={{ width: '3.215em', height: '3.215em' }}
                smooth={true}
                flipHorizontally={true}
                orderType={params.row.type}
                statusColor={statusBadgeColor(params.row.maker_status)}
                tooltip={t(params.row.maker_status)}
                baseUrl={federation[params.row.coordinatorShortAlias][settings.network][origin]}
                small={true}
              />
            </ListItemAvatar>
            <ListItemText primary={params.row.maker_nick} />
          </ListItemButton>
        );
      },
    };
  }, []);

  const robotSmallObj = useCallback((width: number) => {
    return {
      field: 'maker_nick',
      headerName: t('Robot'),
      width: width * fontSize,
      renderCell: (params: any) => {
        return (
          <div
            style={{ position: 'relative', left: '-0.34em', cursor: 'pointer' }}
            onClick={() => {
              onOrderClicked(params.row.id, params.row.coordinatorShortAlias);
            }}
          >
            <RobotAvatar
              nickname={params.row.maker_nick}
              smooth={true}
              flipHorizontally={true}
              style={{ width: '3.215em', height: '3.215em' }}
              orderType={params.row.type}
              statusColor={statusBadgeColor(params.row.maker_status)}
              tooltip={t(params.row.maker_status)}
              baseUrl={federation[params.row.coordinatorShortAlias][settings.network][origin]}
            />
          </div>
        );
      },
    };
  }, []);

  const onClickCoordinator = function (shortAlias: string) {
    setFocusedCoordinator(shortAlias);
    setOpen((open) => {
      return { ...open, coordinator: true };
    });
  };

  const coordinatorObj = useCallback((width: number) => {
    return {
      field: 'coordinatorShortAlias',
      headerName: t('Host'),
      width: width * fontSize,
      renderCell: (params: any) => {
        return (
          <ListItemButton
            style={{ cursor: 'pointer', position: 'relative', left: '-1.54em' }}
            onClick={() => {
              onClickCoordinator(params.row.coordinatorShortAlias);
            }}
          >
            <ListItemAvatar>
              <RobotAvatar
                nickname={params.row.coordinatorShortAlias}
                coordinator={true}
                style={{ width: '3.215em', height: '3.215em' }}
                smooth={true}
                flipHorizontally={true}
                baseUrl={hostUrl}
                small={true}
              />
            </ListItemAvatar>
          </ListItemButton>
        );
      },
    };
  }, []);

  const typeObj = useCallback((width: number) => {
    return {
      field: 'type',
      headerName: t('Is'),
      width: width * fontSize,
      renderCell: (params: any) => {
        return (
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => {
              onOrderClicked(params.row.id, params.row.coordinatorShortAlias);
            }}
          >
            {params.row.type
              ? t(fav.mode === 'fiat' ? 'Seller' : 'Swapping Out')
              : t(fav.mode === 'fiat' ? 'Buyer' : 'Swapping In')}
          </div>
        );
      },
    };
  }, []);

  const amountObj = useCallback((width: number) => {
    return {
      field: 'amount',
      headerName: t('Amount'),
      type: 'number',
      width: width * fontSize,
      renderCell: (params: any) => {
        const amount = fav.mode === 'swap' ? params.row.amount * 100000 : params.row.amount;
        const minAmount =
          fav.mode === 'swap' ? params.row.min_amount * 100000 : params.row.min_amount;
        const maxAmount =
          fav.mode === 'swap' ? params.row.max_amount * 100000 : params.row.max_amount;
        return (
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => {
              onOrderClicked(params.row.id, params.row.coordinatorShortAlias);
            }}
          >
            {amountToString(amount, params.row.has_range, minAmount, maxAmount) +
              (fav.mode === 'swap' ? 'K Sats' : '')}
          </div>
        );
      },
    };
  }, []);

  const currencyObj = useCallback((width: number) => {
    return {
      field: 'currency',
      headerName: t('Currency'),
      width: width * fontSize,
      renderCell: (params: any) => {
        const currencyCode = currencyDict[params.row.currency.toString()];
        return (
          <div
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
            onClick={() => {
              onOrderClicked(params.row.id, params.row.coordinatorShortAlias);
            }}
          >
            {currencyCode}
            <div style={{ width: '0.3em' }} />
            <FlagWithProps code={currencyCode} />
          </div>
        );
      },
    };
  }, []);

  const paymentObj = useCallback((width: number) => {
    return {
      field: 'payment_method',
      headerName: fav.mode === 'fiat' ? t('Payment Method') : t('Destination'),
      width: width * fontSize,
      renderCell: (params: any) => {
        return (
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => {
              onOrderClicked(params.row.id, params.row.coordinatorShortAlias);
            }}
          >
            <PaymentStringAsIcons
              othersText={t('Others')}
              verbose={true}
              size={1.7 * fontSize}
              text={params.row.payment_method}
            />
          </div>
        );
      },
    };
  }, []);

  const paymentSmallObj = useCallback((width: number) => {
    return {
      field: 'payment_method',
      headerName: t('Pay'),
      width: width * fontSize,
      renderCell: (params: any) => {
        return (
          <div
            style={{
              position: 'relative',
              left: '-4px',
              cursor: 'pointer',
            }}
            onClick={() => {
              onOrderClicked(params.row.id, params.row.coordinatorShortAlias);
            }}
          >
            <PaymentStringAsIcons
              othersText={t('Others')}
              size={1.3 * fontSize}
              text={params.row.payment_method}
            />
          </div>
        );
      },
    };
  }, []);

  const priceObj = useCallback((width: number) => {
    return {
      field: 'price',
      headerName: t('Price'),
      type: 'number',
      width: width * fontSize,
      renderCell: (params: any) => {
        const currencyCode = currencyDict[params.row.currency.toString()];
        return (
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => {
              onOrderClicked(params.row.id, params.row.coordinatorShortAlias);
            }}
          >
            {`${pn(params.row.price)} ${currencyCode}/BTC`}
          </div>
        );
      },
    };
  }, []);

  const premiumObj = useCallback(
    (width: number) => {
      // coloring premium texts based on 4 params:
      // Hardcoded: a sell order at 0% is an outstanding premium
      // Hardcoded: a buy order at 10% is an outstanding premium
      const sellStandardPremium = 10;
      const buyOutstandingPremium = 10;
      return {
        field: 'premium',
        headerName: t('Premium'),
        type: 'number',
        width: width * fontSize,
        renderCell: (params: any) => {
          const currencyCode = currencyDict[params.row.currency.toString()];
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
            <Tooltip
              placement='left'
              enterTouchDelay={0}
              title={pn(params.row.price) + ' ' + currencyCode + '/BTC'}
            >
              <div
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  onOrderClicked(params.row.id, params.row.coordinatorShortAlias);
                }}
              >
                <Typography variant='inherit' color={fontColor} sx={{ fontWeight }}>
                  {parseFloat(parseFloat(params.row.premium).toFixed(4)) + '%'}
                </Typography>
              </div>
            </Tooltip>
          );
        },
      };
    },
    [theme],
  );

  const timerObj = useCallback((width: number) => {
    return {
      field: 'escrow_duration',
      headerName: t('Timer'),
      type: 'number',
      width: width * fontSize,
      renderCell: (params: any) => {
        const hours = Math.round(params.row.escrow_duration / 3600);
        const minutes = Math.round((params.row.escrow_duration - hours * 3600) / 60);
        return (
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => {
              onOrderClicked(params.row.id, params.row.coordinatorShortAlias);
            }}
          >
            {hours > 0 ? `${hours}h` : `${minutes}m`}
          </div>
        );
      },
    };
  }, []);

  const expiryObj = useCallback((width: number) => {
    return {
      field: 'expires_at',
      headerName: t('Expiry'),
      type: 'string',
      width: width * fontSize,
      renderCell: (params: any) => {
        const expiresAt: Date = new Date(params.row.expires_at);
        const timeToExpiry: number = Math.abs(expiresAt - new Date());
        const percent = Math.round((timeToExpiry / (24 * 60 * 60 * 1000)) * 100);
        const hours = Math.round(timeToExpiry / (3600 * 1000));
        const minutes = Math.round((timeToExpiry - hours * (3600 * 1000)) / 60000);
        return (
          <Box
            sx={{ position: 'relative', display: 'inline-flex', left: '0.3em' }}
            onClick={() => {
              onOrderClicked(params.row.id, params.row.coordinatorShortAlias);
            }}
          >
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
  }, []);

  const satoshisObj = useCallback((width: number) => {
    return {
      field: 'satoshis_now',
      headerName: t('Sats now'),
      type: 'number',
      width: width * fontSize,
      renderCell: (params: any) => {
        return (
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => {
              onOrderClicked(params.row.id, params.row.coordinatorShortAlias);
            }}
          >
            {params.row.satoshis_now > 1000000
              ? `${pn(Math.round(params.row.satoshis_now / 10000) / 100)} M`
              : `${pn(Math.round(params.row.satoshis_now / 1000))} K`}
          </div>
        );
      },
    };
  }, []);

  const idObj = useCallback((width: number) => {
    return {
      field: 'id',
      headerName: 'Order ID',
      width: width * fontSize,
      renderCell: (params: any) => {
        return (
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => {
              onOrderClicked(params.row.id, params.row.coordinatorShortAlias);
            }}
          >
            <Typography variant='caption' color='text.secondary'>
              {`#${params.row.id}`}
            </Typography>
          </div>
        );
      },
    };
  }, []);

  const bondObj = useCallback((width: number) => {
    return {
      field: 'bond_size',
      headerName: t('Bond'),
      type: 'number',
      width: width * fontSize,
      renderCell: (params: any) => {
        return (
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => {
              onOrderClicked(params.row.id, params.row.coordinatorShortAlias);
            }}
          >{`${Number(params.row.bond_size)}%`}</div>
        );
      },
    };
  }, []);

  const columnSpecs = useMemo(() => {
    return {
      amount: {
        priority: 1,
        order: 5,
        normal: {
          width: fav.mode === 'swap' ? 9.5 : 6.5,
          object: amountObj,
        },
      },
      currency: {
        priority: 2,
        order: 6,
        normal: {
          width: fav.mode === 'swap' ? 0 : 5.9,
          object: currencyObj,
        },
      },
      premium: {
        priority: 3,
        order: 12,
        normal: {
          width: 6,
          object: premiumObj,
        },
      },
      payment_method: {
        priority: 4,
        order: 7,
        normal: {
          width: 12.85,
          object: paymentObj,
        },
        small: {
          width: 4.4,
          object: paymentSmallObj,
        },
      },
      maker_nick: {
        priority: 5,
        order: 1,
        normal: {
          width: 17.14,
          object: robotObj,
        },
        small: {
          width: 4.1,
          object: robotSmallObj,
        },
      },
      coordinatorShortAlias: {
        priority: 5,
        order: 3,
        normal: {
          width: 4.1,
          object: coordinatorObj,
        },
      },
      price: {
        priority: 6,
        order: 11,
        normal: {
          width: 10,
          object: priceObj,
        },
      },
      expires_at: {
        priority: 7,
        order: 8,
        normal: {
          width: 5,
          object: expiryObj,
        },
      },
      escrow_duration: {
        priority: 8,
        order: 9,
        normal: {
          width: 4.8,
          object: timerObj,
        },
      },
      satoshis_now: {
        priority: 9,
        order: 10,
        normal: {
          width: 6,
          object: satoshisObj,
        },
      },
      type: {
        priority: 10,
        order: 2,
        normal: {
          width: fav.mode === 'swap' ? 7 : 4.3,
          object: typeObj,
        },
      },
      bond_size: {
        priority: 11,
        order: 11,
        normal: {
          width: 4.2,
          object: bondObj,
        },
      },
      id: {
        priority: 12,
        order: 13,
        normal: {
          width: 4.8,
          object: idObj,
        },
      },
    };
  }, [fav.mode]);

  const filteredColumns = function (maxWidth: number) {
    const useSmall = maxWidth < 70;
    const selectedColumns: object[] = [];
    const columnVisibilityModel: GridColumnVisibilityModel = {};
    let width: number = 0;

    for (const [key, value] of Object.entries(columnSpecs)) {
      // do not use col currency on swaps
      if (fav.mode === 'swap' && key === 'currency') {
        continue;
      }

      const colWidth = useSmall && value.small ? value.small.width : value.normal.width;
      const colObject = useSmall && value.small ? value.small.object : value.normal.object;

      if (width + colWidth < maxWidth || selectedColumns.length < 2) {
        width = width + colWidth;
        selectedColumns.push([colObject(colWidth), value.order]);
        columnVisibilityModel[key] = true;
      } else {
        selectedColumns.push([colObject(colWidth), value.order]);
        columnVisibilityModel[key] = false;
      }
    }

    // sort columns by column.order value
    selectedColumns.sort(function (first, second) {
      return first[1] - second[1];
    });

    const columns = selectedColumns.map(function (item) {
      return item[0];
    });

    setColumnVisibilityModel(columnVisibilityModel);
    return [columns, width * 0.875 + 0.15];
  };

  const [columns, width] = useMemo(() => {
    return filteredColumns(fullscreen ? fullWidth : maxWidth);
  }, [maxWidth, fullscreen, fullWidth, fav.mode]);

  const Footer = function () {
    return (
      <Grid container alignItems='center' direction='row' justifyContent='space-between'>
        <Grid item>
          <Grid container alignItems='center' direction='row'>
            <Grid item xs={6}>
              <IconButton
                onClick={() => {
                  setFullscreen(!fullscreen);
                }}
              >
                {fullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Grid>
            <Grid item xs={6}>
              <IconButton onClick={fetchFederationBook}>
                <Refresh />
              </IconButton>
            </Grid>
          </Grid>
        </Grid>

        <Grid item>
          <GridPagination />
        </Grid>
      </Grid>
    );
  };

  interface GridComponentProps {
    LoadingOverlay: (props: LinearProgressProps) => JSX.Element;
    NoResultsOverlay?: (props: any) => JSX.Element;
    NoRowsOverlay?: (props: any) => JSX.Element;
    Footer?: (props: any) => JSX.Element;
    Toolbar?: (props: any) => JSX.Element;
  }

  const NoResultsOverlay = function () {
    return (
      <Grid
        container
        direction='column'
        justifyContent='center'
        alignItems='center'
        sx={{ width: '100%', height: '100%' }}
      >
        <Grid item>
          <Typography align='center' component='h5' variant='h5'>
            {fav.type == 0
              ? t('No orders found to sell BTC for {{currencyCode}}', {
                  currencyCode:
                    fav.currency == 0 ? t('ANY') : currencyDict[fav.currency.toString()],
                })
              : t('No orders found to buy BTC for {{currencyCode}}', {
                  currencyCode:
                    fav.currency == 0 ? t('ANY') : currencyDict[fav.currency.toString()],
                })}
          </Typography>
        </Grid>
        <Grid item>
          <Typography align='center' color='primary' variant='h6'>
            {t('Be the first one to create an order')}
          </Typography>
        </Grid>
      </Grid>
    );
  };

  const gridComponents = useMemo(() => {
    const components: GridComponentProps = {
      LoadingOverlay: LinearProgress,
    };

    if (showNoResults) {
      components.NoResultsOverlay = NoResultsOverlay;
      components.NoRowsOverlay = NoResultsOverlay;
    }
    if (showFooter) {
      components.Footer = Footer;
    }
    if (showControls) {
      components.Toolbar = BookControl;
    }
    return components;
  }, [showNoResults, showFooter, showControls, fullscreen]);

  const filteredOrders = useMemo(() => {
    return showControls
      ? filterOrders({
          orders,
          baseFilter: fav,
          paymentMethods,
        })
      : orders;
  }, [showControls, orders, fav, paymentMethods]);

  if (!fullscreen) {
    return (
      <Paper
        elevation={elevation}
        style={
          fillContainer
            ? { width: '100%', height: '100%' }
            : { width: `${width}em`, height: `${height}em`, overflow: 'auto' }
        }
      >
        <ClickThroughDataGrid
          localeText={localeText}
          rowHeight={3.714 * theme.typography.fontSize}
          headerHeight={3.25 * theme.typography.fontSize}
          rows={filteredOrders}
          getRowId={(params: PublicOrder) => `${params.coordinatorShortAlias}/${params.id}`}
          loading={book.loading}
          columns={columns}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={(newColumnVisibilityModel) => {
            setColumnVisibilityModel(newColumnVisibilityModel);
          }}
          hideFooter={!showFooter}
          components={gridComponents}
          componentsProps={{
            toolbar: {
              width,
              fav,
              setFav,
              paymentMethod: paymentMethods,
              setPaymentMethods,
            },
            loadingOverlay: {
              variant: 'determinate',
              value: loadingProgress,
            },
          }}
          paginationModel={paginationModel}
          pageSizeOptions={width < 22 ? [] : [0, defaultPageSize, defaultPageSize * 2, 50, 100]}
          onPaginationModelChange={(newPaginationModel) => {
            setPaginationModel(newPaginationModel);
          }}
        />
      </Paper>
    );
  } else {
    return (
      <Dialog open={fullscreen} fullScreen={true}>
        <Paper style={{ width: '100%', height: '100%', overflow: 'auto' }}>
          <ClickThroughDataGrid
            localeText={localeText}
            rowHeight={3.714 * theme.typography.fontSize}
            headerHeight={3.25 * theme.typography.fontSize}
            rows={filteredOrders}
            loading={book.loading}
            columns={columns}
            hideFooter={!showFooter}
            components={gridComponents}
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={(newColumnVisibilityModel) => {
              setColumnVisibilityModel(newColumnVisibilityModel);
            }}
            componentsProps={{
              toolbar: {
                width,
                fav,
                setFav,
                paymentMethod: paymentMethods,
                setPaymentMethods,
              },
            }}
            paginationModel={paginationModel}
            pageSizeOptions={width < 22 ? [] : [0, defaultPageSize, defaultPageSize * 2, 50, 100]}
            onPaginationModelChange={(newPaginationModel) => {
              setPaginationModel(newPaginationModel);
            }}
          />
        </Paper>
      </Dialog>
    );
  }
};

export default BookTable;
