import React from "react";
import { useHistory } from "react-router-dom";
import { Avatar, Spin, theme } from "antd";
import { UserOutlined, StarFilled } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import MenteeButton from "./MenteeButton";
import BookmarkImage from "resources/AddBookmarkMentor.svg";
import "components/css/MenteeAppointments.scss";
import { css } from "@emotion/css";

function BookmarkSidebar({ bookmarks, unfavorite, isLoading }) {
  const {
    token: { colorPrimaryBg, colorPrimary },
  } = theme.useToken();
  const history = useHistory();
  const { t } = useTranslation();

  const redirectToProfile = (mentorId) => {
    history.push(`/gallery/1/${mentorId}`);
  };

  return (
    <div
      className={css`
        width: 30%;
        max-width: 400px;
        height: fit-content;
        background-color: ${colorPrimaryBg};
        border-radius: 7px;
        margin: 2.5em 2em 4em 0;

        @media only screen and (max-width: 768px) {
          width: 98%;
          margin: 0;
          margin-left: 1%;
          max-width: none;
        }
      `}
    >
      <div
        className={css`
          display: flex;
          flex-direction: column;
          padding: 10% 27.5%;
          border-bottom: 0.5px solid ${colorPrimary};
          align-items: center;
        `}
      >
        <img src={BookmarkImage} />
        <MenteeButton
          content={t("bookmarkSidebar.addMentors")}
          radius="6px"
          style={{ minWidth: "fit-content" }}
          onClick={() => history.push("/gallery")}
        />
      </div>
      <div
        className={css`
          margin: 1em 1.5em;
          font-size: 1.25em;
          font-weight: bold;
          span {
            color: ${colorPrimary};
          }
        `}
      >
        <StarFilled /> {t("bookmarkSidebar.favoriteContacts")}
      </div>
      <div
        className={css`
          margin: 0 1.5em 3em 1.5em;
          padding-top: 4px;
          background: #ffffff;
          border: 0.5px solid #e4bb4f;
          box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
          border-radius: 8px;
          min-height: 4em;
        `}
      >
        <Spin spinning={isLoading} className="bookmark-spin">
          <div className="no-favorites-text">
            {!isLoading && bookmarks && !bookmarks.length ? (
              <>{t("bookmarkSidebar.noFavorites")}</>
            ) : null}
          </div>
          {bookmarks.map((mentor) => (
            <div
              className={css`
                display: flex;
                align-items: center;
                box-shadow: 14px 24px 3px -24px ${colorPrimaryBg};
                padding: 10px 5px 10px 5px;
              `}
            >
              <Avatar
                src={mentor.image && mentor.image.url}
                icon={<UserOutlined />}
                size={30}
                style={{ minWidth: "30px" }}
              />
              <div className="mentee-bookmark-mentor-info">
                <StarFilled
                  className={css`
                    float: right;
                    margin: 0.5em 0.5em 0 0;
                    color: ${colorPrimary};
                  `}
                  onClick={() => unfavorite(mentor.id, mentor.name)}
                />
                <div>
                  <div
                    className="mentee-bookmark-mentor-name"
                    onClick={() => redirectToProfile(mentor.id)}
                  >
                    {mentor.name}
                  </div>
                  <div className="mentee-bookmark-mentor-title">
                    {mentor.professional_title}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Spin>
      </div>
    </div>
  );
}

export default BookmarkSidebar;
