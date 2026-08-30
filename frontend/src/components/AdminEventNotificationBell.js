import React, { useCallback, useEffect, useState } from "react";
import { Badge, Button, Empty, Popover, Spin, Typography } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

import { fetchNotificationsCount } from "features/notificationsSlice";
import {
  fetchAdminEventNotifications,
  markAllAdminEventNotificationsRead,
} from "utils/api";
import { useAuth } from "utils/hooks/useAuth";
import "./css/Navigation.scss";

function AdminEventNotificationBell() {
  const { t } = useTranslation();
  const history = useHistory();
  const dispatch = useDispatch();
  const { role } = useAuth();
  const messageCount = useSelector((state) => state.notifications.count) || 0;
  const profileId = useSelector((state) => state.user.user?._id?.$oid);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async (markAsRead = false) => {
    let result;
    try {
      result = await fetchAdminEventNotifications();
    } catch {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const nextNotifications = result.notifications || [];
    const nextUnreadCount = result.unread_count || 0;
    if (markAsRead && nextUnreadCount) {
      const readAt = new Date().toISOString();
      setNotifications(
        nextNotifications.map((notification) => ({
          ...notification,
          read_at: notification.read_at || readAt,
        }))
      );
      setUnreadCount(0);
      try {
        await markAllAdminEventNotificationsRead();
      } catch {
        setNotifications(nextNotifications);
        setUnreadCount(nextUnreadCount);
      }
    } else {
      setNotifications(nextNotifications);
      setUnreadCount(nextUnreadCount);
    }
    setLoading(false);
  }, []);

  const openNotification = (notification) => {
    setOpen(false);
    history.push(notification.link);
  };

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 60000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    if (profileId) dispatch(fetchNotificationsCount({ id: profileId }));
  }, [dispatch, profileId]);

  const content = (
    <div className="admin-event-notifications">
      <Typography.Title level={5}>
        {t("events.workflow.adminNotificationsTitle")}
      </Typography.Title>
      <Button
        type="text"
        className="admin-event-notifications__messages"
        onClick={() => {
          setOpen(false);
          history.push(`/messages/${role}`);
        }}
      >
        <span>{t("common.messages")}</span>
        <Badge count={messageCount} size="small" />
      </Button>
      {loading ? (
        <div className="admin-event-notifications__loading">
          <Spin size="small" />
        </div>
      ) : notifications.length ? (
        <div className="admin-event-notifications__list">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              className={`admin-event-notifications__item${
                notification.read_at
                  ? ""
                  : " admin-event-notifications__item--unread"
              }`}
              onClick={() => openNotification(notification)}
            >
              <strong>{notification.title}</strong>
              <span>{notification.message}</span>
            </button>
          ))}
        </div>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("events.workflow.noReviewNotifications")}
        />
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) loadNotifications(true);
      }}
    >
      <Badge count={unreadCount + messageCount} size="small">
        <Button
          type="text"
          shape="circle"
          icon={<BellOutlined />}
          aria-label={t("events.workflow.reviewNotificationsBell")}
        />
      </Badge>
    </Popover>
  );
}

export default AdminEventNotificationBell;
