import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Avatar, Typography, Button, Rate } from "antd";
import {
  EnvironmentOutlined,
  UserOutlined,
  MessageOutlined,
  HeartFilled,
} from "@ant-design/icons";
import { formatLinkForHref } from "utils/misc";
import useAuth from "../utils/hooks/useAuth";

import MenteeButton from "./MenteeButton";

import "./css/Gallery.scss";

const { Title, Text } = Typography;

const styles = {
  title: {
    fontSize: "35px",
    whiteSpace: "normal",
    overflow: "visible",
    textOverflow: "ellipsis",
    margin: 0,
  },
  subTitle: {
    fontSize: "18px",
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
  const { isAdmin, isMentor, isMentee } = useAuth();
  function getImage(image) {
    if (!image) {
      return <UserOutlined />;
    } else {
      return <img src={image} alt="" />;
    }
  }

  return (
    <div className="gallery-mentor-card">
      <div className="gallery-card-body">
        <div className="gallery-card-header">
          <Avatar size={90} icon={getImage(props.image && props.image.url)} />
          <div className="gallery-header-text gallery-info-section">
            <Title style={styles.title} className="gallery-title-text">
              {props.name} {"|"} {props.age}
            </Title>
            <Title style={styles.subTitle} type="secondary" level={5}>
              {props.gender} {"|"} {props.organization}
            </Title>
          </div>
        </div>
        {props.location && (
          <div className="gallery-info-section">
            <h3 className="mentee-gallery-headers">
              <EnvironmentOutlined style={styles.icon} />
              Location:
            </h3>
            <Text className="gallery-list-items">{props.location}</Text>
          </div>
        )}
        <h3 className="mentee-gallery-headers">
          <MessageOutlined style={styles.icon} />
          Languages:
        </h3>
        <Text className="gallery-list-items">{props.languages.join(", ")}</Text>
        <hr className="gallery-solid-border" />
        <div className="bookmark-button"></div>
        <NavLink to={"/gallery/" + props.id}>
          <div className="gallery-button">
            <MenteeButton content="View Profile" />
          </div>
        </NavLink>
      </div>
    </div>
  );
}

export default MenteeCard;
