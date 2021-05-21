import React from "react";
import { useHistory } from "react-router-dom";
import { Avatar } from "antd";
import { UserOutlined, HeartFilled } from "@ant-design/icons";

import MenteeButton from "./MenteeButton";
import { MENTOR_PROFILE } from "utils/consts";
import BookmarkImage from "resources/AddBookmarkMentor.svg";
import "components/css/MenteeAppointments.scss";

function BookmarkSidebar({ bookmarks, unfavorite }) {
  const history = useHistory();

  const redirectToProfile = (mentorId) => {
    history.push(`${MENTOR_PROFILE}/${mentorId}`);
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
        <HeartFilled /> Favorite Contacts
      </div>
      <div className="mentee-bookmark-display">
        {bookmarks.map((mentor) => (
          <div className="mentee-bookmark-card">
            <Avatar
              src={mentor.image && mentor.image.url}
              icon={<UserOutlined />}
              size={30}
              style={{ minWidth: "30px" }}
            />
            <div className="mentee-bookmark-mentor-info">
              <HeartFilled
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
      </div>
    </div>
  );
}

export default BookmarkSidebar;
