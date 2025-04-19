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
  styled,
  Skeleton,
} from '@mui/material';
import {
  DataGrid,
  type GridColumnVisibilityModel,
  GridPagination,
  type GridPaginationModel,
  type GridColDef,
  type GridValidRowModel,
  type GridSlotsComponent,
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
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import headerStyleFix from '../DataGrid/HeaderFix';
import thirdParties from '../../../static/thirdparties.json';

const ClickThroughDataGrid = styled(DataGrid)({
  '& .MuiDataGrid-overlayWrapperInner': {
    pointerEvents: 'none',
  },
});

const premiumColor = function (baseColor: string, accentColor: string, point: number): string {
  const baseRGB = hexToRgb(baseColor);
  const accentRGB = hexToRgb(accentColor);
  const redDiff = accentRGB[0] - baseRGB[0];
  const red = Number(baseRGB[0]) + redDiff * point;
  const greenDiff = accentRGB[1] - baseRGB[1];
  const green = Number(baseRGB[1]) + greenDiff * point;
  const blueDiff = accentRGB[2] - baseRGB[2];
  const blue = Number(baseRGB[2]) + blueDiff * point;
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
  const { fav, setOpen } = useContext<UseAppStoreType>(AppContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);

  const { t } = useTranslation();
  const theme = useTheme();
  const orders = orderList ?? Object.values(federation.book) ?? [];

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    pageSize: 0,
    page: 1,
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
      pageSize: defaultPageSize,
      page: paginationModel.page ?? 1,
    });
  }, [defaultPageSize]);

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
        const thirdParty = thirdParties[params.row.coordinatorShortAlias];
        return (
          <ListItemButton
            style={{ cursor: 'pointer' }}
            onClick={() => {
              onOrderClicked(params.row.id, params.row.coordinatorShortAlias);
            }}
          >
            <ListItemAvatar sx={{ position: 'relative', left: '-1.3em', bottom: '0.6em' }}>
              <RobotAvatar
                hashId={params.row.maker_hash_id}
                style={{ width: '3.215em', height: '3.215em' }}
                smooth={true}
                flipHorizontally={true}
                orderType={params.row.type}
                statusColor={statusBadgeColor(params.row.maker_status)}
                tooltip={t(params.row.maker_status)}
                small={true}
              />
            </ListItemAvatar>
            <ListItemText
              primary={params.row.maker_nick ?? thirdParty.longAlias}
              sx={{ position: 'relative', left: '-1.3em', bottom: '0.6em' }}
            />
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
        const coordinator = federation.getCoordinator(params.row.coordinatorShortAlias);
        const thirdParty = thirdParties[params.row.coordinatorShortAlias];
        return (
          <div
            style={{ position: 'relative', cursor: 'pointer', bottom: '0.2em' }}
            onClick={() => {
              onOrderClicked(params.row.id, params.row.coordinatorShortAlias);
            }}
          >
            <RobotAvatar
              hashId={params.row.maker_hash_id}
              smooth={true}
              flipHorizontally={true}
              style={{ width: '3.215em', height: '3.215em' }}
              orderType={params.row.type}
              statusColor={statusBadgeColor(params.row.maker_status)}
              tooltip={t(params.row.maker_status)}
              coordinatorShortAlias={
                thirdParty?.shortAlias ??
                (coordinator?.federated ? params.row.coordinatorShortAlias : undefined)
              }
            />
          </div>
        );
      },
    };
  }, []);

  const onClickCoordinator = function (shortAlias: string): void {
    setOpen((open) => {
      const thirdParty = thirdParties[shortAlias];
      if (thirdParty) {
        return { ...open, thirdParty: shortAlias };
      } else {
        return { ...open, coordinator: shortAlias };
      }
    });
  };

  const coordinatorObj = useCallback((width: number) => {
    return {
      field: 'coordinatorShortAlias',
      headerName: t('Host'),
      width: width * fontSize,
      renderCell: (params: any) => {
        const coordinator = federation.getCoordinator(params.row.coordinatorShortAlias);
        const thirdParty = thirdParties[params.row.coordinatorShortAlias];
        return (
          <ListItemButton
            style={{ cursor: 'pointer' }}
            onClick={() => {
              onClickCoordinator(params.row.coordinatorShortAlias);
            }}
          >
            <ListItemAvatar sx={{ position: 'relative', left: '-1.54em', bottom: '0.4em' }}>
              <RobotAvatar
                shortAlias={
                  thirdParty?.shortAlias ??
                  (coordinator?.federated ? params.row.coordinatorShortAlias : undefined)
                }
                hashId={coordinator?.federated ? undefined : coordinator?.shortAlias}
                style={{ width: '3.215em', height: '3.215em' }}
                smooth={true}
                small={true}
              />
            </ListItemAvatar>
          </ListItemButton>
        );
      },
    };
  }, []);

  const typeObj = useCallback(
    (width: number) => {
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
              {params.row.type === 1
                ? t(fav.mode === 'fiat' ? 'Seller' : 'Swapping Out')
                : t(fav.mode === 'fiat' ? 'Buyer' : 'Swapping In')}
            </div>
          );
        },
      };
    },
    [fav.mode],
  );

  const amountObj = useCallback(
    (width: number) => {
      return {
        field: 'amount',
        headerName: t('Amount'),
        type: 'number',
        width: width * fontSize,
        renderCell: (params: any) => {
          const amount = fav.mode === 'swap' ? params.row.amount * 100 : params.row.amount;
          const minAmount =
            fav.mode === 'swap' ? params.row.min_amount * 100 : params.row.min_amount;
          const maxAmount =
            fav.mode === 'swap' ? params.row.max_amount * 100 : params.row.max_amount;
          return (
            <div
              style={{ cursor: 'pointer' }}
              onClick={() => {
                onOrderClicked(params.row.id, params.row.coordinatorShortAlias);
              }}
            >
              {amountToString(amount, params.row.has_range, minAmount, maxAmount) +
                (fav.mode === 'swap' ? 'M Sats' : '')}
            </div>
          );
        },
      };
    },
    [fav.mode],
  );

  const currencyObj = useCallback((width: number) => {
    return {
      field: 'currency',
      headerName: t('Currency'),
      width: width * fontSize,
      renderCell: (params: any) => {
        const currencyCode = String(currencyDict[params.row.currency.toString()]);
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
            <div style={{ position: 'relative', left: '0.3em', bottom: '0.7em' }}>
              <FlagWithProps code={currencyCode} />
            </div>
          </div>
        );
      },
    };
  }, []);

  const paymentObj = useCallback(
    (width: number) => {
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
              <div style={{ position: 'relative', top: '0.4em' }}>
                <PaymentStringAsIcons
                  othersText={t('Others')}
                  verbose={true}
                  size={1.7 * fontSize}
                  text={params.row.payment_method}
                />
              </div>
            </div>
          );
        },
      };
    },
    [fav.mode],
  );

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
              left: '-0.25em',
              top: '0.3em',
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
        const currencyCode = String(currencyDict[params.row.currency.toString()]);
        const coordinator =
          federation.getCoordinator(params.row.coordinatorShortAlias) ??
          federation.getCoordinators()[0];
        const premium = parseFloat(params.row.premium);
        const limitPrice = coordinator.limits[params.row.currency.toString()]?.price;
        const price = (limitPrice ?? 1) * (1 + premium / 100);

        return (
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => {
              onOrderClicked(params.row.id, params.row.coordinatorShortAlias);
            }}
          >
            {limitPrice ? (
              `${pn(Math.round(price))} ${currencyCode}/BTC`
            ) : (
              <Skeleton variant='rectangular' width={200} height={20} style={{ marginTop: 15 }} />
            )}
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
          const currencyCode = String(currencyDict[params.row.currency.toString()]);
          let fontColor = `rgb(0,0,0)`;
          let premiumPoint = 0;
          if (params.row.type === 0) {
            premiumPoint = params.row.premium / buyOutstandingPremium;
            premiumPoint = premiumPoint < 0 ? 0 : premiumPoint > 1 ? 1 : premiumPoint;
            fontColor = premiumColor(
              theme.palette.text.primary,
              theme.palette.secondary.dark,
              premiumPoint,
            );
          } else {
            premiumPoint = (sellStandardPremium - params.row.premium) / sellStandardPremium;
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
              title={`${pn(params.row.price)} ${currencyCode}/BTC`}
            >
              <div
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  onOrderClicked(params.row.id, params.row.coordinatorShortAlias);
                }}
              >
                <Typography variant='inherit' color={fontColor} sx={{ fontWeight }}>
                  {`${parseFloat(parseFloat(params.row.premium).toFixed(4))}%`}
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
            {hours > 0 ? `${hours}h` : minutes ? `${minutes}m` : '-'}
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
            sx={{ position: 'relative', display: 'inline-flex', left: '0.3em', top: '0.5em' }}
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
        const coordinator =
          federation.getCoordinator(params.row.coordinatorShortAlias) ??
          federation.getCoordinators()[0];
        const amount =
          params.row.has_range === true
            ? parseFloat(params.row.max_amount)
            : parseFloat(params.row.amount);
        const premium = parseFloat(params.row.premium);
        const price =
          (coordinator.limits[params.row.currency.toString()]?.price ?? 1) * (1 + premium / 100);
        const satoshisNow = (100000000 * amount) / price;

        return (
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => {
              onOrderClicked(params.row.id, params.row.coordinatorShortAlias);
            }}
          >
            {satoshisNow > 1000000
              ? `${pn(Math.round(satoshisNow / 10000) / 100)} M`
              : `${pn(Math.round(satoshisNow / 1000))} K`}
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
              {`#${String(params.row.id)}`}
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
          >
            {params.row.bond_size ? `${Number(params.row.bond_size)}%` : '-'}
          </div>
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
          width: 5.1,
          object: robotSmallObj,
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
      coordinatorShortAlias: {
        priority: 10,
        order: 3,
        normal: {
          width: 4.1,
          object: coordinatorObj,
        },
        small: {
          width: 5.1,
          object: () => {
            return {
              field: 'coordinatorShortAlias',
              headerName: '',
              width: 0,
              renderCell: () => <></>,
            };
          },
        },
      },
      type: {
        priority: 11,
        order: 2,
        normal: {
          width: fav.mode === 'swap' ? 7 : 4.3,
          object: typeObj,
        },
      },
      bond_size: {
        priority: 12,
        order: 11,
        normal: {
          width: 4.2,
          object: bondObj,
        },
      },
      id: {
        priority: 13,
        order: 13,
        normal: {
          width: 4.8,
          object: idObj,
        },
      },
    };
  }, [fav.mode]);

  const filteredColumns = function (maxWidth: number): {
    columns: Array<GridColDef<GridValidRowModel>>;
    width: number;
  } {
    const useSmall = maxWidth < 70;
    const selectedColumns: object[] = [];
    const columnVisibilityModel: GridColumnVisibilityModel = {};
    let width: number = 0;

    for (const [key, value] of Object.entries(columnSpecs)) {
      // do not use col currency on swaps
      if (fav.mode === 'swap' && key === 'currency') {
        continue;
      }

      const colWidth = Number(
        useSmall && Boolean(value.small) ? value.small.width : value.normal.width,
      );
      const colObject = useSmall && Boolean(value.small) ? value.small.object : value.normal.object;

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

    const columns: Array<GridColDef<GridValidRowModel>> = selectedColumns.map(function (item) {
      return item[0];
    });

    setColumnVisibilityModel(columnVisibilityModel);
    return { columns, width: width * 0.875 + 0.15 };
  };

  const { columns, width } = useMemo(() => {
    return filteredColumns(fullscreen ? fullWidth : maxWidth);
  }, [maxWidth, fullscreen, fullWidth, fav.mode]);

  const Footer = function (): JSX.Element {
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
              <IconButton
                onClick={() => {
                  void federation.loadBook();
                }}
              >
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

  const NoResultsOverlay = function (): JSX.Element {
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
            {fav.type === 0
              ? t('No orders found to sell BTC for {{currencyCode}}', {
                  currencyCode:
                    fav.currency === 0 ? t('ANY') : currencyDict[fav.currency.toString()],
                })
              : t('No orders found to buy BTC for {{currencyCode}}', {
                  currencyCode:
                    fav.currency === 0 ? t('ANY') : currencyDict[fav.currency.toString()],
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
    const components: GridSlotsComponent = {
      loadingOverlay: LinearProgress,
    };

    if (showNoResults) {
      components.noResultsOverlay = NoResultsOverlay;
      components.noRowsOverlay = NoResultsOverlay;
    }
    if (showFooter) {
      components.footer = Footer;
    }
    if (showControls) {
      components.toolbar = BookControl;
    }
    return components;
  }, [showNoResults, showFooter, showControls, fullscreen]);

  const filteredOrders = useMemo(() => {
    return showControls
      ? filterOrders({
          federation,
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
          sx={headerStyleFix}
          localeText={localeText}
          rowHeight={3.714 * theme.typography.fontSize}
          headerHeight={3.25 * theme.typography.fontSize}
          rows={filteredOrders}
          getRowId={(params: PublicOrder) => `${String(params.coordinatorShortAlias)}/${params.id}`}
          loading={federation.loading}
          columns={columns}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={(newColumnVisibilityModel) => {
            setColumnVisibilityModel(newColumnVisibilityModel);
          }}
          hideFooter={!showFooter}
          slots={gridComponents}
          slotProps={{
            toolbar: {
              width,
              paymentMethod: paymentMethods,
              setPaymentMethods,
            },
            loadingOverlay: {
              variant: 'indeterminate',
              value: federation.loading ? 0 : 100,
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
            sx={headerStyleFix}
            localeText={localeText}
            rowHeight={3.714 * theme.typography.fontSize}
            headerHeight={3.25 * theme.typography.fontSize}
            rows={filteredOrders}
            loading={federation.loading}
            columns={columns}
            hideFooter={!showFooter}
            slots={gridComponents}
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={(newColumnVisibilityModel) => {
              setColumnVisibilityModel(newColumnVisibilityModel);
            }}
            slotProps={{
              toolbar: {
                width,
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
