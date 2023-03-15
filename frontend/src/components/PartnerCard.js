import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Avatar, Typography, Tooltip } from "antd";
import {
  LinkOutlined,
  LinkedinOutlined,
  StarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  YoutubeOutlined,
} from "@ant-design/icons";
import { formatLinkForHref } from "utils/misc";
import { useAuth } from "../utils/hooks/useAuth";

import MenteeButton from "./MenteeButton";

import "./css/Gallery.scss";
import { ACCOUNT_TYPE } from "utils/consts";

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
    fontSize: "1.2em",
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

function PartnerCard(props) {
  const { isAdmin, isPartner } = useAuth();
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
    <div className="gallery-partner-card">
      <div className="gallery-card-body">
        <div className="gallery-card-header">
          <Avatar size={90} icon={getImage(props.image && props.image.url)} />
          <div className="gallery-header-text gallery-info-section">
            <Title style={styles.title} className="gallery-title-text">
              {truncate(props.organization, 15)}
            </Title>
            <Title style={styles.subTitle} type="secondary" level={5}>
              {truncate(props.email, 35)}
            </Title>
          </div>
        </div>
        {props.location && (
          <div className="gallery-info-section">
            <h3 className="gallery-headers">
              <EnvironmentOutlined style={styles.icon} />
              Location:
            </h3>
            <Text className="gallery-list-items">
              {truncate(props.location, 45)}
            </Text>
          </div>
        )}
        <h3 className="gallery-headers">
          <StarOutlined style={styles.icon} />
          regions:
        </h3>
        <Text className="gallery-list-items">
          {truncate(props.regions.join(", "), 87)}
        </Text>
        {props.website && (
          <h4 className="gallery-info-section">
            <LinkOutlined style={styles.icon} />
            <a
              className="gallery-links"
              href={formatLinkForHref(props.website)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {props.website}
            </a>
          </h4>
        )}
        {props.linkedin && (
          <h4 className="gallery-info-section">
            <LinkedinOutlined style={styles.icon} />
            <a
              className="gallery-links"
              href={formatLinkForHref(props.linkedin)}
              target="_blank"
              rel="noopener noreferrer"
            >
              linkedin
            </a>
          </h4>
        )}
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
      </div>
      <div className="gallery-card-footer">
        <NavLink to={`/gallery/${ACCOUNT_TYPE.PARTNER}/${props.id}`}>
          <div className="gallery-button">
            <MenteeButton content="View Profile" />
          </div>
        </NavLink>
      </div>
    </div>
  );
}

export default PartnerCard;
