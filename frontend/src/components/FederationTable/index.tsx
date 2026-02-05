import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Link, LinkOff } from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Rating,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridValidRowModel } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import { Origin, type Coordinator } from '../../models';
import headerStyleFix from '../DataGrid/HeaderFix';
import RobotAvatar from '../RobotAvatar';

import { UseGarageStoreType, GarageContext } from '../../contexts/GarageContext';
import { Origins } from '../../models/Coordinator.model';

interface FederationTableProps {
  maxWidth?: number;
  maxHeight?: number;
  fillContainer?: boolean;
  showTitle?: boolean;
}

const FederationTable = ({
  maxWidth = 90,
  maxHeight = 50,
  fillContainer = false,
  showTitle = true,
}: FederationTableProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const { federationUpdatedAt, setFederationUpdatedAt } = useContext<UseAppStoreType>(AppContext);
  const { setOpen, windowSize, settings, origin, hostUrl } =
    useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const theme = useTheme();
  const [pageSize, setPageSize] = useState<number>(0);

  const [newAlias, setNewAlias] = useState<string>('');
  const [newUrl, setNewUrl] = useState<string>('');
  const [error, setError] = useState<string>();
  const [useDefaultPageSize, setUseDefaultPageSize] = useState(true);
  const [verifyRatings, setVerifyRatings] = useState(false);
  const [verifcationText, setVerificationText] = useState<string>();
  const [openAddCoordinator, setOpenAddCoordinator] = useState<boolean>(false);

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
  // Regular expression to match a valid .onion URL
  const onionUrlPattern = /^((http|https):\/\/)?([a-zA-Z2-7]{16,56}\.onion)(\/.*)?$/;

  const addNewCoordinator: (alias: string, url: string) => void = (alias, url) => {
    if (!federation.getCoordinator(alias)) {
      const attributes: object = {
        longAlias: alias,
        shortAlias: alias,
        federated: false,
        enabled: true,
      };
      const origins: Origins = {
        clearnet: undefined,
        onion: url as Origin,
        i2p: undefined,
      };
      if (settings.network === 'mainnet') {
        attributes.mainnet = origins;
      } else {
        attributes.testnet = origins;
      }
      federation.addCoordinator(origin, settings, hostUrl, attributes);
      garage.syncCoordinator(federation, alias);
      setFederationUpdatedAt(new Date().toISOString());
    }
  };

  useEffect(() => {
    federation.loadInfo();
    federation.loadRatings();
  }, []);

  useEffect(() => {
    if (verifyRatings) {
      federation.loadRatings(true);
      setVerificationText(t('Reloading. Invalid ratings will be filtered.'));
    }
  }, [verifyRatings]);

  useEffect(() => {
    if (useDefaultPageSize) {
      setPageSize(defaultPageSize);
    }
  }, [federationUpdatedAt]);

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
      headerName: mobile ? '' : t('Alias'),
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
        const coordinatorRating = federation.ratings[coordinator.nostrHexPubkey];

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
              {Boolean(params.row.loadingInfo) && Boolean(params.row.enabled) ? (
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

  const addCoordinator: () => void = () => {
    setOpenAddCoordinator(false);
    if (federation.getCoordinator(newAlias)) {
      setError(t('Alias already exists'));
    } else {
      const match = newUrl.match(onionUrlPattern);
      if (match) {
        const onionUrl = match[3];
        const fullNewUrl = `http://${onionUrl}`;
        addNewCoordinator(newAlias, fullNewUrl);
        garage.syncCoordinator(federation, newAlias);
        setNewAlias('');
        setNewUrl('');
      } else {
        setError(t('Invalid Onion URL'));
      }
    }
  };

  return (
    <Box
      sx={
        fillContainer
          ? { width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }
          : { width: `${width}em`, height: `${height}em`, overflow: 'auto', padding: '0 0.25em' }
      }
    >
      {showTitle && (
        <Box sx={{ p: 0.5, pb: 0.5 }}>
          <Typography variant='h6' align='center'>
            {t('Coordinators')}
          </Typography>
        </Box>
      )}

      <Box sx={{ flexGrow: 1, overflow: 'auto', width: '100%' }}>
        <DataGrid
          sx={{
            ...headerStyleFix,
            border: 0,
            '& .MuiDataGrid-cell': {
              borderBottom: `1px solid ${theme.palette.divider}`,
            },
          }}
          localeText={localeText}
          style={{ maxHeight: fillContainer ? undefined : `${height / 2}em` }}
          autoHeight={fillContainer}
          rowHeight={3.714 * theme.typography.fontSize}
          headerHeight={3.25 * theme.typography.fontSize}
          rows={federation.getCoordinators()}
          getRowId={(params: Coordinator) => params.shortAlias}
          columns={columns}
          checkboxSelection={false}
          pageSize={fillContainer ? 100 : pageSize}
          rowsPerPageOptions={width < 22 ? [] : [0, pageSize, defaultPageSize * 2, 50, 100]}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize);
            setUseDefaultPageSize(false);
          }}
          hideFooter={true}
        />
      </Box>

      <Grid
        container
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          justifyContent: 'space-between',
          padding: '0 0.25em 0.5em 0.25em',
          flexShrink: 0,
        }}
      >
        <Button
          sx={{ mt: '0.5em', width: '49%' }}
          disabled={false}
          onClick={() => setOpenAddCoordinator(true)}
          variant='contained'
          color='primary'
          size='medium'
          type='submit'
        >
          {t('Add Coordinator')}
        </Button>
        <Button
          sx={{ mt: '0.5em', width: '49%' }}
          disabled={false}
          onClick={() => setVerifyRatings(true)}
          variant='contained'
          color='secondary'
          size='medium'
          type='submit'
        >
          {t('Verify ratings')}
        </Button>
      </Grid>
      <Grid item sx={{ px: 0.5, pb: 1 }}>
        <Typography
          variant='body2'
          color={verifcationText ? 'success.main' : 'warning.main'}
          sx={{ mt: 0, fontWeight: 'bold' }}
        >
          {verifcationText
            ? verifcationText
            : t(
                'Verifying all ratings might take some time; this window may freeze for a few seconds while the cryptographic certification is in progress.',
              )}
        </Typography>
      </Grid>
      <Dialog
        open={openAddCoordinator}
        onClose={() => {
          setOpenAddCoordinator(false);
        }}
        aria-labelledby='recovery-dialog-title'
        aria-describedby='recovery-description'
      >
        <DialogTitle>{t('Add coordinator')}</DialogTitle>
        <DialogContent>
          <Grid container direction='column' alignItems='center' spacing={1} padding={2}>
            {error ?? (
              <Grid item xs={12}>
                <Typography align='center' component='h2' variant='subtitle2' color='secondary'>
                  {error}
                </Typography>
              </Grid>
            )}
            <Grid item xs={12}>
              <Grid container direction='column' alignItems='center'>
                <Grid item xs={4}>
                  <TextField
                    id='outlined-basic'
                    label={t('Alias')}
                    variant='outlined'
                    size='medium'
                    value={newAlias}
                    onChange={(e) => {
                      setNewAlias(e.target.value);
                    }}
                  />
                </Grid>
                <Grid item xs={6} padding={2}>
                  <TextField
                    id='outlined-basic'
                    label={t('URL')}
                    variant='outlined'
                    size='medium'
                    value={newUrl}
                    onChange={(e) => {
                      setNewUrl(e.target.value);
                    }}
                  />
                </Grid>
                <Grid item xs={1}>
                  <Button
                    sx={{ maxHeight: 38, marginTop: 2.5 }}
                    disabled={false}
                    onClick={addCoordinator}
                    variant='contained'
                    color='primary'
                    size='large'
                    type='submit'
                  >
                    {t('Add coordinator')}
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default FederationTable;
