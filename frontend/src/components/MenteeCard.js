import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Avatar, Typography, Button, Rate, Tooltip } from "antd";
import {
  EnvironmentOutlined,
  UserOutlined,
  MessageOutlined,
  YoutubeOutlined,
} from "@ant-design/icons";

import MenteeButton from "./MenteeButton";
import { ACCOUNT_TYPE } from "utils/consts";
import "./css/Gallery.scss";
import { formatLinkForHref } from "utils/misc";
import { useTranslation } from "react-i18next";
const { Title, Text } = Typography;

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

function MenteeCard(props) {
  const { t } = useTranslation();

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

  return (
    <div className="gallery-mentor-card">
      <div className="gallery-card-body">
        <div className="gallery-card-header">
          <Avatar size={90} icon={getImage(props.image && props.image.url)} />
          <div className="gallery-header-text gallery-info-section">
            <Title style={styles.title} className="gallery-title-text">
              {truncate(props.name, 15)}
            </Title>
            <div className="gallery-header-description">
              {props.gender} {"|"} {props.organization}
            </div>
          </div>
        </div>
        {props.location && (
          <div className="gallery-info-section">
            <h3 className="mentee-gallery-headers">
              <EnvironmentOutlined style={styles.icon} />
              {t("commonProfile.location")}:
            </h3>
            <Text className="gallery-list-items">{props.location}</Text>
          </div>
        )}
        <h3 className="mentee-gallery-headers">
          <MessageOutlined style={styles.icon} />
          {t("common.languages")}:
        </h3>
        <Text className="gallery-list-items">
          {truncate(props.languages.join(", "), 30)}
        </Text>
        {props.video && props.video.url && (
          <h4 className="gallery-info-section">
            <YoutubeOutlined style={styles.icon} />
            <a
              className="gallery-links"
              href={formatLinkForHref(props.video.url)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {props.video.title}
            </a>
          </h4>
        )}
        {props.pair_partner && props.pair_partner.email && (
          <>
            <h3 className="gallery-headers">{t("common.partner")}:</h3>
            <Avatar
              size={45}
              src={props.pair_partner.image && props.pair_partner.image.url}
              icon={<UserOutlined />}
            />
            <label style={{ marginLeft: "10px" }}>
              {props.pair_partner.organization}
            </label>
          </>
        )}
      </div>
      <div className="gallery-card-footer">
        <NavLink to={`/gallery/${ACCOUNT_TYPE.MENTEE}/${props.id}`}>
          <div className="gallery-button">
            <MenteeButton content={t("gallery.viewProfile")} />
          </div>
        </NavLink>
      </div>
    </div>
  );
}

export default MenteeCard;
