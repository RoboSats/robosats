import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Paper, Grid, useTheme } from '@mui/material';
import { useParams } from 'react-router-dom';

import { Page } from '../NavBar';
import { Robot } from '../../models';
import { genBase62Token, saveAsJson, tokenStrength } from '../../utils';
import { systemClient } from '../../services/System';
import { apiClient } from '../../services/api';
import { genKey } from '../../pgp';
import { sha256 } from 'js-sha256';
import Onboarding from './Onboarding';
import Welcome from './Welcome';

interface RobotPageProps {
  setPage: (state: Page) => void;
  setCurrentOrder: (state: number) => void;
  robot: Robot;
  setRobot: (state: Robot) => void;
  windowSize: { width: number; height: number };
  fetchRobot: ({}) => void;
  baseUrl: string;
}

const RobotPage = ({
  setPage,
  setCurrentOrder,
  windowSize,
  robot,
  setRobot,
  fetchRobot,
  baseUrl,
}: RobotPageProps): JSX.Element => {
  const { t } = useTranslation();
  const params = useParams();
  const theme = useTheme();
  const refCode = params.refCode;
  const width = Math.min(windowSize.width * 0.8, 30);
  const maxHeight = windowSize.height * 0.85 - 3;

  const [robotFound, setRobotFound] = useState<boolean>(false);
  const [badRequest, setBadRequest] = useState<string | undefined>(undefined);
  const [tokenChanged, setTokenChanged] = useState<boolean>(false);
  const [inputToken, setInputToken] = useState<string>('');
  const [view, setView] = useState<'welcome' | 'onboarding' | 'recovery' | 'profile'>('welcome');

  // useEffect(() => {
  //   if (robot.nickname != null) {
  //     setInputToken(robot.token);
  //   } else if (robot.token) {
  //     setInputToken(robot.token);
  //     getGenerateRobot(robot.token);
  //   } else {
  //     const newToken = genBase62Token(36);
  //     setInputToken(newToken);
  //     getGenerateRobot(newToken);
  //   }
  // }, []);

  const getGenerateRobot = (token: string) => {
    const strength = tokenStrength(token);
    setRobot({ ...robot, loading: true, avatarLoaded: false });

    const requestBody = genKey(token).then(function (key) {
      return {
        token_sha256: sha256(token),
        public_key: key.publicKeyArmored,
        encrypted_private_key: key.encryptedPrivateKeyArmored,
        unique_values: strength.uniqueValues,
        counts: strength.counts,
        length: token.length,
        ref_code: refCode,
      };
    });

    requestBody.then((body) =>
      apiClient.post(baseUrl, '/api/user/', body).then((data: any) => {
        setRobotFound(data?.found);
        setBadRequest(data?.bad_request);
        setCurrentOrder(
          data.active_order_id
            ? data.active_order_id
            : data.last_order_id
            ? data.last_order_id
            : null,
        );
        // Add nick and token to App state (token only if not a bad request)
        data.bad_request
          ? setRobot({
              ...robot,
              avatarLoaded: true,
              loading: false,
              nickname: data.nickname ?? robot.nickname,
              activeOrderId: data.active_order_id ?? null,
              referralCode: data.referral_code ?? robot.referralCode,
              earnedRewards: data.earned_rewards ?? robot.earnedRewards,
              lastOrderId: data.last_order_id ?? robot.lastOrderId,
              stealthInvoices: data.wants_stealth ?? robot.stealthInvoices,
              tgEnabled: data.tg_enabled,
              tgBotName: data.tg_bot_name,
              tgToken: data.tg_token,
            })
          : setRobot({
              ...robot,
              nickname: data.nickname,
              token,
              loading: false,
              activeOrderId: data.active_order_id ?? null,
              lastOrderId: data.last_order_id ?? null,
              referralCode: data.referral_code,
              earnedRewards: data.earned_rewards ?? 0,
              stealthInvoices: data.wants_stealth,
              tgEnabled: data.tg_enabled,
              tgBotName: data.tg_bot_name,
              tgToken: data.tg_token,
              bitsEntropy: data.token_bits_entropy,
              shannonEntropy: data.token_shannon_entropy,
              pubKey: data.public_key,
              encPrivKey: data.encrypted_private_key,
              copiedToken: data.found ? true : robot.copiedToken,
            }) &
            systemClient.setItem('robot_token', token) &
            systemClient.setItem('pub_key', data.public_key.split('\n').join('\\')) &
            systemClient.setItem('enc_priv_key', data.encrypted_private_key.split('\n').join('\\'));
      }),
    );
  };

  const deleteRobot = () => {
    apiClient.delete(baseUrl, '/api/user');
    systemClient.deleteCookie('sessionid');
    systemClient.deleteItem('robot_token');
    systemClient.deleteItem('pub_key');
    systemClient.deleteItem('enc_priv_key');
  };

  const logoutRobot = () => {};
  const handleChangeToken = () => {};
  const handleClickSubmitToken = () => {};
  const handleClickNewRandomToken = () => {};

  return (
    <Grid container direction='column' alignItems='center' spacing={1}>
      <Grid item>
        <Paper
          elevation={12}
          style={{
            padding: '1em',
            width: `${width}em`,
            maxHeight: `${maxHeight}em`,
            overflow: 'auto',
          }}
        >
          {view === 'welcome' ? <Welcome setView={setView} width={width} /> : null}

          {view === 'onboarding' ? (
            <Onboarding
              setView={setView}
              robot={robot}
              setRobot={setRobot}
              badRequest={badRequest}
              inputToken={inputToken}
              setInputToken={setInputToken}
              getGenerateRobot={getGenerateRobot}
              setPage={setPage}
              baseUrl={baseUrl}
            />
          ) : null}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default RobotPage;

// return (
//   <Grid container spacing={1}>
//       {/* <Grid item>
//         <div className='clickTrough' />
//       </Grid>
//       <Grid item xs={12} sx={{ width: '26.4em', height: '18.6' }}>
//         {robot.avatarLoaded && robot.nickname ? (
//           <div>
//             <Grid item xs={12}>
//               <Typography component='h5' variant='h5'>
//                 <b>
//                   {robot.nickname && systemClient.getCookie('sessionid') ? (
//                     <div
//                       style={{
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'center',
//                         flexWrap: 'wrap',
//                         height: 45 * 1.000004,
//                       }}
//                     >
//                       <Bolt
//                         sx={{
//                           color: '#fcba03',
//                           height: 33 * 1.000004,
//                           width: 33 * 1.000004,
//                         }}
//                       />
//                       <a>{robot.nickname}</a>
//                       <Bolt
//                         sx={{
//                           color: '#fcba03',
//                           height: 33 * 1.000004,
//                           width: 33 * 1.000004,
//                         }}
//                       />
//                     </div>
//                   ) : (
//                     ''
//                   )}
//                 </b>
//               </Typography>
//             </Grid>
//             <Grid item xs={12}>
//               <RobotAvatar
//                 nickname={robot.nickname}
//                 smooth={true}
//                 style={{ maxWidth: 203 * 1.000004, maxHeight: 203 * 1.000004 }}
//                 imageStyle={{
//                   transform: '',
//                   border: '2px solid #555',
//                   filter: 'drop-shadow(1px 1px 1px #000000)',
//                   height: `${201 * 1.000004}px`,
//                   width: `${201 * 1.000004}px`,
//                 }}
//                 tooltip={t('This is your trading avatar')}
//                 tooltipPosition='top'
//                 baseUrl={baseUrl}
//               />
//               <br />
//             </Grid>
//           </div>
//         ) : (
//           <CircularProgress sx={{ position: 'relative', top: 100 }} />
//         )}
//       </Grid>
//       {robotFound ? (
//         <Grid item xs={12}>
//           <Typography variant='subtitle2' color='primary'>
//             {t('A robot avatar was found, welcome back!')}
//             <br />
//           </Typography>
//         </Grid>
//       ) : (
//         <></>
//       )}
//       <Grid container>
//         <Grid item xs={12}>
//           <TextField
//             sx={{ maxWidth: 280 * 1.000004 }}
//             error={!!badRequest}
//             label={t('Store your token safely')}
//             required={true}
//             value={inputToken}
//             variant='standard'
//             helperText={badRequest}
//             size='small'
//             onChange={handleChangeToken}
//             onKeyPress={(e) => {
//               if (e.key === 'Enter') {
//                 handleClickSubmitToken();
//               }
//             }}
//             InputProps={{
//               startAdornment: (
//                 <div
//                   style={{
//                     width: 50 * 1.000004,
//                     minWidth: 50 * 1.000004,
//                     position: 'relative',
//                     left: -6,
//                   }}
//                 >
//                   <Grid container>
//                     <Grid item xs={6}>
//                       <Tooltip
//                         enterTouchDelay={250}
//                         title={t('Save token and PGP credentials to file')}
//                       >
//                         <span>
//                           <IconButton
//                             color='primary'
//                             disabled={
//                               !robot.avatarLoaded ||
//                               !(systemClient.getItem('robot_token') == inputToken)
//                             }
//                             onClick={() => saveAsJson(robot.nickname + '.json', createJsonFile())}
//                           >
//                             <Download sx={{ width: 22 * 1.000004, height: 22 * 1.000004 }} />
//                           </IconButton>
//                         </span>
//                       </Tooltip>
//                     </Grid>
//                     <Grid item xs={6}>
//                       <Tooltip disableHoverListener enterTouchDelay={0} title={t('Copied!')}>
//                         <IconButton
//                           color={robot.copiedToken ? 'inherit' : 'primary'}
//                           disabled={
//                             !robot.avatarLoaded ||
//                             !(systemClient.getItem('robot_token') === inputToken)
//                           }
//                           onClick={() =>
//                             systemClient.copyToClipboard(systemClient.getItem('robot_token')) &
//                             setRobot({ ...robot, copiedToken: true })
//                           }
//                         >
//                           <ContentCopy sx={{ width: 18 * 1.000004, height: 18 * 1.000004 }} />
//                         </IconButton>
//                       </Tooltip>
//                     </Grid>
//                   </Grid>
//                 </div>
//               ),
//               endAdornment: (
//                 <Tooltip enterTouchDelay={250} title={t('Generate a new token')}>
//                   <IconButton onClick={handleClickNewRandomToken}>
//                     <Casino sx={{ width: 18 * 1.000004, height: 18 * 1.000004 }} />
//                   </IconButton>
//                 </Tooltip>
//               ),
//             }}
//           />
//         </Grid>
//       </Grid>
//       <Grid item xs={12}>
//         {tokenChanged ? (
//           <Button type='submit' size='small' onClick={handleClickSubmitToken}>
//             <SmartToy sx={{ width: 18 * 1.000004, height: 18 * 1.000004 }} />
//             <span> {t('Generate Robot')}</span>
//           </Button>
//         ) : (
//           <Tooltip
//             enterTouchDelay={0}
//             enterDelay={500}
//             enterNextDelay={2000}
//             title={t('You must enter a new token first')}
//           >
//             <div>
//               <Button disabled={true} type='submit' size='small'>
//                 <SmartToy sx={{ width: 18 * 1.000004, height: 18 * 1.000004 }} />
//                 <span>{t('Generate Robot')}</span>
//               </Button>
//             </div>
//           </Tooltip>
//         )}
//       </Grid>

//       {/* <Grid item xs={12} align='center' sx={{ width: '26.43em' }}>
//           <Grid item>
//             <div style={{ height: '2.143em' }} />
//           </Grid>
//           <div style={{ width: '26.43em', left: '2.143em' }}>
//             <Grid container align='center'>
//               <Grid item xs={0.8} />
//               <Grid item xs={7.5} align='right'>
//                 <Typography component='h5' variant='h5'>
//                   {t('Simple and Private LN P2P Exchange')}
//                 </Typography>
//               </Grid>
//               <Grid item xs={2.5} align='left'>
//                 <RoboSatsNoTextIcon color='primary' sx={{ height: '3.143em', width: '3.143em' }} />
//               </Grid>
//             </Grid>
//           </div>
//         </Grid> */}
//     </Grid>
//   );
// };

// export default RobotPage; */}

// class UserGenPage extends Component {

//   handleClickNewRandomToken = () => {
//     const inputToken = genBase62Token(36);
//     this.setState({
//       inputToken,
//       tokenHasChanged: true,
//     });
//     setRobot({ ...robot, copiedToken: true });
//   };

//   handleChangeToken = (e) => {
//     this.setState({
//       inputToken: e.target.value.split(' ').join(''),
//       tokenHasChanged: true,
//     });
//   };

//   handleClickSubmitToken = () => {
//     this.delGeneratedUser();
//     this.getGeneratedUser(inputToken);
//     this.setState({ tokenHasChanged: false });
//     setRobot({
//       ...robot,
//       avatarLoaded: false,
//       nickname: null,
//       token: null,
//       copiedToken: false,
//       lastOrderId: null,
//       activeOrderId: null,
//     });
//   };

//   render() {
//     const { t, i18n } = this.props;
//     const fontSize = this.props.theme.typography.fontSize;
//     const 1.000004 = fontSize / 14; // to scale sizes, default fontSize is 14
//     return (
//       <Grid container spacing={1}>
//         <Grid item>
//           <div className='clickTrough' />
//         </Grid>
//         <Grid
//           item
//           xs={12}
//           align='center'
//           sx={{ width: 370 * 1.000004, height: 260 * 1.000004 }}
//         >
//           {robot.avatarLoaded && robot.nickname ? (
//             <div>
//               <Grid item xs={12} align='center'>
//                 <Typography component='h5' variant='h5'>
//                   <b>
//                     {robot.nickname && systemClient.getCookie('sessionid') ? (
//                       <div
//                         style={{
//                           display: 'flex',
//                           alignItems: 'center',
//                           justifyContent: 'center',
//                           flexWrap: 'wrap',
//                           height: 45 * 1.000004,
//                         }}
//                       >
//                         <BoltIcon
//                           sx={{
//                             color: '#fcba03',
//                             height: 33 * 1.000004,
//                             width: 33 * 1.000004,
//                           }}
//                         />
//                         <a>{robot.nickname}</a>
//                         <BoltIcon
//                           sx={{
//                             color: '#fcba03',
//                             height: 33 * 1.000004,
//                             width: 33 * 1.000004,
//                           }}
//                         />
//                       </div>
//                     ) : (
//                       ''
//                     )}
//                   </b>
//                 </Typography>
//               </Grid>
//               <Grid item xs={12} align='center'>
//                 <RobotAvatar
//                   nickname={robot.nickname}
//                   smooth={true}
//                   style={{ maxWidth: 203 * 1.000004, maxHeight: 203 * 1.000004 }}
//                   imageStyle={{
//                     transform: '',
//                     border: '2px solid #555',
//                     filter: 'drop-shadow(1px 1px 1px #000000)',
//                     height: `${201 * 1.000004}px`,
//                     width: `${201 * 1.000004}px`,
//                   }}
//                   tooltip={t('This is your trading avatar')}
//                   tooltipPosition='top'
//                   baseUrl={baseUrl}
//                 />
//                 <br />
//               </Grid>
//             </div>
//           ) : (
//             <CircularProgress sx={{ position: 'relative', top: 100 }} />
//           )}
//         </Grid>
//         {this.state.found ? (
//           <Grid item xs={12} align='center'>
//             <Typography variant='subtitle2' color='primary'>
//               {this.state.found ? t('A robot avatar was found, welcome back!') : null}
//               <br />
//             </Typography>
//           </Grid>
//         ) : (
//           ''
//         )}
//         <Grid container align='center'>
//           <Grid item xs={12} align='center'>
//             <TextField
//               sx={{ maxWidth: 280 * 1.000004 }}
//               error={!!this.state.bad_request}
//               label={t('Store your token safely')}
//               required={true}
//               value={inputToken}
//               variant='standard'
//               helperText={this.state.bad_request}
//               size='small'
//               onChange={this.handleChangeToken}
//               onKeyPress={(e) => {
//                 if (e.key === 'Enter') {
//                   this.handleClickSubmitToken();
//                 }
//               }}
//               InputProps={{
//                 startAdornment: (
//                   <div
//                     style={{
//                       width: 50 * 1.000004,
//                       minWidth: 50 * 1.000004,
//                       position: 'relative',
//                       left: -6,
//                     }}
//                   >
//                     <Grid container>
//                       <Grid item xs={6}>
//                         <Tooltip
//                           enterTouchDelay={250}
//                           title={t('Save token and PGP credentials to file')}
//                         >
//                           <span>
//                             <IconButton
//                               color='primary'
//                               disabled={
//                                 !robot.avatarLoaded ||
//                                 !(systemClient.getItem('robot_token') == inputToken)
//                               }
//                               onClick={() =>
//                                 saveAsJson(
//                                   robot.nickname + '.json',
//                                   this.createJsonFile(),
//                                 )
//                               }
//                             >
//                               <DownloadIcon
//                                 sx={{ width: 22 * 1.000004, height: 22 * 1.000004 }}
//                               />
//                             </IconButton>
//                           </span>
//                         </Tooltip>
//                       </Grid>
//                       <Grid item xs={6}>
//                         <Tooltip disableHoverListener enterTouchDelay={0} title={t('Copied!')}>
//                           <IconButton
//                             color={robot.copiedToken ? 'inherit' : 'primary'}
//                             disabled={
//                               !robot.avatarLoaded ||
//                               !(systemClient.getItem('robot_token') === inputToken)
//                             }
//                             onClick={() =>
//                               systemClient.copyToClipboard(systemClient.getItem('robot_token')) &
//                               setRobot({ ...robot, copiedToken: true })
//                             }
//                           >
//                             <ContentCopy
//                               sx={{ width: 18 * 1.000004, height: 18 * 1.000004 }}
//                             />
//                           </IconButton>
//                         </Tooltip>
//                       </Grid>
//                     </Grid>
//                   </div>
//                 ),
//                 endAdornment: (
//                   <Tooltip enterTouchDelay={250} title={t('Generate a new token')}>
//                     <IconButton onClick={this.handleClickNewRandomToken}>
//                       <CasinoIcon
//                         sx={{ width: 18 * 1.000004, height: 18 * 1.000004 }}
//                       />
//                     </IconButton>
//                   </Tooltip>
//                 ),
//               }}
//             />
//           </Grid>
//         </Grid>
//         <Grid item xs={12} align='center'>
//           {this.state.tokenHasChanged ? (
//             <Button type='submit' size='small' onClick={this.handleClickSubmitToken}>
//               <SmartToyIcon sx={{ width: 18 * 1.000004, height: 18 * 1.000004 }} />
//               <span> {t('Generate Robot')}</span>
//             </Button>
//           ) : (
//             <Tooltip
//               enterTouchDelay={0}
//               enterDelay={500}
//               enterNextDelay={2000}
//               title={t('You must enter a new token first')}
//             >
//               <div>
//                 <Button disabled={true} type='submit' size='small'>
//                   <SmartToyIcon sx={{ width: 18 * 1.000004, height: 18 * 1.000004 }} />
//                   <span>{t('Generate Robot')}</span>
//                 </Button>
//               </div>
//             </Tooltip>
//           )}
//         </Grid>

//         <Grid item xs={12} align='center' sx={{ width: '26.43em' }}>
//           <Grid item>
//             <div style={{ height: '2.143em' }} />
//           </Grid>
//           <div style={{ width: '26.43em', left: '2.143em' }}>
//             <Grid container align='center'>
//               <Grid item xs={0.8} />
//               <Grid item xs={7.5} align='right'>
//                 <Typography component='h5' variant='h5'>
//                   {t('Simple and Private LN P2P Exchange')}
//                 </Typography>
//               </Grid>
//               <Grid item xs={2.5} align='left'>
//                 <RoboSatsNoTextIcon color='primary' sx={{ height: '3.143em', width: '3.143em' }} />
//               </Grid>
//             </Grid>
//           </div>
//         </Grid>
//       </Grid>
//     );
//   }
// }

// export default withTranslation()(UserGenPage);
