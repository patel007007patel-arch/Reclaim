declare module "react-apexcharts" {
  import { ComponentType } from "react";
  import { ApexOptions } from "apexcharts";

  interface ReactApexChartProps {
    options: ApexOptions;
    series: any;
    type: string;
    height?: number | string;
    width?: number | string;
  }

  const ReactApexChart: ComponentType<ReactApexChartProps>;
  export default ReactApexChart;
}

