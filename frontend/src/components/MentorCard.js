import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Avatar, Typography, Button, Rate, Tooltip, theme } from "antd";
import {
  LinkOutlined,
  LinkedinOutlined,
  StarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  StarFilled,
  YoutubeOutlined,
} from "@ant-design/icons";
import { formatLinkForHref } from "utils/misc";
import { useAuth } from "../utils/hooks/useAuth";

import MenteeButton from "./MenteeButton";

import "./css/Gallery.scss";
import { ACCOUNT_TYPE } from "utils/consts";
import { useTranslation } from "react-i18next";
import { css } from "@emotion/css";

const { Title, Text, Paragraph } = Typography;

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
  const {
    token: { colorPrimary, colorPrimaryBg },
  } = theme.useToken();
  const { t } = useTranslation();
  const { isMentee } = useAuth();
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
    return str.length > maxLength ? (
      <Tooltip title={str}> {str.substring(0, maxLength - 3) + "..."} </Tooltip>
    ) : (
      str
    );
  }

  return (
    <div
      className={css`
        background-color: white;
        border: 2px solid ${colorPrimaryBg};
        border-radius: 8px;
        position: relative;
        height: 35em;
        padding: 20px;
        padding-top: 0px;
      `}
    >
      <div className="gallery-card-body">
        <div className="gallery-card-header">
          <Avatar size={90} icon={getImage(props.image && props.image.url)} />
          <div className="gallery-header-text gallery-info-section">
            <Title style={styles.title} className="gallery-title-text">
              {truncate(props.name, 12)}
            </Title>
            <Title style={styles.subTitle} type="secondary" level={5}>
              {truncate(props.professional_title, 35)}
            </Title>
            <Title style={styles.subTitle} type="secondary" level={5}>
              {t("gallery.speaks")} {truncate(props.languages.join(", "), 20)}
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
          <Typography>
            <Title
              level={5}
              className={css`
                margin-top: 0;
                color: ${colorPrimary} !important;
              `}
            >
              {t("commonProfile.location")} <EnvironmentOutlined />
            </Title>
            <Paragraph>{props.location}</Paragraph>
          </Typography>
        )}
        <Typography>
          <Title
            level={5}
            className={css`
              margin-top: 0;
              color: ${colorPrimary} !important;
            `}
          >
            {t("common.specializations")} <StarOutlined />
          </Title>
          <Paragraph>
            {truncate(props.specializations.join(", "), 60)}
          </Paragraph>
        </Typography>
        {/* {props.website && (
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
              {t("commonProfile.linkedin")}
            </a>
          </h4>
        )} */}
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
          <Typography>
            <Title
              level={5}
              className={css`
                margin-top: 0;
                color: ${colorPrimary} !important;
              `}
            >
              {t("common.partner")}
            </Title>
            <Paragraph>
              <Avatar
                src={props.pair_partner.image && props.pair_partner.image.url}
                icon={<UserOutlined />}
              />{" "}
              {props.pair_partner.organization}
            </Paragraph>
          </Typography>
        )}
      </div>
      <div className="gallery-card-footer">
        <NavLink to={`/gallery/${ACCOUNT_TYPE.MENTOR}/${props.id}`}>
          <div className="gallery-button">
            <MenteeButton content={t("gallery.viewProfile")} />
          </div>
        </NavLink>
      </div>
    </div>
  );
}

export default MentorCard;
