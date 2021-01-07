import React, { useEffect, useState } from "react";
import { UserOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import { Form, Input, Avatar, Switch, Button } from "antd";
import { getMentorID } from "utils/auth.service";
import ProfileContent from "../ProfileContent";

import "../css/MenteeButton.scss";
import "../css/Profile.scss";
import { fetchMentorByID } from "utils/api";

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
    return (<div>
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
      <a href="#" onClick={() => setEditing(true)} className="mentor-profile-contact-edit">
        Edit
      </a>
    </div>);
  }
  const validateMessages = {
    required: '${label} is required!',
    types: {
      email: '${label} is not a valid email!',
      number: '${label} is not a valid number!',
    },
  };

  const onFinish = (values) => {
    setEditing(false);
    console.log(values);
  };

  function renderEditInfo() {
    // Setting initial values with custom components
    form.setFieldsValue({
      email: mentor.email
    });

    return (<Form form={form}
      name="nest-messages" onFinish={onFinish} validateMessages={validateMessages} initialValues={{ email: "oogabooga" }}>
      <Form.Item
        name="email"
        rules={[
          {
            required: true,
            type: 'email',
          },
        ]}
      >
        <div className="mentor-profile-input">
          <MailOutlined className="mentor-profile-contact-icon" />
          <Input />
        </div>
      </Form.Item>
      <Form.Item
        name="phone_number"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <div className="mentor-profile-input">
          <PhoneOutlined className="mentor-profile-contact-icon" />
          <Input defaultValue={mentor.phone_number} />
        </div>
      </Form.Item>
      <Form.Item
        name="email_notifications"
      >
        <div className="modal-mentee-availability-switch">
          <div className="modal-mentee-availability-switch-text">
            Email notifications
                    </div>
          <Switch
            size="small"
          />
        </div>
      </Form.Item>
      <Form.Item name="text_notifications">
        <div className="modal-mentee-availability-switch">
          <div className="modal-mentee-availability-switch-text">
            Text notifications
          </div>
          <Switch
            size="small"
          />
        </div>
      </Form.Item>
      <Form.Item>
        <Button
          className="regular-button"
          htmlType="submit"
        >
          Save
    </Button>
      </Form.Item>
    </Form>);
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
