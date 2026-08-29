import React, { useCallback, useEffect, useState } from "react";
import { Badge, Button, Empty, Popover, Spin, Typography } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  fetchAdminEventNotifications,
  markAdminEventNotificationRead,
} from "utils/api";
import "./css/Navigation.scss";

function AdminEventNotificationBell() {
  const { t } = useTranslation();
  const history = useHistory();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      const result = await fetchAdminEventNotifications();
      setNotifications(result.notifications || []);
      setUnreadCount(result.unread_count || 0);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 60000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  const openNotification = async (notification) => {
    try {
      if (!notification.read_at) {
        await markAdminEventNotificationRead(notification.id);
        setUnreadCount((count) => Math.max(0, count - 1));
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? { ...item, read_at: new Date().toISOString() }
              : item
          )
        );
      }
    } catch {}
    setOpen(false);
    history.push(notification.link);
  };

  const content = (
    <div className="admin-event-notifications">
      <Typography.Title level={5}>
        {t("events.workflow.reviewNotificationsTitle")}
      </Typography.Title>
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
        if (nextOpen) loadNotifications();
      }}
    >
      <Badge count={unreadCount} size="small">
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
