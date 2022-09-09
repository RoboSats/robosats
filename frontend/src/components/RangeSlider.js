import { Slider } from "@mui/material"
import { styled } from '@mui/material/styles';

const RangeSlider = styled(Slider)(({ theme }) => ({
  color: 'primary',
  height: 3,
  padding: '13px 0',
  '& .MuiSlider-thumb': {
    height: `${27/16}em`,
    width: `${27/16}em`,
    backgroundColor: '#fff',
    border: '1px solid currentColor',
    '&:hover': {
      boxShadow: '0 0 0 8px rgba(58, 133, 137, 0.16)',
    },
    '& .range-bar': {
      height: `${9/16}em`,
      width: 1,
      backgroundColor: 'currentColor',
      marginLeft: 1,
      marginRight: 1,
    },
  },
  '& .MuiSlider-track': {
    height: `${3/16}em`,
  },
  '& .MuiSlider-rail': {
    color: theme.palette.mode === 'dark' ? '#bfbfbf' : '#d8d8d8',
    opacity: theme.palette.mode === 'dark' ? undefined : 1,
    height: `${3/16}em`,
  },
}));

export default RangeSlider;