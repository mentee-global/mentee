import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { UserOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import { Avatar } from "antd";
import { getMentorID } from "utils/auth.service";
import ProfileContent from "../ProfileContent";

import "../css/Profile.scss";
import { fetchMentorByID } from "utils/api";

function Profile() {
  const [mentor, setMentor] = useState({});
  const [editedMentor, setEditedMentor] = useState(false);

  useEffect(() => {
    const mentorID = getMentorID();
    async function getMentor() {
      const mentorData = await fetchMentorByID(mentorID);
      if (mentorData) {
        setMentor(mentorData);
      }
    }
    getMentor();
  }, [editedMentor]);

  const handleSaveEdits = () => {
    setEditedMentor(!editedMentor);
  };

  return (
    <div className="background-color-strip">
      <div className="mentor-profile-content">
        <Avatar
          size={120}
          src={mentor.image && mentor.image.url}
          icon={<UserOutlined />}
        />
        <div className="mentor-profile-content-flexbox">
          <div className="mentor-profile-info">
            <ProfileContent
              mentor={mentor}
              isMentor={true}
              handleSaveEdits={handleSaveEdits}
            />
          </div>
          <fieldset className="mentor-profile-contact">
            <legend className="mentor-profile-contact-header">
              Contact Info
            </legend>
            {mentor.email && (
              <div>
                <MailOutlined className="mentor-profile-contact-icon" />
                {mentor.email}
                <br />
              </div>
            )}
            {mentor.phone_number && (
              <div>
                <PhoneOutlined className="mentor-profile-contact-icon" />
                {mentor.phone_number}
                <br />
              </div>
            )}
            <br />
            <NavLink to="/" className="mentor-profile-contact-edit">
              Edit
            </NavLink>
          </fieldset>
        </div>
      </div>
    </div>
  );
}

export default Profile;
