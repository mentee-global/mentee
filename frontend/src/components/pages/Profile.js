import React, { useEffect, useState } from "react";
import { UserOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import { Input, Avatar, Switch, Button } from "antd";
import { getMentorID } from "utils/auth.service";
import ProfileContent from "../ProfileContent";
import MenteeButton from "../MenteeButton";

import "../css/Profile.scss";
import { fetchMentorByID } from "utils/api";

function Profile() {
  const [mentor, setMentor] = useState({});
  const [onEdit, setEditing] = useState(false);
  const [editedMentor, setEditedMentor] = useState(false);

  useEffect(() => {
    const mentorID = getMentorID();
    async function getMentor() {
      const mentorData = await fetchMentorByID(mentorID);
      if (mentorData) {
        console.log(mentorData);
        setMentor(mentorData);
      }
    }
    getMentor();
  }, [editedMentor]);

  const handleSaveEdits = () => {
    setEditedMentor(!editedMentor);
  };

  function renderContactInfo() {
    return (
      <div>
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
        <a
          href="#"
          onClick={() => setEditing(true)}
          className="mentor-profile-contact-edit"
        >
          Edit
        </a>
      </div>
    );
  }

  function renderEditInfo() {
    return (
      <div>
        <div className="mentor-profile-input">
          <MailOutlined className="mentor-profile-contact-icon" />
          <Input defaultValue={mentor.email} />
        </div>
        <div className="mentor-profile-input">
          <PhoneOutlined className="mentor-profile-contact-icon" />
          <Input defaultValue={mentor.phone_number} />
        </div>
        <div className="mentor-profile-editing-footer">
          <div className="mentor-profile-notifications-container">
            <div className="modal-mentee-availability-switch">
              <div className="modal-mentee-availability-switch-text">
                Email notifications
              </div>
              <Switch size="small" />
            </div>
            <div className="modal-mentee-availability-switch">
              <div className="modal-mentee-availability-switch-text">
                Text notifications
              </div>
              <Switch size="small" />
            </div>
          </div>
          <div className="mentor-profile-save-container">
            <MenteeButton onClick={() => setEditing(false)} content="Save" />
          </div>
        </div>
      </div>
    );
  }

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
            {onEdit ? renderEditInfo() : renderContactInfo()}
          </fieldset>
        </div>
      </div>
    </div>
  );
}

export default Profile;
