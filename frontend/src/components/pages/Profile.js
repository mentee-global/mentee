import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { UserOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import { Form, Input, Avatar, Switch, Button } from "antd";
import {
  getMentorID,
  getMenteeID,
  logout,
  getCurrentUser,
} from "utils/auth.service";
import useAuth from "utils/hooks/useAuth";
import ProfileContent from "../ProfileContent";
import { ACCOUNT_TYPE } from "utils/consts";

import "../css/MenteeButton.scss";
import "../css/Profile.scss";
import {
  fetchMentorByID,
  editMentorProfile,
  fetchMenteeByID,
  editMenteeProfile,
  EditFavMentorById,
} from "utils/api";

function Profile() {
  const history = useHistory();
  const [user, setUser] = useState({});
  const [onEdit, setEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(false);

  const [form] = Form.useForm();
  
  const { onAuthStateChanged, isMentor, profileId, isMentee } = useAuth();

  useEffect(() => {
    onAuthStateChanged(fetchUser);
  }, []);

  useEffect(() => {
    fetchUser();
  }, [editedUser]);

  const fetchUser = async () => {
    const mentorID = await getMentorID();
    if (mentorID) {
      const mentorData = await fetchMentorByID(mentorID);

      if (mentorData) {
        setUser(mentorData);
      }
    } else {
      const menteeID = await getMenteeID();
      const menteeData = await fetchMenteeByID(menteeID);

      if (menteeData) {
        setUser(menteeData);
      }
    }
  };
  

  const handleSaveEdits = () => {
    setEditedUser(!editedUser);
  };

  function renderContactInfo() {
    return (
      <div>
        {user.email && (
          <div>
            <MailOutlined className="mentor-profile-contact-icon" />
            {user.email}
            <br />
          </div>
        )}
        {user.phone_number && (
          <div>
            <PhoneOutlined className="mentor-profile-contact-icon" />
            {user.phone_number}
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

  const validateMessages = {
    types: {
      email: "Please input a valid email!",
      number: "Please input a valid phone number!",
    },
  };

  const onFinish = (values) => {
    async function saveEdits() {
      const new_values = { ...values, phone_number: values.phone };
      if (isMentor) {
        await editMentorProfile(new_values, await getMentorID());
      } else {
        await editMenteeProfile(new_values, await getMentorID());
      }
      handleSaveEdits();
    }

    setEditing(false);
    saveEdits();
  };

  function renderEditInfo() {
    return (
      <Form
        form={form}
        name="nest-messages"
        layout="inline"
        onFinish={onFinish}
        validateMessages={validateMessages}
        initialValues={{
          email: user.email,
          phone: user.phone_number,
          email_notifications: user.email_notifications,
          text_notifications: user.text_notifications,
        }}
      >
        <div className="mentor-profile-input">
          <MailOutlined className="mentor-profile-contact-icon" />
          <Form.Item
            name="email"
            rules={[
              {
                type: "email",
              },
            ]}
          >
            <Input />
          </Form.Item>
        </div>
        <div className="mentor-profile-input">
          <PhoneOutlined className="mentor-profile-contact-icon" />
          <Form.Item
            name="phone"
            rules={[
              {
                min: 10,
              },
            ]}
          >
            <Input />
          </Form.Item>
        </div>
        <div className="mentor-profile-editing-footer">
          <div className="mentor-profile-notifications-container">
            <div className="modal-mentee-availability-switch">
              <div className="modal-mentee-availability-switch-text">
                Email notifications
              </div>
              <Form.Item name="email_notifications">
                <Switch
                  size="small"
                  defaultChecked={user.email_notifications}
                />
              </Form.Item>
            </div>
            <div className="modal-mentee-availability-switch">
              <div className="modal-mentee-availability-switch-text">
                Text notifications
              </div>
              <Form.Item name="text_notifications">
                <Switch size="small" defaultChecked={user.text_notifications} />
              </Form.Item>
            </div>
          </div>
          <div className="mentor-profile-save-container">
            <Form.Item>
              <Button className="regular-button" htmlType="submit">
                Save
              </Button>
            </Form.Item>
          </div>
        </div>
      </Form>
    );
  }

  return (
    <div className="background-color-strip">
      <div className="mentor-profile-content">
        <Avatar
          size={120}
          src={user.image && user.image.url}
          icon={<UserOutlined />}
        />
        <div className="mentor-profile-content-flexbox">
          <div className="mentor-profile-info">
            <ProfileContent
              mentor={user}
              isMentor={isMentor}
              accountType={isMentor && ACCOUNT_TYPE.MENTOR}
              handleSaveEdits={handleSaveEdits}
              showEditBtn={
                user && user._id && profileId && profileId === user._id["$oid"]
              }
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
