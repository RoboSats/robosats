import React, { useEffect, useState } from "react"
import { ResponsiveLine, Serie, Datum, SliceTooltip, SliceTooltipProps, PointTooltipProps, PointMouseHandler, Point } from '@nivo/line'
import { Avatar, Box, CircularProgress, Grid, IconButton, MenuItem, Paper, Select } from "@mui/material"
import nivoScheme from "../nivoScheme"
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import { useTranslation } from "react-i18next";
import { Order } from "../../../models/Order.model";
import { LimitList } from "../../../models/Limit.model";
import RobotAvatar from '../../Robots/RobotAvatar'
import { amountToString } from "../../../utils/prettyNumbers";
import currencyDict from '../../../../static/assets/currencies.json';
import PaymentText from "../../PaymentText";
import { useHistory } from "react-router-dom"

interface DepthChartProps {
  bookLoading: boolean
  orders: Order[]
  lastDayPremium: number | undefined
  currency: number
}

const DepthChart: React.FC<DepthChartProps> = ({ bookLoading, orders, lastDayPremium, currency }) => {
  const { t } = useTranslation()
  const history = useHistory()
  const [series, setSeries] = useState<Serie[]>([])
  const [xRange, setXRange] = useState<number>(8)
  const [xType, setXType] = useState<string>("premium")
  const [currencyCode, setCurrencyCode] = useState<number>(1)
  const [center, setCenter] = useState<number>(0)
  const [limits, setLimits] = useState<LimitList>()

  useEffect(() => {
    fetch('/api/limits/')
      .then((response) => response.json())
      .then(setLimits)
  }, [])

  useEffect(() => {
    setCurrencyCode(currency === 0 ? 1 : currency)
  }, [currency])

  useEffect(() => {
    if (center && !bookLoading && (xType === 'premium' || limits)) { 
      generateSeries()
    }
  }, [bookLoading, limits, xRange, center])

  useEffect(() => {
    if (xType === 'amount' && limits) { 
      setXRange(1000)
      setCenter(limits[currencyCode].price)
    } else if (lastDayPremium) {
      setXRange(8)
      setCenter(lastDayPremium)
    }
  }, [xType, lastDayPremium, currencyCode])

  const calculateBtc = (order: Order): number => {
    const amount = parseInt(order.amount) || order.max_amount
    return amount / order.price
  }

  const enrichedOrders = (): Order[] => {
    if (!limits) { return [] }
    
    return orders.map((order) => {
      // We need to transform all currencies to the same base (ex. USD), we don't have the exchange rate
      // for EUR -> USD, but we know the rate of both to BTC, so we get advantage of it and apply a
      // simple rule of three
      order.base_price = (order.price * limits[currencyCode].price) / limits[order.currency].price
      return order
    })
  }

  const generateSeries:() => void = () => {
    const sortedOrders: Order[] = xType === 'amount' ? 
      enrichedOrders().sort((order1, order2) =>  (order1?.base_price || 0) - (order2?.base_price || 0) )
      : orders.sort((order1, order2) =>  order1.premium - order2.premium )

    const sortedBuyOrders: Order[] = sortedOrders.filter((order) => order.type == 0).reverse()
    const sortedSellOrders: Order[] = sortedOrders.filter((order) => order.type == 1)

    const buySerie: Datum[] = generateSerie(sortedBuyOrders)
    const sellSerie: Datum[] = generateSerie(sortedSellOrders)

    const maxX: number = center + xRange
    const minX: number = center - xRange

    setSeries([
      {
        id: "buy",
        data: closeSerie(buySerie, maxX, minX)
      }, 
      {
        id: "sell",
        data: closeSerie(sellSerie, minX, maxX)
      }
    ])
  }

  const generateSerie = (orders: Order[]): Datum[] => {
    if (!center) { return [] }

    let sumOrders: number = 0
    let serie: Datum[] = []
    orders.forEach((order) => {
      const lastSumOrders = sumOrders
      sumOrders += calculateBtc(order)
      const datum: Datum[] = [
        { // Vertical Line
          x: xType === 'amount' ?  order.base_price : order.premium, 
          y: lastSumOrders,
          order: order
        },
        { // Order Point
          x: xType === 'amount' ?  order.base_price : order.premium,
          y: sumOrders,
          order: order
        }
      ]

      serie = [...serie, ...datum]
    })
    const inlineSerie = serie.filter((datum: Datum) => { 
      return (Number(datum.x) > center - xRange) && 
             (Number(datum.x) < center + xRange)
    })

    return inlineSerie
  }

  const closeSerie = (serie: Datum[], limitBottom: number, limitTop: number): Datum[] =>{
    if (serie.length == 0 || !lastDayPremium) { return [] }

    // If the bottom is not 0, exdens the horizontal bottom line
    if (serie[0].y !== 0) {
      const startingPoint: Datum = {
        x: limitBottom,
        y: serie[0].y
      }
      serie.unshift(startingPoint)
    }

    // exdens the horizontal top line
    const endingPoint: Datum = {
      x: limitTop,
      y: serie[serie.length - 1].y
    }

    return [...serie, endingPoint]
  }

  const formatAxisX = (value: number): string => {
    if (xType === 'amount') {
      return `${value} ${currencyDict[currencyCode]}`
    }

    return `${value}%`
  }
  const formatAxisY = (value: number): string => `${value}BTC`

  const rangeSteps = xType === 'amount' ? 200 : 0.5
  
  const generateTooltip: React.FunctionComponent<PointTooltipProps> = (pointTooltip: PointTooltipProps) => {
    const order: Order = pointTooltip.point.data.order
    return order ? (
      <Paper elevation={12} style={{ padding: 10, width: 250 }}>
        <Grid container justifyContent="space-between" xs={12}>
        <Grid
          xs={3}
          container
          direction="column"
          justifyContent="center"
          alignItems="flex-start"
        >
            <Box>
              <RobotAvatar order={order} />
            </Box>
          </Grid>
          <Grid 
            container 
            xs={8}
            direction="column"
            justifyContent="center"
            alignItems="flex-start"
          >
            <Box>
              {order.maker_nick}
            </Box>
            <Box>
              <Grid
                container
                direction="column"
                justifyContent="flex-start"
                alignItems="flex-start"
              >
                <Grid item xs={12}>
                  {amountToString(order.amount, order.has_range, order.min_amount, order.max_amount)}
                  {' '}
                  {currencyDict[order.currency]}
                </Grid>
                <Grid item xs={12}>
                  <PaymentText 
                    othersText={t("Others")} 
                    verbose={true} 
                    size={12} 
                    text={order.payment_method}
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    ) : <></>
  }

  const handleOnClick: PointMouseHandler = (point: Point) => {
    history.push('/order/' + point.data?.order?.id);
  }
  
  return bookLoading || !center || (xType === 'amount' && !limits) ? (
    <div style={{display: "flex", justifyContent: "center", paddingTop: 200, height: 420 }}>
      <CircularProgress />
    </div>
  ) : (
    <Grid container style={{ paddingTop: 15 }}>
      <Grid 
        container 
        direction="row"
        justifyContent="space-around"
        alignItems="flex-start"
        style={{ position: "absolute" }}
      >
        <Grid container xs={12} justifyContent="flex-start" alignItems="flex-start">
          <Grid item xs={2} alignItems="flex-start">
            <Select
              value={xType}
              onChange={(e) => setXType(e.target.value)}
            > 
              <MenuItem value={"premium"}>
                <div style={{display:'flex',alignItems:'center', flexWrap:'wrap'}}>
                  {t("Premium")}
                </div>
              </MenuItem>
              <MenuItem value={"amount"}>
                <div style={{display:'flex',alignItems:'center', flexWrap:'wrap'}}>
                  {t("Amount")}
                </div>
              </MenuItem>
            </Select>
          </Grid>
        </Grid>
      </Grid>
      <Grid 
        container 
        direction="row"
        justifyContent="center"
        alignItems="center"
      >
        <Grid container justifyContent="center" alignItems="center">
          <Grid item>
            <IconButton onClick={() => setXRange(xRange + rangeSteps)}>
              <RemoveCircleOutline />
            </IconButton>
          </Grid>
          <Grid item>
            <Box justifyContent="center">
              {formatAxisX(center)}
            </Box>
          </Grid>
          <Grid item>
            <IconButton onClick={() => setXRange(xRange - rangeSteps)} disabled={xRange <= 1}>
              <AddCircleOutline />
            </IconButton>
          </Grid>
        </Grid>
      </Grid>
      <Grid container style={{ height: 357, padding: 15 }}>
        <ResponsiveLine 
          data={series} 
          enableArea={true}
          enablePoints={false}
          enableGridX={false}
          enableGridY={false}
          useMesh={true}
          animate={false}
          crosshairType="cross"
          tooltip={generateTooltip}
          onClick={handleOnClick}
          axisRight={{
            tickSize: 5,
            format: formatAxisY
          }}
          axisLeft={{
            tickSize: 5,
            format: formatAxisY
          }}
          axisBottom={{
            tickSize: 5,
            format: formatAxisX
          }}
          margin={{ left: 65, right: 60, bottom: 25, top: 10 }}
          xFormat={(value) => Number(value).toFixed(0)}
          lineWidth={3}
          theme={nivoScheme}
          colors={['rgb(136, 252, 102)', 'rgb(255, 108, 57)']}
          xScale={{
            type: 'linear',
            min: center - xRange,
            max: center + xRange
          }}
        />
      </Grid>
    </Grid>
  )
}

export default DepthChart
