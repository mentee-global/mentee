import React from "react";
import { Alert, Card, Skeleton, Typography } from "antd";
import { Bar, Doughnut, Line } from "react-chartjs-2";

const { Text } = Typography;

const CHART_BY_TYPE = {
  bar: Bar,
  line: Line,
  doughnut: Doughnut,
};

function ChartCard({
  title,
  subtitle,
  extra,
  type = "bar",
  data,
  options,
  loading,
  error,
  height = 280,
  empty,
}) {
  const ChartComponent = CHART_BY_TYPE[type] || Bar;
  const hasData = data && data.datasets && data.datasets.length > 0;

  let body;
  if (loading) {
    body = <Skeleton active paragraph={{ rows: 5 }} />;
  } else if (error) {
    body = (
      <Alert
        type="error"
        showIcon
        message="Couldn't load chart"
        description={String(error)}
      />
    );
  } else if (!hasData) {
    body = (
      <Alert
        type="info"
        showIcon
        message={empty || "No data yet"}
        description="The aggregation returned no rows."
      />
    );
  } else {
    body = (
      <div style={{ position: "relative", height }}>
        <ChartComponent data={data} options={options} />
      </div>
    );
  }

  return (
    <Card
      title={
        subtitle ? (
          <div>
            <div>{title}</div>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
              {subtitle}
            </Text>
          </div>
        ) : (
          title
        )
      }
      extra={extra}
      size="small"
      style={{ height: "100%" }}
    >
      {body}
    </Card>
  );
}

export default ChartCard;
