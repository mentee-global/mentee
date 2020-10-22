import React from "react";
import { Link } from "react-router-dom";
import {
  UserOutlined,
  EnvironmentOutlined,
  CommentOutlined,
  LinkOutlined,
  LinkedinOutlined,
} from "@ant-design/icons";

import "../css/Profile.scss";

function Profile() {
  return (
    <div className="background-color-strip">
      <div className="mentor-profile-content">
        <UserOutlined style={{ fontSize: "100px" }} />
        <div className="mentor-profile-content-flexbox">
          <div className="mentor-profile-info">
            <div className="mentor-profile-name">Mentor Name</div>
            <div className="mentor-profile-heading">
              Title <t className="yellow-dot">•</t> Meetings[0] | Meetings[1]
            </div>
            <div>
              <span>
                <EnvironmentOutlined className="mentor-profile-tag-first" />
                Location
              </span>
              <span>
                <CommentOutlined className="mentor-profile-tag" />
                Language[0] • Language[1]
              </span>
              <span>
                <LinkOutlined className="mentor-profile-tag" />
                website.com
              </span>
              <span>
                <LinkedinOutlined className="mentor-profile-tag" />
                LinkedIn
              </span>
            </div>
            <br />
            <div className="mentor-profile-heading">
              <b>About</b>
            </div>
            <div>About text</div>
            <br />
            <div className="mentor-profile-heading">
              <b>Specializations</b>
            </div>
            <div>Tags tags tags</div>
            <br />
            <div className="mentor-profile-heading">
              <b>Education</b>
            </div>
            <div>Education list</div>
          </div>
          <div className="mentor-profile-contact">
            <div className="mentor-profile-contact-header">Contact Info</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
