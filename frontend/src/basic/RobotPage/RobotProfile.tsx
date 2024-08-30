import React, { useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  LinearProgress,
  Select,
  MenuItem,
  Box,
  TextField,
  SelectChangeEvent,
  useTheme,
  useMediaQuery,
  styled,
} from '@mui/material';
import { Bolt, Add, DeleteSweep, Logout, Download, FileCopy } from '@mui/icons-material';
import RobotAvatar from '../../components/RobotAvatar';
import { AppContext, UseAppStoreType } from '../../contexts/AppContext';
import { genBase62Token } from '../../utils';
import { GarageContext, UseGarageStoreType } from '../../contexts/GarageContext';
import { FederationContext, UseFederationStoreType } from '../../contexts/FederationContext';

const BUTTON_COLORS = {
  primary: '#2196f3',
  secondary: '#9c27b0',
  text: '#ffffff',
  hoverPrimary: '#4dabf5',
  hoverSecondary: '#af52bf',
  activePrimary: '#1976d2',
  activeSecondary: '#7b1fa2',
  deleteHover: '#ff6666',
};

const COLORS = {
  shadow: '#000000',
};

interface RobotProfileProps {
  inputToken: string;
  getGenerateRobot: (token: string) => void;
  setInputToken: (token: string) => void;
  logoutRobot: () => void;
  setView: (view: string) => void;
}

const RobotProfile = ({
  inputToken,
  getGenerateRobot,
  setInputToken,
  logoutRobot,
  setView,
}: RobotProfileProps): JSX.Element => {
  const { windowSize } = useContext<UseAppStoreType>(AppContext);
  const { garage, robotUpdatedAt, orderUpdatedAt } = useContext<UseGarageStoreType>(GarageContext);
  const { setCurrentOrderId } = useContext<UseFederationStoreType>(FederationContext);

  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const slot = garage.getSlot();
    if (slot?.hashId) {
      setLoading(false);
    }
  }, [orderUpdatedAt, robotUpdatedAt, loading]);

  const handleAddRobot = (): void => {
    getGenerateRobot(genBase62Token(36));
    setLoading(true);
  };

  const handleChangeSlot = (e: SelectChangeEvent<number | 'loading'>): void => {
    if (e?.target?.value) {
      garage.setCurrentSlot(e.target.value as string);
      setInputToken(garage.getSlot()?.token ?? '');
      setLoading(true);
    }
  };

  const slot = garage.getSlot();
  const robot = slot?.getRobot();

  const loadingCoordinators = Object.values(slot?.robots ?? {}).filter(
    (robot) => robot.loading,
  ).length;

  return (
    <ProfileContainer $isMobile={isMobile}>
      <InfoSection colors={COLORS} $isMobile={isMobile}>
        <NicknameTypography variant={isMobile ? "h6" : "h5"} align="center" $isMobile={isMobile}>
          <BoltIcon $isMobile={isMobile} />
          {slot?.nickname}
          <BoltIcon $isMobile={isMobile} />
        </NicknameTypography>
        <StyledRobotAvatar
          hashId={slot?.hashId}
          smooth={true}
          placeholderType='generating'
          style={{ width: isMobile ? '80px' : '120px', height: isMobile ? '80px' : '120px' }}
        />
        <StatusTypography variant={isMobile ? "body2" : "body1"} align="center" $isMobile={isMobile}>
          {loadingCoordinators > 0 && !robot?.activeOrderId ? t('Looking for orders!') : t('Ready to Trade')}
        </StatusTypography>
        {loadingCoordinators > 0 && !robot?.activeOrderId && <StyledLinearProgress $isMobile={isMobile} />}
        <TokenBox $isMobile={isMobile}>
          <CustomIconButton onClick={() => {
            logoutRobot();
            setView('welcome');
          }}>
            <StyledLogoutIcon $isMobile={isMobile} />
          </CustomIconButton>
          <StyledTextField 
            fullWidth
            value={inputToken}
            variant="standard"
            $isMobile={isMobile}
            InputProps={{
              readOnly: true,
              disableUnderline: true,
              endAdornment: (
                <CustomIconButton onClick={() => navigator.clipboard.writeText(inputToken)}>
                  <StyledFileCopyIcon $isMobile={isMobile} />
                </CustomIconButton>
              ),
            }}
          />
        </TokenBox>
      </InfoSection>
      
      <RightSection $isMobile={isMobile}>
        <TitleSection>
          <TitleTypography variant={isMobile ? "subtitle1" : "h6"} align="center">
            {t('Robot Garage')}
          </TitleTypography>
        </TitleSection>
        <StyledSelect
          value={loading ? 'loading' : garage.currentSlot}
          onChange={handleChangeSlot}
          $isMobile={isMobile}
        >
          {loading ? (
            <MenuItem key={'loading'} value={'loading'}>
              <Typography variant={isMobile ? "body2" : "body1"}>{t('Building...')}</Typography>
            </MenuItem>
          ) : (
            Object.values(garage.slots).map((slot: Slot, index: number) => (
              <StyledMenuItem key={index} value={slot.token} $isMobile={isMobile}>
                <MenuItemContent>
                  <StyledMenuItemAvatar
                    hashId={slot?.hashId}
                    smooth={true}
                    $isMobile={isMobile}
                    placeholderType='loading'
                    small={true}
                  />
                  <Typography variant={isMobile ? "body2" : "body1"}>{slot?.nickname}</Typography>
                </MenuItemContent>
              </StyledMenuItem>
            ))
          )}
        </StyledSelect>
        <ButtonContainer>
          <StyledButton
            $buttonColor={BUTTON_COLORS.primary}
            $hoverColor={BUTTON_COLORS.hoverPrimary}
            $textColor={BUTTON_COLORS.text}
            $isMobile={isMobile}
            onClick={handleAddRobot}
          >
            <StyledAddIcon $isMobile={isMobile} /> {t('ADD ROBOT')}
          </StyledButton>
          {window.NativeRobosats === undefined && (
            <StyledButton
              $buttonColor={BUTTON_COLORS.secondary}
              $hoverColor={BUTTON_COLORS.hoverSecondary}
              $textColor={BUTTON_COLORS.text}
              $isMobile={isMobile}
              onClick={() => garage.download()}
            >
              <StyledDownloadIcon $isMobile={isMobile} /> {t('DOWNLOAD')}
            </StyledButton>
          )}
          <StyledButton
            $buttonColor="transparent"
            $hoverColor={BUTTON_COLORS.deleteHover}
            $textColor="red"
            $isMobile={isMobile}
            onClick={() => {
              garage.delete();
              logoutRobot();
              setView('welcome');
            }}
          >
            <StyledDeleteSweepIcon $isMobile={isMobile} /> {t('DELETE GARAGE')}
          </StyledButton>
        </ButtonContainer>
      </RightSection>
    </ProfileContainer>
  );
};

