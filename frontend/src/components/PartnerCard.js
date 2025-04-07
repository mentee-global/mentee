import React from "react";
import { NavLink, useHistory } from "react-router-dom";
import { Avatar, Typography, Tooltip, theme, Button } from "antd";
import {
  LinkOutlined,
  LinkedinOutlined,
  EnvironmentOutlined,
  UserOutlined,
  YoutubeOutlined,
} from "@ant-design/icons";
import { formatLinkForHref } from "utils/misc";
import "./css/Gallery.scss";
import { ACCOUNT_TYPE, getRegions, REDIRECTS } from "utils/consts";
import { useTranslation } from "react-i18next";
import { getTranslatedOptions } from "utils/translations";
import { css } from "@emotion/css";
import { useDispatch, useSelector } from "react-redux";
import { fetchUser } from "features/userSlice";
import { useAuth } from "../utils/hooks/useAuth";

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

const { Title, Text, Paragraph } = Typography;

function PartnerCard(props) {
  const {
    token: { colorPrimary, colorPrimaryBg },
  } = theme.useToken();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const history = useHistory();
  const user = useSelector((state) => state.user.user);
  const { resetRoleState } = useAuth();

  function getImage(image) {
    if (!image) {
      return <UserOutlined />;
    } else {
      return <img src={image} alt="" />;
    }
  }

  function truncate(str, maxLength) {
    if (!str) {
      return "";
    }
    return str.length > maxLength ? (
      <Tooltip title={str}> {str.substring(0, maxLength - 3) + "..."} </Tooltip>
    ) : (
      str
    );
  }

  function loginOtherUser(e, user_data) {
    localStorage.setItem("support_user_id", user._id.$oid);
    if (user_data.hub_user && user_data.hub_user.name) {
      localStorage.setItem("login_path", user_data.hub_user.url);
      resetRoleState(user_data.id, ACCOUNT_TYPE.HUB);
      dispatch(
        fetchUser({
          id: user_data.id,
          role: ACCOUNT_TYPE.HUB,
        })
      );
      localStorage.setItem("role", ACCOUNT_TYPE.HUB);
      localStorage.setItem("profileId", user_data.id);
      history.push(
        "/" + user_data.hub_user.url + REDIRECTS[ACCOUNT_TYPE.PARTNER]
      );
    } else {
      resetRoleState(user_data.id, ACCOUNT_TYPE.PARTNER);
      dispatch(
        fetchUser({
          id: user_data.id,
          role: ACCOUNT_TYPE.PARTNER,
        })
      );
      localStorage.setItem("role", ACCOUNT_TYPE.PARTNER);
      localStorage.setItem("profileId", user_data.id);
      history.push(REDIRECTS[ACCOUNT_TYPE.PARTNER]);
    }
  }

  return (
    <div
      className={css`
        background-color: white;
        border: 2px solid ${colorPrimaryBg};
        border-radius: 8px;
        position: relative;
        height: 32em;
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
              {truncate(
                props.organization ? props.organization : props.title,
                14
              )}
            </Title>
            <Title style={styles.subTitle} type="secondary" level={5}>
              {truncate(props.email, 35)}
            </Title>
          </div>
        </div>
        {props.person_name && (
          <div className="gallery-info-section">
            <Typography>
              <Title
                level={5}
                className={css`
                  margin-top: 0;
                  color: ${colorPrimary} !important;
                `}
              >
                {t("common.name")}{" "}
              </Title>
              <Paragraph>{props.person_name}</Paragraph>
            </Typography>
          </div>
        )}
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
                {truncate(t("commonProfile.location"), 37)}{" "}
                <EnvironmentOutlined />
              </Title>
              <Paragraph>{props.location}</Paragraph>
            </Typography>
          </div>
        )}
        {!(props.hub_user && props.hub_user.url.includes("AUAF")) && (
          <Typography>
            <Title
              level={5}
              className={css`
                margin-top: 0;
                color: ${colorPrimary} !important;
              `}
            >
              {t("gallery.regions")} <EnvironmentOutlined />
            </Title>
            <Paragraph>
              {truncate(
                getTranslatedOptions(props.regions, getRegions(t)).join(", "),
                37
              )}
            </Paragraph>
          </Typography>
        )}

        {props.website && (
          <Paragraph>
            <LinkOutlined style={styles.icon} />
            <a
              className="gallery-links"
              href={formatLinkForHref(props.website)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {truncate(props.website, 37)}
            </a>
          </Paragraph>
        )}
        {props.linkedin && (
          <Paragraph>
            <LinkedinOutlined style={styles.icon} />
            <a
              className="gallery-links"
              href={formatLinkForHref(props.linkedin)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("commonProfile.linkedin")}
            </a>
          </Paragraph>
        )}
        {props.video && props.video.url && (
          <Paragraph>
            <YoutubeOutlined style={styles.icon} />
            <a
              className="gallery-links"
              href={formatLinkForHref(props.video.url)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {props.video.title}
            </a>
          </Paragraph>
        )}
        {props.hub_user && props.hub_user.name && (
          <>
            <Title
              level={5}
              className={css`
                margin-top: 0;
                color: ${colorPrimary} !important;
              `}
            >
              HUB
            </Title>
            <div style={{ display: "flex" }}>
              <img
                src={props.hub_user.image?.url}
                alt=""
                style={{ width: "auto", height: "30px", marginRight: "10px" }}
              />
              <Paragraph>{props.hub_user.name}</Paragraph>
            </div>
          </>
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
                {t("common.impersonate")}
              </Button>
            </div>
          </>
        ) : (
          <NavLink to={`/gallery/${ACCOUNT_TYPE.PARTNER}/${props.id}`}>
            <div className="gallery-button">
              <Button type="primary">{t("gallery.viewProfile")}</Button>
            </div>
          </NavLink>
        )}
      </div>
    </div>
  );
}

export default PartnerCard;
