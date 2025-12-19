declare module "react-apexcharts" {
  import { Component } from "react";
  import { ApexOptions } from "apexcharts";

  interface Props {
    options: ApexOptions;
    series: any;
    type: string;
    height?: number | string;
    width?: number | string;
  }

  export default class ReactApexChart extends Component<Props> {}
}

