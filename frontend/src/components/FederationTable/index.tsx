import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  useTheme,
  Checkbox,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Coordinator } from '../../models';

import RobotAvatar from '../RobotAvatar';
import { CoordinatorSummaryDialog } from '../Dialogs';
import { Check, Close, Square } from '@mui/icons-material';

interface FederationTableProps {
  coordinators: Coordinator[];
  setCoordinators: (state: Coordinator[]) => void;
  maxWidth?: number;
  maxHeight?: number;
  fillContainer?: boolean;
  baseUrl: string;
}

const FederationTable = ({
  coordinators,
  setCoordinators,
  maxWidth = 100,
  maxHeight = 30,
  fillContainer = false,
  baseUrl,
}: FederationTableProps): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [pageSize, setPageSize] = useState<number>(0);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [selectedCoordinator, setSelectedCoordinator] = useState<Coordinator | undefined>(
    undefined,
  );

  // all sizes in 'em'
  const fontSize = theme.typography.fontSize;
  const verticalHeightFrame = 3.25;
  const verticalHeightRow = 3.25;
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
  });

  const localeText = {
    MuiTablePagination: { labelRowsPerPage: t('Coordinators per page:') },
    noResultsOverlayLabel: t('No coordinators found.'),
  };

  const onClickCoordinator = function (alias: string) {
    coordinators.map((coordinator) => {
      if (coordinator.alias === alias) {
        setSelectedCoordinator(coordinator);
        setShowDetails(true);
      }
    });
  };

  const aliasObj = function (width: number, hide: boolean) {
    return {
      hide,
      field: 'alias',
      headerName: t('Coordinator'),
      width: width * fontSize,
      renderCell: (params: any) => {
        return (
          <ListItemButton
            style={{ cursor: 'pointer', position: 'relative', left: '-1.3em' }}
            onClick={() =>
              coordinators.map((coordinator) => {
                if (coordinator.alias === params.row.alias) {
                  setSelectedCoordinator(coordinator);
                  setShowDetails(true);
                }
              })
            }
          >
            <ListItemAvatar>
              <RobotAvatar
                nickname={params.row.alias}
                coordinator={true}
                style={{ width: '3.215em', height: '3.215em' }}
                smooth={true}
                flipHorizontally={true}
                baseUrl={baseUrl}
              />
            </ListItemAvatar>
            <ListItemText primary={params.row.alias} />
          </ListItemButton>
        );
      },
    };
  };

  const aliasSmallObj = function (width: number, hide: boolean) {
    return {
      hide,
      field: 'alias',
      headerName: t('Coordinator'),
      width: width * fontSize,
      renderCell: (params: any) => {
        return (
          <ListItemButton
            style={{ cursor: 'pointer', position: 'relative', left: '-1.64em' }}
            onClick={() =>
              coordinators.map((coordinator) => {
                if (coordinator.alias === params.row.alias) {
                  setSelectedCoordinator(coordinator);
                  setShowDetails(true);
                }
              })
            }
          >
            <ListItemAvatar>
              <RobotAvatar
                nickname={params.row.alias}
                coordinator={true}
                style={{ width: '3.215em', height: '3.215em' }}
                smooth={true}
                flipHorizontally={true}
                baseUrl={baseUrl}
              />
            </ListItemAvatar>
          </ListItemButton>
        );
      },
    };
  };

  const enabledObj = function (width: number, hide: boolean) {
    return {
      hide,
      field: 'enabled',
      headerName: t('Enabled'),
      width: width * fontSize,
      renderCell: (params: any) => {
        return (
          <Checkbox checked={params.row.enabled} onClick={() => onEnableChange(params.row.alias)} />
        );
      },
    };
  };

  const upObj = function (width: number, hide: boolean) {
    return {
      hide,
      field: 'color',
      headerName: t('Up'),
      width: width * fontSize,
      renderCell: (params: any) => {
        return (
          <div style={{ cursor: 'pointer' }} onClick={() => onClickCoordinator(params.row.alias)}>
            {params.row.info ? (
              <Check sx={{ color: params.row.color }} />
            ) : (
              <Close sx={{ color: 'text.disabled' }} />
            )}
          </div>
        );
      },
    };
  };

  const columnSpecs = {
    alias: {
      priority: 2,
      order: 1,
      normal: {
        width: 11,
        object: aliasObj,
      },
      small: {
        width: 4.1,
        object: aliasSmallObj,
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

  const filteredColumns = function () {
    const useSmall = maxWidth < 70;
    const selectedColumns: object[] = [];
    let width: number = 0;

    for (const [key, value] of Object.entries(columnSpecs)) {
      const colWidth = useSmall && value.small ? value.small?.width : value.normal.width;
      const colObject = useSmall && value.small ? value.small?.object : value.normal.object;

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

    return [columns, width * 0.9];
  };

  const [columns, width] = filteredColumns();

  const onEnableChange = function (alias: string) {
    const newCoordinators = coordinators.map((coordinator) => {
      if (coordinator.alias === alias) {
        return { ...coordinator, enabled: !coordinator.enabled };
      }
      return coordinator;
    });
    setCoordinators(newCoordinators);
  };

  return (
    <Box
      sx={
        fillContainer
          ? { width: '100%', height: '100%' }
          : { width: `${width}em`, height: `${height}em`, overflow: 'auto' }
      }
    >
      <CoordinatorSummaryDialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        coordinator={selectedCoordinator}
        baseUrl={baseUrl}
      />

      <DataGrid
        localeText={localeText}
        rowHeight={3.714 * theme.typography.fontSize}
        headerHeight={3.25 * theme.typography.fontSize}
        rows={coordinators}
        getRowId={(params: any) => params.alias}
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
