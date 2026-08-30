import React from "react";
import { Avatar, Button, Popconfirm, Tooltip, Typography, theme } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "utils/consts";
import "./css/Gallery.scss";

function truncate(value, maxLength) {
  if (!value || value.length <= maxLength) return value;
  return (
    <Tooltip title={value}>{`${value.slice(0, maxLength - 3)}...`}</Tooltip>
  );
}

function EventCard({ event_item, onEdit, onCancel }) {
  const {
    token: { colorPrimary, colorPrimaryBg },
  } = theme.useToken();
  const { t } = useTranslation();
  const creator = event_item.creator || {};

  return (
    <article
      className="event-card"
      style={{
        "--event-card-border": colorPrimaryBg,
        "--event-card-accent": colorPrimary,
      }}
    >
      <div className="event-card__body">
        <div className="event-card__header">
          <Avatar size={72} src={creator.image_url} icon={<UserOutlined />} />
          <div className="event-card__heading">
            <Typography.Title level={3} className="event-card__title">
              {event_item.title}
            </Typography.Title>
            <div className="event-card__creator">
              {t("events.eventsubmitby")}:<br />
              <span>{creator.name || "MENTEE"}</span>
            </div>
          </div>
        </div>
        <div className="event-card__date">
          {event_item.start_datetime && (
            <span style={{ fontSize: 14, color: "#800020" }}>
              {formatDateTime(new Date(event_item.start_datetime.$date))}
              {event_item.end_datetime &&
                ` ~ ${formatDateTime(new Date(event_item.end_datetime.$date))}`}
            </span>
          )}
        </div>
        {event_item.description && (
          <div>
            <Typography.Paragraph strong className="event-card__summary-label">
              {t("events.summary")}:
            </Typography.Paragraph>
            <Typography.Paragraph className="event-card__summary">
              {truncate(event_item.description, 80)}
            </Typography.Paragraph>
          </div>
        )}
        {event_item.image_file && (
          <img
            className="event-card__image"
            src={event_item.image_file.url}
            alt=""
          />
        )}
      </div>
      <div className="event-card__actions">
        <NavLink to={`/event/${event_item._id.$oid}`}>
          <Button type="primary">{t("events.view")}</Button>
        </NavLink>
        {event_item.permissions?.edit && onEdit && (
          <Button onClick={() => onEdit(event_item)}>{t("events.edit")}</Button>
        )}
        {event_item.permissions?.cancel && onCancel && (
          <Popconfirm
            title={t("events.workflow.cancelQuestion")}
            description={t("events.workflow.cancelDescription")}
            onConfirm={() => onCancel(event_item)}
            okText={t("events.workflow.cancel")}
            okButtonProps={{ danger: true }}
          >
            <Button danger>{t("events.workflow.cancel")}</Button>
          </Popconfirm>
        )}
      </div>
    </article>
  );
}

export default EventCard;
