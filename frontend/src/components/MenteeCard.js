import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Avatar, Typography, Button, Rate, Tooltip, theme } from "antd";
import {
  EnvironmentOutlined,
  UserOutlined,
  MessageOutlined,
  YoutubeOutlined,
  GlobalOutlined,
} from "@ant-design/icons";

import MenteeButton from "./MenteeButton";
import { ACCOUNT_TYPE } from "utils/consts";
import "./css/Gallery.scss";
import { formatLinkForHref } from "utils/misc";
import { useTranslation } from "react-i18next";
import { css } from "@emotion/css";
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

function MenteeCard(props) {
  const {
    token: { colorPrimary, colorPrimaryBg },
  } = theme.useToken();
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
          </div>
        )}
        <Typography>
          <Title
            level={5}
            className={css`
              margin-top: 0;
              color: ${colorPrimary} !important;
            `}
          >
            {t("common.languages")} <GlobalOutlined />
          </Title>
          <Paragraph> {truncate(props.languages.join(", "), 30)}</Paragraph>
        </Typography>
        {/* TODO: Potentionally remove this for Mentees? */}
        {/* {props.video && props.video.url && (
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
        )} */}
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
      <div
        className={css`
          border-top: 3px solid ${colorPrimary};
          position: absolute;
          bottom: -5px;
          width: 90%;
        `}
      >
        <NavLink to={`/gallery/${ACCOUNT_TYPE.MENTEE}/${props.id}`}>
          <div className="gallery-button">
            <Button type="primary">{t("gallery.viewProfile")}</Button>
          </div>
        </NavLink>
      </div>
    </div>
  );
}

export default MenteeCard;
