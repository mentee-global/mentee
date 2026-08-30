import React, { useEffect, useState } from "react";
import { Avatar, Result, Spin, Tag, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { withRouter } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { fetchEventById } from "utils/api";
import { formatDateTime } from "utils/consts";

function EventDetail({ match }) {
  const { t } = useTranslation();
  const [event, setEvent] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    setStatus("loading");
    fetchEventById(match.params.id)
      .then((result) => {
        if (!result) {
          setStatus("forbidden");
          return;
        }
        setEvent(result);
        setStatus("ready");
      })
      .catch((error) => {
        setStatus(error?.response?.status === 404 ? "missing" : "forbidden");
      });
  }, [match.params.id]);

  if (status === "loading") return <Spin size="large" />;
  if (status !== "ready") {
    return (
      <Result
        status={status === "missing" ? "404" : "403"}
        title={status === "missing" ? "404" : "403"}
        subTitle={
          status === "missing"
            ? t("events.workflow.notFound")
            : t("gallery.unauthorizedAccess")
        }
      />
    );
  }

  const creator = event.creator || {};
  return (
    <div className="mentor-profile-flexbox">
      <div className="mentor-profile-content-public">
        <div style={{ minWidth: "65%" }}>
          <div style={{ display: "flex", gap: 20 }}>
            <Avatar
              size={120}
              src={creator.image_url}
              icon={<UserOutlined />}
            />
            <div>
              <Typography.Title className="gallery-title-text">
                {event.title}
              </Typography.Title>
              <div className="gallery-header-description">
                {t("events.eventsubmitby")}: {creator.name || "MENTEE"}
              </div>
              {event.status !== "published" && (
                <Tag color={event.status === "rejected" ? "red" : "gold"}>
                  {event.status.replaceAll("_", " ")}
                </Tag>
              )}
            </div>
          </div>
          {event.review_feedback && (
            <Typography.Paragraph type="danger" style={{ marginTop: 20 }}>
              {t("events.workflow.reviewFeedback", {
                feedback: event.review_feedback,
              })}
            </Typography.Paragraph>
          )}
          <div className="datetime-area" style={{ marginTop: 20 }}>
            {event.start_datetime && (
              <Typography.Paragraph style={{ fontSize: 20 }}>
                <strong>{t("events.period")}:</strong>{" "}
                {formatDateTime(new Date(event.start_datetime.$date))}
                {event.end_datetime &&
                  ` ~ ${formatDateTime(new Date(event.end_datetime.$date))}`}
              </Typography.Paragraph>
            )}
            {event.image_file && (
              <img
                style={{ marginTop: 15, maxWidth: "60%" }}
                src={event.image_file.url}
                alt=""
              />
            )}
            {event.description && (
              <Typography.Paragraph style={{ fontSize: 16, marginTop: 20 }}>
                <strong>{t("events.summary")}:</strong>
                <br />
                {event.description}
              </Typography.Paragraph>
            )}
            {event.url && (
              <Typography.Paragraph style={{ fontSize: 16 }} ellipsis>
                <strong>URL:</strong> <a href={event.url}>{event.url}</a>
              </Typography.Paragraph>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRouter(EventDetail);
