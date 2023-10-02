import React, { useState } from "react";
import {
  Avatar,
  Typography,
  Button,
  Tooltip,
  theme,
  Popconfirm,
  notification,
} from "antd";
import { UserOutlined } from "@ant-design/icons";
import { formatDateTime } from "utils/consts";
import "./css/Gallery.scss";
import { useTranslation } from "react-i18next";
import { css } from "@emotion/css";
import { useAuth } from "../utils/hooks/useAuth";
import AddEventModal from "components/AddEventModal";
import { deleteEvent } from "utils/api";

const { Title, Paragraph } = Typography;

const styles = {
  title: {
    fontSize: "2em",
    whiteSpace: "normal",
    overflow: "visible",
    textOverflow: "ellipsis",
    margin: 0,
  },
  subTitle: {
    fontSize: "1.5em px",
    whiteSpace: "normal",
    overflow: "visible",
    textOverflow: "ellipsis",
    margin: 0,
  },
  icon: {
    fontSize: "20px",
    paddingRight: "7px",
  },
};

function EventCard(props) {
  const {
    token: { colorPrimary, colorPrimaryBg },
  } = theme.useToken();
  const { t } = useTranslation();
  const { isAdmin, isPartner, isMentor, profileId, role, isMentee } = useAuth();
  const [eventModalvisible, setEventModalvisible] = useState(false);

  function getImage(image) {
    if (!image) {
      return <UserOutlined />;
    } else {
      return <img src={image} alt="" />;
    }
  }

  function truncate(str, maxLength) {
    return str.length > maxLength ? (
      <Tooltip title={str}> {str.substring(0, maxLength - 3) + "..."} </Tooltip>
    ) : (
      str
    );
  }

  function getCreaterData(user_id) {
    return props.users.find((x) => x._id.$oid === user_id.$oid);
  }

  const event_item = props.event_item;
  const create_user = getCreaterData(event_item.user_id);
  let isEditable = false;
  if (isAdmin) isEditable = true;
  if (isPartner) isEditable = true;
  if (isMentor && event_item.user_id.$oid === profileId) isEditable = true;
  if (isMentee && event_item.user_id.$oid === profileId) isEditable = true;

  return (
    <div
      className={css`
        background-color: white;
        border: 2px solid ${colorPrimaryBg};
        border-radius: 8px;
        position: relative;
        height: 27em;
        padding: 20px;
        padding-top: 0px;
        :hover {
          box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
        }
      `}
    >
      <div
        className="gallery-card-body"
        style={{ height: isEditable ? "90%" : "100%", overflowY: "auto" }}
      >
        <div className="gallery-card-header">
          <Avatar
            size={90}
            icon={getImage(
              create_user && create_user.image && create_user.image.url
            )}
          />
          <div className="gallery-header-text gallery-info-section">
            <Title style={styles.title} className="gallery-title-text">
              {truncate(event_item.title, 15)}
            </Title>
            <div className="gallery-header-description">
              {t("events.eventsubmitby")}:<br />
              <span>{create_user ? create_user.name : "Admin User"}</span>
            </div>
          </div>
        </div>
        <div className="datetime-area">
          {event_item.start_datetime && (
            <>
              <span style={{ fontSize: "15px", color: "#800020" }}>
                {formatDateTime(new Date(event_item.start_datetime.$date))} ~{" "}
              </span>
              {event_item.end_datetime && (
                <span style={{ fontSize: "15px", color: "#800020" }}>
                  {formatDateTime(new Date(event_item.end_datetime.$date))}
                </span>
              )}
            </>
          )}
        </div>
        <div className="gallery-info-section">
          {event_item.image_file && (
            <Typography>
              <img
                style={{ maxHeight: "100px" }}
                className="event-img"
                src={event_item.image_file.url}
                alt=""
              />
            </Typography>
          )}
          {event_item.description && (
            <Typography>
              <Paragraph style={{ fontSize: "20px", fontWeight: 600 }}>
                {t("events.summary")}:
              </Paragraph>
              <Paragraph style={{ fontSize: "16px", paddingLeft: "10px" }}>
                {" "}
                {truncate(event_item.description, 30)}
              </Paragraph>
            </Typography>
          )}
          {event_item.url && <a href={event_item.url}>{event_item.url}</a>}
        </div>
      </div>
      {isEditable && (
        <div
          className={css`
            border-top: 3px solid ${colorPrimary};
            position: absolute;
            bottom: -5px;
            width: 90%;
          `}
        >
          <div className="gallery-button">
            <Button
              style={{ marginRight: "10px" }}
              type="primary"
              onClick={() => setEventModalvisible(true)}
            >
              {t("events.editEvent")}
            </Button>
            <Popconfirm
              title={`Are you sure you want to delete ?`}
              onConfirm={() => {
                deleteEvent(event_item);
                notification["success"]({
                  message: t("events.succuessDelete"),
                });
                props.reloading();
                props.refresh();
              }}
              // onCancel={() => message.info(`No deletion has been made`)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="primary">{t("events.deleteEvent")}</Button>
            </Popconfirm>
          </div>
          <AddEventModal
            role={role}
            open={eventModalvisible}
            setOpen={setEventModalvisible}
            event_item={event_item}
            refresh={() => props.refresh()}
            reloading={() => props.reloading()}
          />
        </div>
      )}
    </div>
  );
}

export default EventCard;
