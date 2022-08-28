import React, { useEffect, useState } from "react"
import { ResponsiveLine, Serie, Datum, PointTooltipProps, PointMouseHandler, Point, CustomLayer } from '@nivo/line'
import { Box, CircularProgress, Grid, IconButton, MenuItem, Paper, Select, useTheme } from "@mui/material"
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom"
import { Order } from "../../../models/Order.model";
import { LimitList } from "../../../models/Limit.model";
import RobotAvatar from '../../Robots/RobotAvatar'
import { amountToString } from "../../../utils/prettyNumbers";
import currencyDict from '../../../../static/assets/currencies.json';
import PaymentText from "../../PaymentText";
import getNivoScheme from "../NivoScheme"
import median from "../../../utils/match";

interface DepthChartProps {
  bookLoading: boolean
  orders: Order[]
  lastDayPremium: number | undefined
  currency: number
  setAppState: (state: object) => void
  limits: LimitList
  compact?: boolean
}

const DepthChart: React.FC<DepthChartProps> = ({ 
  bookLoading, orders, lastDayPremium, currency, setAppState, limits, compact
}) => {
  const { t } = useTranslation()
  const history = useHistory()
  const theme = useTheme()
  const [enrichedOrders, setEnrichedOrders] = useState<Order[]>([])
  const [series, setSeries] = useState<Serie[]>([])
  const [xRange, setXRange] = useState<number>(8)
  const [xType, setXType] = useState<string>("premium")
  const [currencyCode, setCurrencyCode] = useState<number>(1)
  const [center, setCenter] = useState<number>(0)

  useEffect(() => {
    if (Object.keys(limits).length === 0) {
      fetch('/api/limits/')
        .then((response) => response.json())
        .then((data) => {
          setAppState({ limits: data })
        })
    }
  }, [])
    

  useEffect(() => {
    setCurrencyCode(currency === 0 ? 1 : currency)
  }, [currency])

  useEffect(() => {
    if (Object.keys(limits).length > 0) {
      const enriched = orders.map((order) => {
        // We need to transform all currencies to the same base (ex. USD), we don't have the exchange rate
        // for EUR -> USD, but we know the rate of both to BTC, so we get advantage of it and apply a
        // simple rule of three
        order.base_amount = (order.price * limits[currencyCode].price) / limits[order.currency].price
        return order
      })
      setEnrichedOrders(enriched)
    }
  }, [limits, orders, currencyCode])

  useEffect(() => {
    if (enrichedOrders.length > 0) { 
      generateSeries()
    }
  }, [enrichedOrders, xRange])

  useEffect(() => {
    if (xType === 'base_amount') { 
      const prices: number[] = enrichedOrders.map((order) => order?.base_amount || 0)
      setCenter(~~median(prices))
      setXRange(1500)
    } else if (lastDayPremium) {
      setCenter(lastDayPremium)
      setXRange(8)
    }
  }, [enrichedOrders, xType, lastDayPremium, currencyCode])

  const calculateBtc = (order: Order): number => {
    const amount = parseInt(order.amount) || order.max_amount
    return amount / order.price
  }

  const generateSeries:() => void = () => {
    let sortedOrders: Order[] = xType === 'base_amount' ?
      enrichedOrders.sort((order1, order2) =>  (order1?.base_amount || 0) - (order2?.base_amount || 0) )
      : enrichedOrders.sort((order1, order2) =>  order1.premium - order2.premium )

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
          x: xType === 'base_amount' ?  order.base_amount : order.premium, 
          y: lastSumOrders
        },
        { // Order Point
          x: xType === 'base_amount' ?  order.base_amount : order.premium,
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
    if (serie.length == 0) { return [] }

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

  const centerLine: CustomLayer = (props) => (
    <path
      key="center-line"
      d={props.lineGenerator([
        {
          y: 0,
          x: props.xScale(center)
        },
        {
          y: props.innerHeight,
          x: props.xScale(center)
        },
      ])}
      fill="none"
      stroke={getNivoScheme(theme).markers?.lineColor}
      strokeWidth={getNivoScheme(theme).markers?.lineStrokeWidth}
    />
  )

  const generateTooltip: React.FunctionComponent<PointTooltipProps> = (pointTooltip: PointTooltipProps) => {
    const order: Order = pointTooltip.point.data.order
    return order ? (
      <Paper elevation={12} style={{ padding: 10, width: 250 }}>
        <Grid container justifyContent="space-between">
          <Grid item xs={3}>
            <Grid 
              container
              justifyContent="center"
              alignItems="center"
            >
              <RobotAvatar order={order} />
            </Grid>
          </Grid>
          <Grid item xs={8}>
            <Grid 
              container
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
                      size={20} 
                      text={order.payment_method}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    ) : <></>
  }

  const formatAxisX = (value: number): string => {
    if (xType === 'base_amount') {
      return value.toString()
    }
    return `${value}%`
  }
  const formatAxisY = (value: number): string => `${value}BTC`

  const rangeSteps = xType === 'base_amount' ? 200 : 0.5

  const handleOnClick: PointMouseHandler = (point: Point) => {
    history.push('/order/' + point.data?.order?.id);
  }
  
  return bookLoading || !center || enrichedOrders.length < 1 ? (
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
        <Grid container justifyContent="flex-start" alignItems="flex-start" style={{ paddingLeft: 20 }}>
          <Select
            value={xType}
            onChange={(e) => setXType(e.target.value)}
          > 
            <MenuItem value={"premium"}>
              <div style={{display:'flex',alignItems:'center', flexWrap:'wrap'}}>
                {t("Premium")}
              </div>
            </MenuItem>
            <MenuItem value={"base_amount"}>
              <div style={{display:'flex',alignItems:'center', flexWrap:'wrap'}}>
                {t("Price")}
              </div>
            </MenuItem>
          </Select>
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
              {xType === 'base_amount' ? `${center} ${currencyDict[currencyCode]}` : `${center}%`}
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
            tickRotation: xType === 'base_amount' && compact ? 45 : 0,
            format: formatAxisX
          }}
          margin={{ left: 65, right: 60, bottom: compact ? 36 : 25, top: 10 }}
          xFormat={(value) => Number(value).toFixed(0)}
          lineWidth={3}
          theme={getNivoScheme(theme)}
          colors={[theme.palette.secondary.main,theme.palette.primary.main]}
          xScale={{
            type: 'linear',
            min: center - xRange,
            max: center + xRange
          }}
          layers={['axes', 'areas', 'crosshair', 'lines', centerLine, 'slices', 'mesh']}
        />
      </Grid>
    </Grid>
  )
}

export default DepthChart
