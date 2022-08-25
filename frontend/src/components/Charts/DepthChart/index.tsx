import React, { useEffect, useState } from "react"
import { ResponsiveLine, Serie, Datum } from '@nivo/line'
import { Box, CircularProgress, Grid, IconButton } from "@mui/material"
import nivoScheme from "../nivoScheme"
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import { useTranslation } from "react-i18next";

interface DepthChartProps {
  bookLoading: boolean
  bookOrders: any[]
  lastDayPremium: number | undefined
}

const DepthChart: React.FC<DepthChartProps> = ({ bookLoading, bookOrders, lastDayPremium }) => {
  const { t } = useTranslation()
  const [series, setSeries] = useState<Serie[]>([])
  const [xRange, setXRange] = useState<number>(8)

  useEffect(() => {
    if (lastDayPremium && !bookLoading) { generateSeries()}
  }, [lastDayPremium, bookLoading, xRange])

  const calculateBtc = (order: any): number => {
    const amount = parseInt(order.amount || order.max_amount)
    return amount / order.price
  }

  const generateSeries:() => void = () => { 
    if (!lastDayPremium) { return }

    const sortedOrders: any[] = bookOrders.sort((order1, order2) => order1.premium - order2.premium)
    const sortedBuyOrders: any[] = sortedOrders.filter((order) => order.type == 0).reverse()
    const sortedSellOrders: any[] = sortedOrders.filter((order) => order.type == 1)

    const buySerie: Datum[] = generateSerie(sortedBuyOrders)
    const sellSerie: Datum[] = generateSerie(sortedSellOrders)

    const maxX: number = lastDayPremium + xRange
    const minX: number = lastDayPremium - xRange

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

  const generateSerie = (orders: any[]): Datum[] => {
    if (!lastDayPremium) { return [] }

    let sumOrders: number = 0
    let serie: Datum[] = []
    orders.forEach((order) => {
      const lastSumOrders = sumOrders
      sumOrders += calculateBtc(order)
      const datum: Datum[] = [
        { // Vertical Line
          x: order.premium, 
          y: lastSumOrders
        },
        {
        x: order.premium,
        y: sumOrders
        }
      ]

      serie = [...serie, ...datum]
    })
    const inlineSerie = serie.filter((datum: Datum) => { 
      return (Number(datum.x) > lastDayPremium - xRange) && 
             (Number(datum.x) < lastDayPremium + xRange)
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

  const formatAxisX = (value: number): string => `${value}%`
  const formatAxisY = (value: number): string => `${value}BTC`
  
  return bookLoading || !lastDayPremium ? (
    <div style={{display: "flex", justifyContent: "center", paddingTop: 200, height: 420 }}>
      <CircularProgress />
    </div>
  ) : (
    <Grid container>
      <Grid container style= {{ width: "100%", display: "flex", justifyContent: "center", paddingTop: 15 }}>
        <Grid item>
          <IconButton onClick={() => setXRange(xRange - 0.5)} disabled={xRange < 1}>
            <RemoveCircleOutline />
          </IconButton>
        </Grid>
        <Grid item>
          <Box justifyContent="center">
            {`${lastDayPremium}%` || '-'}
            <br/>
            {t("24h Avg Premium")}
          </Box>
        </Grid>
        <Grid item>
          <IconButton onClick={() => setXRange(xRange + 0.5)}>
            <AddCircleOutline />
          </IconButton>
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
          tooltip={() => <></>}
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
            min: lastDayPremium - xRange,
            max: lastDayPremium + xRange
          }}
        />
      </Grid>
    </Grid>
  )
}

export default DepthChart
