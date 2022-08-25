import { Theme } from "@nivo/core"

export const nivoScheme: Theme = {
  axis: {
    ticks: {
      text: {
        fill: "rgb(255, 255, 255)"
      },
      line: {
        strokeWidth: "1",
        stroke: "rgb(255, 255, 255)"
      }
    },
    domain: {
      line: {
        strokeWidth: "1",
        stroke: "rgb(255, 255, 255)"
      }
    }
  },
  crosshair: {
    line: {
      strokeWidth: 1,
      stroke: "rgb(255, 255, 255)"
    }
  }
}

export default nivoScheme