import React, { useState } from "react";
import { Badge } from "antd";
import { BellOutlined } from "@ant-design/icons";
import {notificationsRducer} from "app/store"
 

import "./css/Navigation.scss";



function NotificationBell() {
  const store = Redux.createStore(notificationsRducer)
  const [count, setcount] = useState(store.getState());
  


  return (
    <div className="notifications-section">
      <Badge count={count} size="small">
        <BellOutlined className="notifications-icon" />
      </Badge>
    </div>
  );
}


export default NotificationBell;
