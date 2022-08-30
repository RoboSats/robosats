import React from "react"
import { Badge, Tooltip } from "@mui/material";
import Image from 'material-ui-image'

import Order from "../../../models/Order.model"
import { useTranslation } from "react-i18next";
import { SendReceiveIcon } from "../../Icons";

interface DepthChartProps {
  order: Order
}

const RobotAvatar: React.FC<DepthChartProps> = ({ order }) => {
  const { t } = useTranslation()

  const avatarSrc: string = window.location.origin +'/static/assets/avatars/' + order?.maker_nick + '.png'

  const statusBadge = (
    <div style={{position:"relative", left:"6px", top:"1px"}}> 
    {order?.type === 0 ? 
      <SendReceiveIcon sx={{transform: "scaleX(-1)",height:"18px",width:"18px"}} color="secondary"/> :
      <SendReceiveIcon sx={{height:"20px",width:"20px"}} color="primary"/>}
    </div>
  )

  const statusBadgeColor = () => {
    if(!order){ return }
    if(order.maker_status ==='Active'){ return("success") }
    if(order.maker_status ==='Seen recently'){ return("warning") }
    if(order.maker_status ==='Inactive'){ return('error') }
  }

  return order ? (
    <Tooltip placement="right" enterTouchDelay={0} title={t(order.maker_status) || ""}>
      <Badge 
        variant="dot" 
        overlap="circular" 
        badgeContent="" 
        color={statusBadgeColor()}
      >
        <Badge 
          overlap="circular" 
          anchorOrigin={{horizontal: 'right', vertical: 'bottom'}} 
          badgeContent={statusBadge}
        >
          <div style={{ width: 45, height: 45 }}>
            <Image className='bookAvatar'
                disableError={true}
                disableSpinner={true}
                color='null'
                alt={order.maker_nick}
                src={avatarSrc}
            />
          </div>
        </Badge>
      </Badge>
    </Tooltip>
  ) : <></>
}

export default RobotAvatar
