import React, { useState } from "react";
import { Badge } from "antd";
import { BellOutlined } from "@ant-design/icons";

import "./css/Navigation.scss";

function NotificationBell() {
  const [count, setcount] = useState(5);

  return (
    <div className="notifications-section">
      <Badge count={count} size="small">
        <BellOutlined className="notifications-icon" />
      </Badge>
    </div>
  );
}

export default NotificationBell;
