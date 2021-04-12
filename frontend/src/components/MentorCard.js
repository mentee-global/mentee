import React from "react";
import { NavLink } from "react-router-dom";
import { Avatar, Typography, Button } from "antd";
import {
  LinkOutlined,
  LinkedinOutlined,
  StarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  HeartOutlined
} from "@ant-design/icons";
import { formatLinkForHref } from "utils/misc";

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
  const [favorite, setFavorite] = useState(props.favorite);
  function getImage(image) {
    if (!image) {
      return <UserOutlined />;
    } else {
      return <img src={image} alt="" />;
    }
  }

  function onFavoriteClick() {
    if(favorite) {
      //unfavorite
    } else {
      //add to favorites
      //TODO: Create endpoint for updating favorite_mentors list for MenteeProfile
    }
    setFavorite(!favorite);
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
              {props.professional_title}
            </Title>
            <Title style={styles.subTitle} type="secondary" level={5}>
              Speaks: {props.languages.join(", ")}
            </Title>
          </div>
          <div className="favorite-button">
            <Button shape="circle" icon={<HeartOutlined></HeartOutlined>} style={{ border: 'none'}} onClick={onFavoriteClick}/>
          </div>
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
            <Text className="gallery-list-items">{props.location}</Text>
          </div>
        )}
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
        <div className="bookmark-button">
          
        </div>
        <NavLink to={"/gallery/" + props.id}>
          <div className="gallery-button">
            <MenteeButton content="View Profile" />
          </div>
        </NavLink>
      </div>
    </div>
  );
}

export default MentorCard;