// Styled components
const ProfileContainer = styled(Box)<{ $isMobile: boolean }>(({ theme, $isMobile }) => ({
  width: '100%',
  maxWidth: $isMobile ? '100%' : 1000,
  margin: '0 auto',
  display: 'flex',
  flexDirection: $isMobile ? 'column' : 'row',
  border: $isMobile ? '1px solid #000' : '2px solid #000',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: $isMobile ? '4px 4px 0px #000000' : '8px 8px 0px #000000',
}));

const InfoSection = styled(Box)<{ colors: typeof COLORS; $isMobile: boolean }>(({ theme, colors, $isMobile }) => ({
  flexGrow: 1,
  flexBasis: $isMobile ? 'auto' : 0,
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: $isMobile ? theme.spacing(2) : theme.spacing(4),
  borderBottom: $isMobile ? '1px solid #000' : 'none',
  borderRight: $isMobile ? 'none' : '2px solid #000',
}));

const NicknameTypography = styled(Typography)<{ $isMobile: boolean }>(({ $isMobile }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: $isMobile ? '8px' : '16px',
}));

const BoltIcon = styled(Bolt)<{ $isMobile: boolean }>(({ $isMobile }) => ({
  color: '#fcba03',
  height: $isMobile ? '0.8em' : '1em',
  width: $isMobile ? '0.8em' : '1em',
}));

const StyledRobotAvatar = styled(RobotAvatar)({
  '& img': {
    border: '2px solid #555',
    borderRadius: '50%',
  },
});

const StatusTypography = styled(Typography)<{ $isMobile: boolean }>(({ $isMobile }) => ({
  marginBottom: $isMobile ? '8px' : '16px',
}));

