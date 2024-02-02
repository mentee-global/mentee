import React, { useState, useEffect } from "react";
import { NavLink, useHistory } from "react-router-dom";
import { Avatar, Typography, Button, Rate, Tooltip, theme } from "antd";
import {
  StarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  StarFilled,
  YoutubeOutlined,
} from "@ant-design/icons";
import { formatLinkForHref } from "utils/misc";
import { useAuth } from "../utils/hooks/useAuth";

import "./css/Gallery.scss";
import { ACCOUNT_TYPE, REDIRECTS } from "utils/consts";
import { useTranslation } from "react-i18next";
import { css } from "@emotion/css";
import { useDispatch, useSelector } from "react-redux";
import { fetchUser } from "features/userSlice";

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
  const { isMentee, resetRoleState } = useAuth();
  const [favorite, setFavorite] = useState(props.favorite);
  const dispatch = useDispatch();
  const history = useHistory();
  const user = useSelector((state) => state.user.user);

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

  function loginOtherUser(e, user_data) {
    localStorage.setItem("support_user_id", user._id.$oid);
    resetRoleState(user_data.id, ACCOUNT_TYPE.MENTOR);
    dispatch(
      fetchUser({
        id: user_data.id,
        role: ACCOUNT_TYPE.MENTOR,
      })
    );
    localStorage.setItem("role", ACCOUNT_TYPE.MENTOR);
    localStorage.setItem("profileId", user_data.id);

    history.push(REDIRECTS[ACCOUNT_TYPE.MENTOR]);
  }

  return (
    <div
      className={css`
        background-color: white;
        border: 2px solid ${colorPrimaryBg};
        border-radius: 8px;
        position: relative;
        height: 37em;
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
        <h3 className="gallery-lesson-types">{props.lesson_types}</h3>
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
      <div
        className={css`
          border-top: 3px solid ${colorPrimary};
          position: absolute;
          bottom: -5px;
          width: 90%;
        `}
      >
        {props.isSupport ? (
          <>
            <div className="gallery-button">
              <Button onClick={(e) => loginOtherUser(e, props)} type="primary">
                {t("common.login")}
              </Button>
            </div>
          </>
        ) : (
          <NavLink to={`/gallery/${ACCOUNT_TYPE.MENTOR}/${props.id}`}>
            <div className="gallery-button">
              <Button type="primary">{t("gallery.viewProfile")}</Button>
            </div>
          </NavLink>
        )}
      </div>
    </div>
  );
}

export default MentorCard;
