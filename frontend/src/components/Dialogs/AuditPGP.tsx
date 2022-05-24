import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogTitle,
  Tooltip, 
  IconButton,
  TextField,
  DialogActions,  
  DialogContent,
  DialogContentText,
  Button, 
  Grid,
  Link,
} from "@mui/material"

import { saveAsJson, saveAsTxt } from "../../utils/saveFile";

// Icons
import KeyIcon from '@mui/icons-material/Key';
import ContentCopy from "@mui/icons-material/ContentCopy";
import ForumIcon from '@mui/icons-material/Forum';
import { ExportIcon } from '../Icons';

type Props = {
  open: boolean;
  onClose: () => void;
  orderId: number;
  messages: array;
  own_pub_key: string; 
  own_enc_priv_key: string;
  peer_pub_key: string;
  passphrase: string;
  onClickBack: () => void;
}

const AuditPGPDialog = ({
  open, 
  onClose,
  orderId,
  messages,
  own_pub_key,
  own_enc_priv_key,
  peer_pub_key,
  passphrase,
  onClickBack,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      >
      <DialogTitle >
        {t("This chat is PGP Encrypted")}
      </DialogTitle>

      <DialogContent>
        <DialogContentText>
          {t("Your communication is end-to-end encrypted with OpenPGP. You can verify the privacy of this chat using any third party tool based on the OpenPGP standard.")}
        </DialogContentText>
        <Grid container spacing={1} align="center">

          <Grid item align="center" xs={12}>
            <Button component={Link} target="_blank" href="https://learn.robosats.com/docs/pgp-encryption">{t("Learn how to audit")}</Button>
          </Grid>

          <Grid item align="center" xs={12}>
            <TextField
              sx={{width:"100%", maxWidth:"550px"}}
              disabled
              label={<b>{t("Your public key")}</b>}
              value={own_pub_key}
              variant='filled'
              size='small'
              InputProps={{
                endAdornment:
                  <Tooltip disableHoverListener enterTouchDelay={0} title={t("Copied!")}>
                    <IconButton onClick={()=> navigator.clipboard.writeText(own_pub_key)}>
                      <ContentCopy/>
                    </IconButton>
                  </Tooltip>,
                }}
              />
          </Grid>

          <Grid item align="center" xs={12}>
            <TextField
              sx={{width:"100%", maxWidth:"550px"}}
              disabled
              label={<b>{t("Peer public key")}</b>}
              value={peer_pub_key}
              variant='filled'
              size='small'
              InputProps={{
                endAdornment:
                  <Tooltip disableHoverListener enterTouchDelay={0} title={t("Copied!")}>
                    <IconButton onClick={()=> navigator.clipboard.writeText(peer_pub_key)}>
                      <ContentCopy/>
                    </IconButton>
                  </Tooltip>,
                }}
              />
          </Grid>

          <Grid item align="center" xs={12}>
            <TextField
              sx={{width:"100%", maxWidth:"550px"}}
              disabled
              label={<b>{t("Your encrypted private key")}</b>}
              value={own_enc_priv_key}
              variant='filled'
              size='small'
              InputProps={{
                endAdornment:
                  <Tooltip disableHoverListener enterTouchDelay={0} title={t("Copied!")}>
                    <IconButton onClick={()=> navigator.clipboard.writeText(own_enc_priv_key)}>
                      <ContentCopy/>
                    </IconButton>
                  </Tooltip>,
                }}
              />
          </Grid>

          <Grid item align="center" xs={12}>
            <TextField
              sx={{width:"100%", maxWidth:"550px"}}
              disabled
              label={<b>{t("Your private key passphrase (keep secure!)")}</b>}
              value={passphrase}
              variant='filled'
              size='small'
              InputProps={{
                endAdornment:
                  <Tooltip disableHoverListener enterTouchDelay={0} title={t("Copied!")}>
                    <IconButton onClick={()=> navigator.clipboard.writeText(passphrase)}>
                      <ContentCopy/>
                    </IconButton>
                  </Tooltip>,
                }}
              />
          </Grid>

            <br/>
            <Grid item xs={6}>
              <Button 
                size="small" 
                color="primary" 
                variant="contained" 
                onClick={()=>saveAsJson(
                    'keys_'+orderId+'.json', 
                    {"own_public_key": own_pub_key,
                      "peer_public_key":peer_pub_key,
                      "encrypted_private_key":own_enc_priv_key,
                      "passphrase":passphrase
                    })}>
                <div style={{width:26,height:18}}>
                  <ExportIcon sx={{width:18,height:18}}/>
                </div>
                {t("Keys")}
                <div style={{width:26,height:20}}>
                  <KeyIcon sx={{width:20,height:20}}/>
                </div>
              </Button>
            </Grid>
            
            <Grid item xs={6}>
              {/* <ToolTip placement="top" enterTouchDelay={0} enterDelay={1000} enterNextDelay={2000} title={t("Save local messages and credentials as a JSON file")}> */}
                <Button 
                  size="small" 
                  color="primary" 
                  variant="contained" 
                  onClick={()=>saveAsJson(
                    'messages_'+orderId+'.json',
                    messages)}>
                  <div style={{width:28,height:20}}>
                    <ExportIcon sx={{width:18,height:18}}/>
                  </div>
                  {t("Messages")}
                  <div style={{width:26,height:20}}>
                  <ForumIcon sx={{width:20,height:20}}/>
                  </div>
                </Button>
              {/* </ToolTip> */}

          </Grid>

        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClickBack} autoFocus>{t("Go back")}</Button>
      </DialogActions>

    </Dialog>
  )
}

export default AuditPGPDialog;
