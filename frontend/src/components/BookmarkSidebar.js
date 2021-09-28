import React from "react";
import { useHistory } from "react-router-dom";
import { Avatar, Spin } from "antd";
import { UserOutlined, StarFilled } from "@ant-design/icons";

import MenteeButton from "./MenteeButton";
import BookmarkImage from "resources/AddBookmarkMentor.svg";
import "components/css/MenteeAppointments.scss";

function BookmarkSidebar({ bookmarks, unfavorite }) {
  const history = useHistory();

  const redirectToProfile = (mentorId) => {
    history.push(`/gallery/1/${mentorId}`);
  };

  return (
    <div className="mentee-bookmark-section">
      <div className="mentee-bookmark-add">
        <img src={BookmarkImage} />
        <MenteeButton
          content="Add Mentors +"
          radius="6px"
          onClick={() => history.push("/gallery")}
        />
      </div>
      <div className="mentee-bookmark-header">
        <StarFilled /> Favorite Contacts
      </div>
      <div className="mentee-bookmark-display">
        <Spin
          spinning={!bookmarks || !bookmarks.length}
          className="bookmark-spin"
        >
          {bookmarks.map((mentor) => (
            <div className="mentee-bookmark-card">
              <Avatar
                src={mentor.image && mentor.image.url}
                icon={<UserOutlined />}
                size={30}
                style={{ minWidth: "30px" }}
              />
              <div className="mentee-bookmark-mentor-info">
                <StarFilled
                  className="bookmark-heart"
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
