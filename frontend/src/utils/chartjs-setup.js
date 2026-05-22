import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";

Chart.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
);

Chart.defaults.font.family =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
Chart.defaults.font.size = 12;
Chart.defaults.color = "#4a4a4a";
Chart.defaults.plugins.legend.labels.boxWidth = 12;
Chart.defaults.plugins.legend.labels.boxHeight = 12;
Chart.defaults.plugins.tooltip.padding = 8;

// antd-aligned categorical palette. Reused by every chart so the dashboard
// reads as one piece instead of a colour soup.
export const PALETTE = [
  "#1677ff",
  "#52c41a",
  "#faad14",
  "#f5222d",
  "#722ed1",
  "#13c2c2",
  "#eb2f96",
  "#fa8c16",
  "#2f54eb",
  "#a0d911",
  "#08979c",
  "#9254de",
  "#fa541c",
  "#1890ff",
  "#b37feb",
];

export const STATUS_COLORS = {
  accepted: "#52c41a",
  approved: "#52c41a",
  completed: "#1677ff",
  pending: "#faad14",
  build_profile: "#722ed1",
  buildprofile: "#722ed1",
  denied: "#f5222d",
  rejected: "#f5222d",
  unread: "#faad14",
  read: "#52c41a",
  backend: "#1677ff",
  frontend: "#722ed1",
  woman: "#eb2f96",
  man: "#1677ff",
  "lgbtq+": "#722ed1",
  other: "#8c8c8c",
};

export const colorFor = (key, fallbackIndex = 0) => {
  if (!key) return PALETTE[fallbackIndex % PALETTE.length];
  const k = String(key).toLowerCase();
  return STATUS_COLORS[k] || PALETTE[fallbackIndex % PALETTE.length];
};
