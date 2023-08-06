import React, { useEffect } from "react";
import { useHistory } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import { Badge, Tooltip } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { fetchNotificationsCount } from "features/notificationsSlice";
import { useAuth } from "utils/hooks/useAuth";
import "./css/Navigation.scss";
import { useTranslation } from "react-i18next";

function NotificationBell() {
  const { t } = useTranslation();
  const history = useHistory();
  const { role } = useAuth();
  const count = useSelector((state) => state.notifications.count);
  const dispatch = useDispatch();
  const profileID = useSelector((state) => state.user.user?._id?.$oid);

  useEffect(() => {
    dispatch(fetchNotificationsCount({ id: profileID }));
  }, [profileID]);

  return (
    <div className="notifications-section">
      <Tooltip title={t("common.messages")}>
        <Badge count={count ?? 0} size="small">
          <BellOutlined
            onClick={() => history.push({ pathname: `/messages/${role}` })}
            className="notifications-icon"
          />
        </Badge>
      </Tooltip>
    </div>
  );
}

export default NotificationBell;
