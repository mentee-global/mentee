import React from "react";
import { Alert } from "antd";

function HygieneAlert({ title, description, severity = "warning" }) {
  return (
    <Alert
      type={severity}
      showIcon
      message={title}
      description={description}
      style={{ height: "100%" }}
    />
  );
}

export default HygieneAlert;
