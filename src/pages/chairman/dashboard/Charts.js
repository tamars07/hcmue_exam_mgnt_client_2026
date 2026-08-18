import PropTypes from 'prop-types';
import ReactApexChart from 'react-apexcharts';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Typography } from '@mui/material';

// ==============================|| TỔNG QUAN - BIỂU ĐỒ (APEXCHARTS) ||============================== //

const DonutChart = ({ labels, series, colors, totalLabel = 'Tổng', height = 300 }) => {
  const theme = useTheme();
  const total = series.reduce((a, b) => a + b, 0);

  if (total === 0) {
    return (
      <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
        Không có dữ liệu.
      </Typography>
    );
  }

  const options = {
    chart: { type: 'donut', foreColor: theme.palette.text.secondary },
    labels,
    colors,
    stroke: { width: 2, colors: [theme.palette.background.paper] },
    legend: { position: 'bottom', labels: { colors: theme.palette.text.primary }, fontSize: '13px' },
    dataLabels: { enabled: true, formatter: (val) => `${val.toFixed(1)}%` },
    tooltip: { theme: theme.palette.mode, y: { formatter: (val) => `${val} thí sinh` } },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: { show: true, label: totalLabel, color: theme.palette.text.primary, formatter: () => total },
            value: { color: theme.palette.text.primary }
          }
        }
      }
    }
  };

  return <ReactApexChart options={options} series={series} type="donut" height={height} />;
};

DonutChart.propTypes = {
  labels: PropTypes.array.isRequired,
  series: PropTypes.array.isRequired,
  colors: PropTypes.array.isRequired,
  totalLabel: PropTypes.string,
  height: PropTypes.number
};

const YearBarChart = ({ categories, data, color, height = 300 }) => {
  const theme = useTheme();

  if (categories.length === 0) {
    return (
      <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
        Không có dữ liệu.
      </Typography>
    );
  }

  const options = {
    chart: { type: 'bar', toolbar: { show: false }, foreColor: theme.palette.text.secondary },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%', dataLabels: { position: 'top' } } },
    dataLabels: {
      enabled: true,
      offsetY: -20,
      style: { fontSize: '12px', colors: [theme.palette.text.primary] },
      background: { enabled: false }
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: theme.palette.text.secondary } }
    },
    yaxis: { labels: { formatter: (val) => Math.round(val) } },
    colors: [color || theme.palette.primary.main],
    grid: { borderColor: theme.palette.divider, strokeDashArray: 4 },
    tooltip: { theme: theme.palette.mode, y: { formatter: (val) => `${val} thí sinh` } }
  };

  return <ReactApexChart options={options} series={[{ name: 'Số thí sinh', data }]} type="bar" height={height} />;
};

YearBarChart.propTypes = {
  categories: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
  color: PropTypes.string,
  height: PropTypes.number
};

export { DonutChart, YearBarChart };
