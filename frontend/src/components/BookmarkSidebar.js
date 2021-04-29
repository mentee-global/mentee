import React from "react";
import { Avatar } from "antd";
import { UserOutlined, HeartFilled } from "@ant-design/icons";

import MenteeButton from "./MenteeButton";
import BookmarkImage from "resources/AddBookmarkMentor.svg";

function BookmarkSidebar({ bookmarks }) {
  return (
    <div className="mentee-bookmark-section">
      <div className="mentee-bookmark-add">
        <img src={BookmarkImage} />
        <MenteeButton content="Add Mentors +" radius="6px" />
      </div>
      <div className="mentee-bookmark-header">
        <HeartFilled /> Favorite Contacts
      </div>
      <div className="mentee-bookmark-display">
        {bookmarks.map((mentor) => (
          <div className="mentee-bookmark-card">
            <Avatar
              src={mentor && mentor.image.url}
              icon={<UserOutlined />}
              size={30}
              style={{ minWidth: "30px" }}
            />
            <div className="mentee-bookmark-mentor-info">
              <HeartFilled className="bookmark-heart" />
              <div>
                <div className="mentee-bookmark-mentor-name">{mentor.name}</div>
                <div className="mentee-bookmark-mentor-title">
                  {mentor.title}
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
