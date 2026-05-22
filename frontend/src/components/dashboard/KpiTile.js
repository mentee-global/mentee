import React from "react";
import { Card, Skeleton, Statistic } from "antd";

function KpiTile({
  title,
  value,
  suffix,
  prefix,
  loading,
  precision,
  valueStyle,
  hint,
}) {
  return (
    <Card size="small" bordered hoverable style={{ height: "100%" }}>
      {loading ? (
        <Skeleton active paragraph={{ rows: 1 }} title={false} />
      ) : (
        <Statistic
          title={title}
          value={value ?? "—"}
          suffix={suffix}
          prefix={prefix}
          precision={precision}
          valueStyle={valueStyle}
        />
      )}
      {hint && !loading && (
        <div style={{ color: "#8c8c8c", fontSize: 11, marginTop: 4 }}>
          {hint}
        </div>
      )}
    </Card>
  );
}

export default KpiTile;
