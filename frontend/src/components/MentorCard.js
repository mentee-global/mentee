import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Avatar, Typography, Button, Rate, Tooltip } from "antd";
import {
  LinkOutlined,
  LinkedinOutlined,
  StarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  StarFilled,
} from "@ant-design/icons";
import { formatLinkForHref } from "utils/misc";
import useAuth from "../utils/hooks/useAuth";

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

function MentorCard(props) {
  const { isAdmin, isMentor, isMentee } = useAuth();
  const [favorite, setFavorite] = useState(props.favorite);
  function getImage(image) {
    if (!image) {
      return <UserOutlined />;
    } else {
      return <img src={image} alt="" />;
    }
  }

  function onFavoriteClick(fav) {
    setFavorite(!fav);
    props.onEditFav(props.id, fav);
  }

  function truncate(str, maxLength) {
      return str.length > maxLength ? str.substring(0, maxLength-3) + "..." : str;
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
            <Title style={styles.subTitle} type="secondary" level={5}>
              {truncate(props.professional_title, 35)}
            </Title>
            <Title style={styles.subTitle} type="secondary" level={5}>
                <Tooltip title = {props.languages.join(", ")}>
                    Speaks: {truncate(props.languages.join(", "), 30)} 
                </Tooltip>
            </Title>
          </div>
          {isMentee && (
            <div className="favorite-button">
              <Rate
                character={<StarFilled />}
                count={1}
                defaultValue={favorite ? 1 : 0}
                onChange={(number) => onFavoriteClick(number)}
              />
            </div>
          )}
        </div>
        <h3 className="gallery-lesson-types">
          <span className="gallery-dot" />
          {props.lesson_types}
        </h3>
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
          Specializations:
        </h3>
        <Text className="gallery-list-items">
            <Tooltip title = {props.specializations.join(", ")}>
          {truncate(props.specializations.join(", "), 87)}
            </Tooltip>
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
      </div>
      <div className="gallery-card-footer">
        <NavLink to={`/gallery/${ACCOUNT_TYPE.MENTOR}/${props.id}`}>
          <div className="gallery-button">
            <MenteeButton content="View Profile" />
          </div>
        </NavLink>
      </div>
    </div>
  );
}

export default MentorCard;
