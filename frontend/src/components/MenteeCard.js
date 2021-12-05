import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Avatar, Typography, Button, Rate } from "antd";
import {
  EnvironmentOutlined,
  UserOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import useAuth from "../utils/hooks/useAuth";

import MenteeButton from "./MenteeButton";
import { ACCOUNT_TYPE } from "utils/consts";
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
            <div className="gallery-header-name">{props.name}</div>
            <div className="gallery-header-description">
              {props.gender} {"|"} {props.organization}
            </div>
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
      </div>
      <div className="gallery-card-footer">
        <NavLink to={`/gallery/${ACCOUNT_TYPE.MENTEE}/${props.id}`}>
          <div className="gallery-button">
            <MenteeButton content="View Profile" />
          </div>
        </NavLink>
      </div>
    </div>
  );
}

export default MenteeCard;
