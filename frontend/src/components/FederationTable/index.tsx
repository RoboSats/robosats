import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  useTheme,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Coordinator } from '../../models';

import RobotAvatar from '../RobotAvatar';
import { Check, Close } from '@mui/icons-material';

interface FederationTableProps {
  federation: Coordinator[];
  setFederation: (state: Coordinator[]) => void;
  setFocusedCoordinator: (state: number) => void;
  openCoordinator: () => void;
  maxWidth?: number;
  maxHeight?: number;
  fillContainer?: boolean;
  baseUrl: string;
}

const FederationTable = ({
  federation,
  setFederation,
  setFocusedCoordinator,
  openCoordinator,
  maxWidth = 90,
  maxHeight = 50,
  fillContainer = false,
  baseUrl,
}: FederationTableProps): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [pageSize, setPageSize] = useState<number>(0);

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
    federation.map((coordinator, index) => {
      if (coordinator.alias === alias) {
        setFocusedCoordinator(index);
        openCoordinator();
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
            onClick={() => onClickCoordinator(params.row.alias)}
          >
            <ListItemAvatar>
              <RobotAvatar
                nickname={params.row.shortalias}
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
            onClick={() => onClickCoordinator(params.row.alias)}
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
      field: 'up',
      headerName: t('Up'),
      width: width * fontSize,
      renderCell: (params: any) => {
        return (
          <div style={{ cursor: 'pointer' }} onClick={() => onClickCoordinator(params.row.alias)}>
            {params.row.loadingInfo ? (
              <CircularProgress thickness={0.35 * fontSize} size={2 * fontSize} />
            ) : params.row.info ? (
              <Check color='success' />
            ) : (
              <Close color='error' />
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
        width: 12.1,
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
    const newFederation = federation.map((coordinator) => {
      if (coordinator.alias === alias) {
        return { ...coordinator, enabled: !coordinator.enabled };
      }
      return coordinator;
    });
    setFederation(newFederation);
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
        localeText={localeText}
        rowHeight={3.714 * theme.typography.fontSize}
        headerHeight={3.25 * theme.typography.fontSize}
        rows={federation}
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
