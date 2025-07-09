import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Link, LinkOff } from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Grid,
  Rating,
  Typography,
  useTheme,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridValidRowModel } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import { type Coordinator } from '../../models';
import headerStyleFix from '../DataGrid/HeaderFix';
import RobotAvatar from '../RobotAvatar';
import { verifyCoordinatorToken } from '../../utils/nostr';

interface FederationTableProps {
  maxWidth?: number;
  maxHeight?: number;
  fillContainer?: boolean;
}

const FederationTable = ({
  maxWidth = 90,
  maxHeight = 50,
  fillContainer = false,
}: FederationTableProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { federation, federationUpdatedAt } = useContext<UseFederationStoreType>(FederationContext);
  const { setOpen, windowSize, settings } = useContext<UseAppStoreType>(AppContext);
  const theme = useTheme();
  const [pageSize, setPageSize] = useState<number>(0);
  const [ratings, setRatings] = useState<Record<string, Record<string, number>>>(
    federation.getCoordinators().reduce((acc, coord) => {
      if (coord.nostrHexPubkey) acc[coord.nostrHexPubkey] = {};
      return acc;
    }, {}),
  );
  const [useDefaultPageSize, setUseDefaultPageSize] = useState(true);
  const [verifyRatings, setVerifyRatings] = useState(false);
  const [verifcationText, setVerificationText] = useState<string>();

  // all sizes in 'em'
  const fontSize = theme.typography.fontSize;
  const verticalHeightFrame = 3.3;
  const verticalHeightRow = 3.27;
  const defaultPageSize = Math.max(
    Math.floor((maxHeight - verticalHeightFrame) / verticalHeightRow),
    1,
  );
  const height = defaultPageSize * verticalHeightRow + verticalHeightFrame;
  const mobile = windowSize.width < 44;

  useEffect(() => {
    loadRatings();
  }, []);

  useEffect(() => {
    if (verifyRatings) {
      loadRatings();
      setVerificationText(t('Reloading. Invalid ratings will be filtered.'));
    }
  }, [verifyRatings]);

  useEffect(() => {
    if (useDefaultPageSize) {
      setPageSize(defaultPageSize);
    }
  }, [federationUpdatedAt]);

  const loadRatings: () => void = () => {
    setRatings(
      federation.getCoordinators().reduce((acc, coord) => {
        if (coord.nostrHexPubkey) acc[coord.nostrHexPubkey] = {};
        return acc;
      }, {}),
    );
    federation.roboPool.subscribeRatings({
      onevent: (event) => {
        const coordinatorPubKey = event.tags.find((t) => t[0] === 'p')?.[1];
        const verified = verifyRatings ? verifyCoordinatorToken(event) : true;
        if (verified && coordinatorPubKey) {
          const rating = event.tags.find((t) => t[0] === 'rating')?.[1];
          if (rating) {
            setRatings((prev) => {
              prev[coordinatorPubKey][event.pubkey] = parseFloat(rating);
              return prev;
            });
          }
        }
      },
      oneose: () => {
        if (verifyRatings) setVerificationText(t('Invalid ratings have been filtered.'));
      },
    });
  };

  const localeText = {
    noResultsOverlayLabel: t('No coordinators found.'),
  };

  const onClickCoordinator = function (shortAlias: string): void {
    setOpen((open) => {
      return { ...open, coordinator: shortAlias };
    });
  };

  const aliasObj = useCallback(() => {
    return {
      field: 'longAlias',
      headerName: mobile ? '' : t('Rating'),
      width: mobile ? 60 : 190,
      renderCell: (params: { row: Coordinator }) => {
        const coordinator = federation.getCoordinator(params.row.shortAlias);
        return (
          <Grid
            container
            direction='row'
            sx={{
              cursor: 'pointer',
              position: 'relative',
              left: '-0.3em',
              width: '50em',
              marginTop: '2px',
            }}
            wrap='nowrap'
            onClick={() => {
              onClickCoordinator(params.row.shortAlias);
            }}
            alignItems='center'
            spacing={1}
          >
            <Grid item>
              <RobotAvatar
                shortAlias={coordinator.federated ? params.row.shortAlias : undefined}
                hashId={coordinator.federated ? undefined : coordinator.mainnet.onion}
                style={{ width: '3.215em', height: '3.215em' }}
                smooth={true}
                small={true}
              />
            </Grid>
            {!mobile ? (
              <Grid item>
                <Typography>{params.row.longAlias}</Typography>
              </Grid>
            ) : (
              <></>
            )}
          </Grid>
        );
      },
    };
  }, []);

  const ratingObj = useCallback(() => {
    return {
      field: 'rating',
      headerName: t('Rating'),
      width: mobile ? 60 : 180,
      renderCell: (params: { row: Coordinator }) => {
        const coordinator = federation.getCoordinator(params.row.shortAlias);
        const coordinatorRating = ratings[coordinator.nostrHexPubkey];

        if (!coordinatorRating) return <></>;

        const totalRatings = Object.values(coordinatorRating);
        const total = totalRatings.length;
        const sum: number = Object.values(totalRatings).reduce((accumulator, currentValue) => {
          return accumulator + currentValue;
        }, 0);
        const average = total < 1 ? 0 : sum / total;

        return (
          <>
            {mobile ? (
              <Grid container direction='column' alignItems='center' style={{ paddingTop: 10 }}>
                <Typography>{`${parseFloat((average * 10).toFixed(1))}`}</Typography>
              </Grid>
            ) : (
              <>
                <Rating
                  readOnly
                  precision={0.5}
                  name='size-large'
                  value={average * 5}
                  defaultValue={0}
                  disabled={settings.connection !== 'nostr'}
                  onClick={() => {
                    onClickCoordinator(params.row.shortAlias);
                  }}
                />
                <Typography variant='caption' color='text.secondary'>
                  {`(${total})`}
                </Typography>
              </>
            )}
          </>
        );
      },
    };
  }, [federationUpdatedAt]);

  const enabledObj = useCallback(
    (width: number) => {
      return {
        field: 'enabled',
        headerName: t('Enabled'),
        width: width * fontSize,
        renderCell: (params: { row: Coordinator }) => {
          return (
            <Checkbox
              checked={params.row.enabled}
              onClick={() => {
                onEnableChange(params.row.shortAlias);
              }}
            />
          );
        },
      };
    },
    [federationUpdatedAt],
  );

  const upObj = useCallback(
    (width: number) => {
      return {
        field: 'up',
        headerName: t('Up'),
        width: width * fontSize,
        renderCell: (params: { row: Coordinator }) => {
          return (
            <div
              style={{ cursor: 'pointer' }}
              onClick={() => {
                onClickCoordinator(params.row.shortAlias);
              }}
            >
              {Boolean(params.row.loadingLimits) && Boolean(params.row.enabled) ? (
                <CircularProgress thickness={0.35 * fontSize} size={1.5 * fontSize} />
              ) : params.row.limits !== undefined ? (
                <Link color='success' />
              ) : (
                <LinkOff color='error' />
              )}
            </div>
          );
        },
      };
    },
    [federationUpdatedAt],
  );

  const columnSpecs = {
    alias: {
      priority: 2,
      order: 1,
      normal: {
        width: 12.1,
        object: aliasObj,
      },
    },
    rating: {
      priority: 2,
      order: 2,
      normal: {
        width: 12.1,
        object: ratingObj,
      },
    },
    up: {
      priority: 3,
      order: 3,
      normal: {
        width: 3.5,
        object: upObj,
      },
    },
    enabled: {
      priority: 1,
      order: 4,
      normal: {
        width: 5,
        object: enabledObj,
      },
    },
  };

  const filteredColumns = function (): {
    columns: Array<GridColDef<GridValidRowModel>>;
    width: number;
  } {
    const useSmall = maxWidth < 30;
    const selectedColumns: object[] = [];
    let width: number = 0;

    for (const value of Object.values(columnSpecs)) {
      const colWidth = Number(
        useSmall && Boolean(value.small) ? value.small.width : value.normal.width,
      );
      const colObject = useSmall && Boolean(value.small) ? value.small.object : value.normal.object;

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

    const columns: Array<GridColDef<GridValidRowModel>> = selectedColumns.map(function (item) {
      return item[0];
    });

    return { columns, width: width * 0.9 };
  };

  const { columns, width } = filteredColumns();

  const onEnableChange = function (shortAlias: string): void {
    if (federation.getCoordinator(shortAlias).enabled === true) {
      federation.disableCoordinator(shortAlias);
    } else {
      federation.enableCoordinator(shortAlias);
    }
  };

  return (
    <Box
      sx={
        fillContainer
          ? { width: '100%', height: '100%' }
          : { width: `${width}em`, height: `${height}em`, overflow: 'auto' }
      }
    >
      <DataGrid
        sx={headerStyleFix}
        localeText={localeText}
        rowHeight={3.714 * theme.typography.fontSize}
        headerHeight={3.25 * theme.typography.fontSize}
        rows={federation.getCoordinators()}
        getRowId={(params: Coordinator) => params.shortAlias}
        columns={columns}
        checkboxSelection={false}
        pageSize={pageSize}
        rowsPerPageOptions={width < 22 ? [] : [0, pageSize, defaultPageSize * 2, 50, 100]}
        onPageSizeChange={(newPageSize) => {
          setPageSize(newPageSize);
          setUseDefaultPageSize(false);
        }}
        hideFooter={true}
      />

      <Grid item>
        {!verifcationText && (
          <Button
            sx={{ maxHeight: 38, mt: '1em' }}
            disabled={false}
            onClick={() => setVerifyRatings(true)}
            variant='contained'
            color='secondary'
            size='small'
            type='submit'
          >
            {t('Verify ratings')}
          </Button>
        )}
        <Typography
          variant='body2'
          color={verifcationText ? 'success.main' : 'warning.main'}
          sx={{ mt: 2, fontWeight: 'bold' }}
        >
          {verifcationText
            ? verifcationText
            : t(
                'Verifying all ratings might take some time; this window may freeze for a few seconds while the cryptographic certification is in progress.',
              )}
        </Typography>
      </Grid>
    </Box>
  );
};

export default FederationTable;
