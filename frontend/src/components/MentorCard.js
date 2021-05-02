import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Avatar, Typography, Button, Rate } from "antd";
import {
  LinkOutlined,
  LinkedinOutlined,
  StarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  MessageOutlined,
  HeartOutlined,
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

    return (
      <div className="gallery-mentor-card">
        <div className="gallery-card-body">
          <div className="gallery-card-header">
            <Avatar size={90} icon={getImage(props.image && props.image.url)} />
            <div className="gallery-header-text gallery-info-section">
              <Title style={styles.title} className="gallery-title-text">
                {props.name}
              </Title>
              <Title style={styles.subTitle} type="secondary" level={5}>
                {props.gender}
              </Title>
            </div>
            {isMentee && (
              <div className="favorite-button">
                <Rate
                  character={<HeartFilled />}
                  count={1}
                  defaultValue={favorite ? 1 : 0}
                  onChange={(number) => onFavoriteClick(number)}
                />
              </div>
            )}
          </div>
          <h3 className="gallery-headers">
            <MessageOutlined style={styles.icon} />
            Languages:
          </h3>
          <Text className="gallery-list-items">
            {props.languages.join(", ")}
          </Text>
        </div>
        {props.location && (
          <div className="gallery-info-section">
            <h3 className="gallery-headers">
              <EnvironmentOutlined style={styles.icon} />
              Location:
              </h3>
            <Text className="gallery-list-items">{props.location}</Text>
          </div>
        )}

        <hr className="gallery-solid-border" />
        <h3 className="gallery-headers">
          <StarOutlined style={styles.icon} />
          Specializations:
          </h3>
        <Text className="gallery-list-items">
          {props.specializations.join(", ")}
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
        <hr className="gallery-solid-border" />
        <div className="bookmark-button"></div>
        <NavLink to={"/gallery/" + props.id}>
          <div className="gallery-button">
            <MenteeButton content="View Profile" />
          </div>
        </NavLink>
      </div>

    )
  }




export default MentorCard;
