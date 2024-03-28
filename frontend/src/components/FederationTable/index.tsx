import React, { useCallback, useEffect, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, useTheme, Checkbox, CircularProgress, Typography, Grid } from '@mui/material';
import { DataGrid, type GridColDef, type GridValidRowModel } from '@mui/x-data-grid';
import { type Coordinator } from '../../models';
import RobotAvatar from '../RobotAvatar';
import { Link, LinkOff } from '@mui/icons-material';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { type UseFederationStoreType, FederationContext } from '../../contexts/FederationContext';

interface FederationTableProps {
  maxWidth?: number;
  maxHeight?: number;
  fillContainer?: boolean;
}

const FederationTable = ({
  maxWidth = 90,
  maxHeight = 50,
  fillContainer = false,
}: FederationTableProps): JSX.Element => {
  const { t } = useTranslation();
  const { federation, sortedCoordinators, coordinatorUpdatedAt } =
    useContext<UseFederationStoreType>(FederationContext);
  const { setOpen } = useContext<UseAppStoreType>(AppContext);
  const theme = useTheme();
  const [pageSize, setPageSize] = useState<number>(0);

  // all sizes in 'em'
  const fontSize = theme.typography.fontSize;
  const verticalHeightFrame = 3.3;
  const verticalHeightRow = 3.27;
  const defaultPageSize = Math.max(
    Math.floor((maxHeight - verticalHeightFrame) / verticalHeightRow),
    1,
  );
  const height = defaultPageSize * verticalHeightRow + verticalHeightFrame;

  const [useDefaultPageSize, setUseDefaultPageSize] = useState(true);

  useEffect(() => {
    if (useDefaultPageSize) {
      setPageSize(defaultPageSize);
    }
  }, [coordinatorUpdatedAt]);

  const localeText = {
    MuiTablePagination: { labelRowsPerPage: t('Coordinators per page:') },
    noResultsOverlayLabel: t('No coordinators found.'),
  };

  const onClickCoordinator = function (shortAlias: string): void {
    setOpen((open) => {
      return { ...open, coordinator: shortAlias };
    });
  };

  const aliasObj = useCallback((width: number) => {
    return {
      field: 'longAlias',
      headerName: t('Coordinator'),
      width: width * fontSize,
      renderCell: (params: any) => {
        return (
          <Grid
            container
            direction='row'
            sx={{ cursor: 'pointer', position: 'relative', left: '-0.3em', width: '50em' }}
            wrap='nowrap'
            onClick={() => {
              onClickCoordinator(params.row.shortAlias);
            }}
            alignItems='center'
            spacing={1}
          >
            <Grid item>
              <RobotAvatar
                shortAlias={params.row.shortAlias}
                style={{ width: '3.215em', height: '3.215em' }}
                smooth={true}
                small={true}
              />
            </Grid>
            <Grid item>
              <Typography>{params.row.longAlias}</Typography>
            </Grid>
          </Grid>
        );
      },
    };
  }, []);

  const enabledObj = useCallback(
    (width: number) => {
      return {
        field: 'enabled',
        headerName: t('Enabled'),
        width: width * fontSize,
        renderCell: (params: any) => {
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
    [coordinatorUpdatedAt],
  );

  const upObj = useCallback(
    (width: number) => {
      return {
        field: 'up',
        headerName: t('Up'),
        width: width * fontSize,
        renderCell: (params: any) => {
          return (
            <div
              style={{ cursor: 'pointer' }}
              onClick={() => {
                onClickCoordinator(params.row.shortAlias);
              }}
            >
              {Boolean(params.row.loadingInfo) && Boolean(params.row.enabled) ? (
                <CircularProgress thickness={0.35 * fontSize} size={1.5 * fontSize} />
              ) : params.row.info !== undefined ? (
                <Link color='success' />
              ) : (
                <LinkOff color='error' />
              )}
            </div>
          );
        },
      };
    },
    [coordinatorUpdatedAt],
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
    up: {
      priority: 3,
      order: 2,
      normal: {
        width: 3.5,
        object: upObj,
      },
    },
    enabled: {
      priority: 1,
      order: 3,
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

  const reorderedCoordinators = sortedCoordinators.reduce((coordinators, key) => {
    coordinators[key] = federation.coordinators[key];
    return coordinators;
  }, {});

  return (
    <Box
      sx={
        fillContainer
          ? { width: '100%', height: '100%' }
          : { width: `${width}em`, height: `${height}em`, overflow: 'auto' }
      }
    >
      <DataGrid
        localeText={localeText}
        rowHeight={3.714 * theme.typography.fontSize}
        headerHeight={3.25 * theme.typography.fontSize}
        rows={Object.values(reorderedCoordinators)}
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
    </Box>
  );
};

export default FederationTable;
