import React, { useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Checkbox, CircularProgress, Grid, Typography } from '@mui/material';
import { DataGrid, type GridColDef, type GridValidRowModel } from '@mui/x-data-grid';
import { type Coordinator } from '../../models';
import RobotAvatar from '../RobotAvatar';
import { Link, LinkOff } from '@mui/icons-material';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { type UseFederationStoreType, FederationContext } from '../../contexts/FederationContext';
import { styled } from '@mui/system';

interface FederationTableProps {
  maxWidth?: number;
  fillContainer?: boolean;
}

const FederationTable = ({ maxWidth = 90, fillContainer = false }: FederationTableProps): JSX.Element => {
  const { t } = useTranslation();
  const { federation, sortedCoordinators, coordinatorUpdatedAt } = useContext<UseFederationStoreType>(FederationContext);
  const { setOpen, settings } = useContext<UseAppStoreType>(AppContext);

  const aliasObj = useCallback((width: number) => {
    return {
      field: 'longAlias',
      headerName: t('Coordinator'),
      width: width,
      renderCell: (params: any) => {
        const coordinator = federation.coordinators[params.row.shortAlias];
        return (
          <CoordinatorGrid
            container
            direction="row"
            wrap="nowrap"
            onClick={() => onClickCoordinator(params.row.shortAlias)}
            alignItems="center"
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
            <Grid item>
              <Typography>{params.row.longAlias}</Typography>
            </Grid>
          </CoordinatorGrid>
        );
      },
    };
  }, [federation.coordinators]);

  const enabledObj = useCallback(
    (width: number) => {
      return {
        field: 'enabled',
        headerName: t('Enabled'),
        width: width,
        renderCell: (params: any) => {
          return (
            <Checkbox
              checked={params.row.enabled}
              onClick={() => onEnableChange(params.row.shortAlias)}
            />
          );
        },
      };
    },
    [coordinatorUpdatedAt]
  );

  const upObj = useCallback(
    (width: number) => {
      return {
        field: 'up',
        headerName: t('Up'),
        width: width,
        renderCell: (params: any) => {
          return (
            <UpStatusContainer onClick={() => onClickCoordinator(params.row.shortAlias)}>
              {params.row.loadingInfo && params.row.enabled ? (
                <CircularProgress thickness={2} size={24} />
              ) : params.row.info !== undefined ? (
                <Link color="success" />
              ) : (
                <LinkOff color="error" />
              )}
            </UpStatusContainer>
          );
        },
      };
    },
    [coordinatorUpdatedAt]
  );

  const columnSpecs = {
    alias: {
      normal: {
        width: 200,
        object: aliasObj,
      },
    },
    up: {
      normal: {
        width: 70,
        object: upObj,
      },
    },
    enabled: {
      normal: {
        width: 90,
        object: enabledObj,
      },
    },
  };

  const filteredColumns = function (): {
    columns: Array<GridColDef<GridValidRowModel>>;
    width: number;
  } {
    const selectedColumns: object[] = [];
    let width: number = 0;

    for (const value of Object.values(columnSpecs)) {
      const colWidth = value.normal.width;
      const colObject = value.normal.object;

      width += colWidth;
      selectedColumns.push([colObject(colWidth), value.order]);
    }

    const columns: Array<GridColDef<GridValidRowModel>> = selectedColumns.map(function (item) {
      return item[0];
    });

    return { columns, width: width * 0.9 };
  };

  const { columns } = filteredColumns();

  const onEnableChange = function (shortAlias: string): void {
    if (federation.getCoordinator(shortAlias).enabled === true) {
      federation.disableCoordinator(shortAlias);
    } else {
      federation.enableCoordinator(shortAlias);
    }
  };

  const reorderedCoordinators = useMemo(() => {
    return sortedCoordinators.reduce((coordinators, key) => {
      coordinators[key] = federation.coordinators[key];
      return coordinators;
    }, {});
  }, [settings.network, coordinatorUpdatedAt]);

  const onClickCoordinator = (shortAlias: string): void => {
    setOpen((open) => {
      return { ...open, coordinator: shortAlias };
    });
  };

  return (
    <TableContainer fillContainer={fillContainer} maxWidth={maxWidth}>
      <StyledDataGrid
        rows={Object.values(reorderedCoordinators)}
        getRowId={(params: Coordinator) => params.shortAlias}
        columns={columns}
        checkboxSelection={false}
        autoHeight
        hideFooter
      />
    </TableContainer>
  );
};

// Styled Components
const TableContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'fillContainer' && prop !== 'maxWidth',
})<{ fillContainer: boolean; maxWidth: number }>(({ theme, fillContainer, maxWidth }) => ({
  width: fillContainer ? '100%' : `${maxWidth}em`,
  height: 'fit-content',
  border: '2px solid black',
  overflow: 'hidden',
  borderRadius: '8px',
  boxShadow: 'none',
}));

const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  '& .MuiDataGrid-root': {
    fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
  },
  '& .MuiDataGrid-cell': {
    padding: { xs: '0.5rem', sm: '1rem' },
  },
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: theme.palette.background.default,
    borderBottom: '2px solid black',
    fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
  },
}));

const CoordinatorGrid = styled(Grid)({
  cursor: 'pointer',
  position: 'relative',
  left: '-0.3em',
  width: '50em',
});

const UpStatusContainer = styled('div')({
  cursor: 'pointer',
});

export default FederationTable;