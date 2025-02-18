// Temporary fix for regression for hidden column labels on Mobile:
// https://github.com/mui/mui-x/issues/9776#issuecomment-1648306844
const headerStyleFix = {
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
};

export default headerStyleFix;
