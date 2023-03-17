import React, { useEffect } from "react";
import { useHistory } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import { Badge } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { fetchNotificationsCount } from "features/notificationsSlice";
import { useAuth } from "utils/hooks/useAuth";
import "./css/Navigation.scss";

function NotificationBell() {
  const history = useHistory();
  const { role } = useAuth();
  const count = useSelector((state) => state.notifications.count);
  const dispatch = useDispatch();
  const profileID = useSelector((state) => state.user.user?._id?.$oid);

  useEffect(() => {
    dispatch(fetchNotificationsCount({ id: profileID }));
  }, []);

  return (
    <div className="notifications-section">
      <Badge count={count ?? 0} size="small">
        <BellOutlined
          onClick={() => history.push({ pathname: `/messages/${role}` })}
          className="notifications-icon"
        />
      </Badge>
    </div>
  );
}

export default NotificationBell;
