import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { UserOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import { Form, Input, Avatar, Switch, Button, Spin } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchUser } from "features/userSlice";
import { useAuth } from "utils/hooks/useAuth";
import ProfileContent from "../ProfileContent";

import "../css/MenteeButton.scss";
import "../css/Profile.scss";
import {
  editMentorProfile,
  editMenteeProfile,
  editPartnerProfile,
} from "utils/api";

function Profile() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const [onEdit, setEditing] = useState(false);

  const [form] = Form.useForm();

  const { onAuthStateChanged, isMentor, profileId, isMentee, role, isPartner } =
    useAuth();

  const handleSaveEdits = () => {
    dispatch(fetchUser({ id: profileId, role }));
  };

  useEffect(() => {
    async function addTakingAppointments() {
      if (isMentor && user?.taking_appointments === undefined) {
        const new_user = { ...user, taking_appointments: false };
        await editMentorProfile(new_user, profileId);
        handleSaveEdits();
      }
    }
    addTakingAppointments();
  }, [user]);

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
        {user.phone_number && !isPartner && (
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
          {t("profile.edit")}
        </a>
      </div>
    );
  }

  const validateMessages = {
    types: {
      email: t("profile.validateEmail"),
      number: t("profile.validatePhone"),
    },
  };

  const onFinish = (values) => {
    async function saveEdits() {
      const newValues = { ...values, phone_number: values.phone };
      if (isMentor) {
        await editMentorProfile(newValues, profileId);
      } else if (isMentee) {
        await editMenteeProfile(newValues, profileId);
      } else if (isPartner) {
        await editPartnerProfile(newValues, profileId);
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
        {!isPartner && (
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
        )}

        <div className="mentor-profile-editing-footer">
          <div className="mentor-profile-notifications-container">
            <div className="modal-mentee-availability-switch">
              <div className="modal-mentee-availability-switch-text">
                {t("profile.emailNotifications")}
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
                {t("profile.textNotifications")}
              </div>
              <Form.Item name="text_notifications">
                <Switch size="small" defaultChecked={user.text_notifications} />
              </Form.Item>
            </div>
          </div>
          <div className="mentor-profile-save-container">
            <Form.Item>
              <Button className="regular-button" htmlType="submit">
                {t("common.save")}
              </Button>
            </Form.Item>
          </div>
        </div>
      </Form>
    );
  }

  return (
    <>
      {!user ? (
        <div className="profile-loading">
          <Spin size="large" />
        </div>
      ) : (
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
                  accountType={parseInt(role)}
                  account={user}
                  handleSaveEdits={handleSaveEdits}
                  showEditBtn={
                    user &&
                    user._id &&
                    profileId &&
                    profileId === user._id["$oid"]
                  }
                />
              </div>
              <fieldset className="mentor-profile-contact">
                <legend className="mentor-profile-contact-header">
                  {t("profile.contactInfo")}
                </legend>
                {onEdit ? renderEditInfo() : renderContactInfo()}
              </fieldset>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Profile;