const StyledLinearProgress = styled(LinearProgress)<{ $isMobile: boolean }>(({ $isMobile }) => ({
  width: '100%',
  marginBottom: $isMobile ? '8px' : '16px',
}));

const TokenBox = styled(Box)<{ $isMobile: boolean }>(({ $isMobile }) => ({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  border: $isMobile ? '1px solid #000' : '2px solid #000',
  borderRadius: '4px',
}));

const StyledTextField = styled(TextField)<{ $isMobile: boolean }>(({ $isMobile }) => ({
  '& .MuiInputBase-root': { 
    height: $isMobile ? '36px' : '48px',
    padding: $isMobile ? '2px 4px' : '4px 8px',
    fontSize: $isMobile ? '0.8rem' : '1rem',
  }
}));

const RightSection = styled(Box)<{ $isMobile: boolean }>(({ $isMobile }) => ({
  flexGrow: 1,
  flexBasis: $isMobile ? 'auto' : 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

const TitleSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `2px solid #000`,
}));

const TitleTypography = styled(Typography)({
  fontWeight: 'bold',
});

const StyledSelect = styled(Select)<{ $isMobile: boolean }>(({ $isMobile }) => ({
  width: '100%',
  height: $isMobile ? '50px' : '80px',
  borderBottom: $isMobile ? '1px solid #000' : '2px solid #000',
  borderRadius: 0,
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
}));

const StyledMenuItem = styled(MenuItem)<{ $isMobile: boolean }>(({ $isMobile }) => ({
  height: $isMobile ? '50px' : '80px',
}));

const MenuItemContent = styled(Box)({
  display: 'flex',
  alignItems: 'center',
});

const StyledMenuItemAvatar = styled(RobotAvatar)<{ $isMobile: boolean }>(({ $isMobile }) => ({
  width: $isMobile ? '24px' : '30px',
  height: $isMobile ? '24px' : '30px',
  marginRight: '8px',
}));

const ButtonContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
});

const StyledButton = styled('button')<{
  $buttonColor: string;
  $hoverColor: string;
  $textColor: string;
  $isMobile: boolean;
}>(({ theme, $buttonColor, $hoverColor, $textColor, $isMobile }) => ({
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  padding: theme.spacing(2),
  border: 'none',
  borderRadius: 0,
  backgroundColor: $buttonColor,
  color: $textColor,
  cursor: 'pointer',
  display: 'flex',
  transition: 'background-color 0.3s ease, color 0.3s ease',
  width: '100%',
  height: $isMobile ? '40px' : '60px',
  borderBottom: $isMobile ? '1px solid #000' : '2px solid #000',
  '&:hover': {
    backgroundColor: $hoverColor,
    color: $buttonColor === 'transparent' ? '#fff' : $textColor,
  },
  '&:active': {
    backgroundColor: $buttonColor === BUTTON_COLORS.primary ? BUTTON_COLORS.activePrimary : BUTTON_COLORS.activeSecondary,
  },
  '&:focus': {
    outline: 'none',
  },
}));

const CustomIconButton = styled('button')({
  background: 'transparent',
  border: 'none',
  color: '#1976d2',
  padding: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 0.3s ease',
  '&:hover': {
    color: '#0d47a1',
  },
  '&:active': {
    color: '#002171',
  },
});

const StyledLogoutIcon = styled(Logout)<{ $isMobile: boolean }>(({ $isMobile }) => ({
  fontSize: $isMobile ? '1rem' : '1.5rem',
}));

const StyledFileCopyIcon = styled(FileCopy)<{ $isMobile: boolean }>(({ $isMobile }) => ({
  fontSize: $isMobile ? '1rem' : '1.5rem',
}));

const StyledAddIcon = styled(Add)<{ $isMobile: boolean }>(({ $isMobile }) => ({
  marginRight: '8px',
  fontSize: $isMobile ? '1rem' : '1.5rem',
}));

const StyledDownloadIcon = styled(Download)<{ $isMobile: boolean }>(({ $isMobile }) => ({
  marginRight: '8px',
  fontSize: $isMobile ? '1rem' : '1.5rem',
}));

const StyledDeleteSweepIcon = styled(DeleteSweep)<{ $isMobile: boolean }>(({ $isMobile }) => ({
  marginRight: '8px',
  fontSize: $isMobile ? '1rem' : '1.5rem',
}));

export default RobotProfile;