import React, { useEffect, useState } from "react";
import { UserOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import { Form, Input, Avatar, Switch, Button } from "antd";
import { getMentorID } from "utils/auth.service";
import ProfileContent from "../ProfileContent";

import "../css/MenteeButton.scss";
import "../css/Profile.scss";
import { fetchMentorByID, editMentorProfile } from "utils/apiHelper";

function Profile() {
  const [mentor, setMentor] = useState({});
  const [onEdit, setEditing] = useState(false);
  const [editedMentor, setEditedMentor] = useState(false);
  const [form] = Form.useForm();

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

  const validateMessages = {
    types: {
      email: "Please input a valid email!",
      number: "Please input a valid phone number!",
    },
  };

  const onFinish = (values) => {
    async function saveEdits() {
      const new_values = { ...values, phone_number: values.phone };
      await editMentorProfile(new_values, getMentorID());
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
          email: mentor.email,
          phone: mentor.phone_number,
          email_notifications: mentor.email_notifications,
          text_notifications: mentor.text_notifications,
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
                  defaultChecked={mentor.email_notifications}
                />
              </Form.Item>
            </div>
            <div className="modal-mentee-availability-switch">
              <div className="modal-mentee-availability-switch-text">
                Text notifications
              </div>
              <Form.Item name="text_notifications">
                <Switch
                  size="small"
                  defaultChecked={mentor.text_notifications}
                />
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
