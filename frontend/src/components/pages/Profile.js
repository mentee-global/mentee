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
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();

  const { onAuthStateChanged, isMentor, profileId, isMentee, role, isPartner } =
    useAuth();

  const handleSaveEdits = () => {
    dispatch(fetchUser({ id: profileId, role }));
  };

  async function changePausedFlag(value) {
    setLoading(true);
    let edited_data = { ...user, paused_flag: value };
    await editMentorProfile(edited_data, profileId);
    handleSaveEdits();
    setLoading(false);
  }

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

    saveEdits();
  };

  function renderEditInfo() {
    return (
      <Form
        form={form}
        name="nest-messages"
        layout="vertical"
        onFinish={onFinish}
        validateMessages={validateMessages}
        initialValues={{
          email: user.email,
          phone: user.phone_number,
          email_notifications: user.email_notifications,
          text_notifications: user.text_notifications,
        }}
        className="profile-contact-form"
      >
        <div className="mentor-profile-input">
          <MailOutlined className="mentor-profile-contact-icon" />
          <Form.Item
            name="email"
            rules={[{ type: "email" }]}
            className="profile-contact-field"
          >
            <Input placeholder={t("common.email")} />
          </Form.Item>
        </div>
        {!isPartner && (
          <div className="mentor-profile-input">
            <PhoneOutlined className="mentor-profile-contact-icon" />
            <Form.Item
              name="phone"
              rules={[{ min: 10 }]}
              className="profile-contact-field"
            >
              <Input placeholder={t("common.phoneNumber")} />
            </Form.Item>
          </div>
        )}

        <div className="mentor-profile-editing-footer">
          <div className="mentor-profile-notifications-container">
            <div className="modal-mentee-availability-switch">
              <div className="modal-mentee-availability-switch-text">
                {t("profile.emailNotifications")}
              </div>
              <Form.Item name="email_notifications" valuePropName="checked">
                <Switch size="small" />
              </Form.Item>
            </div>
            <div className="modal-mentee-availability-switch">
              <div className="modal-mentee-availability-switch-text">
                {t("profile.textNotifications")}
              </div>
              <Form.Item name="text_notifications" valuePropName="checked">
                <Switch size="small" />
              </Form.Item>
            </div>
          </div>
          <div className="mentor-profile-save-container">
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
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
      {!user || loading ? (
        <div className="profile-loading">
          <Spin size="large" />
        </div>
      ) : (
        <div className="background-color-strip">
          <div className="mentor-profile-content">
            <div className="profile-header-card">
              <Avatar
                className="profile-header-avatar"
                size={120}
                src={user.image && user.image.url}
                icon={<UserOutlined />}
              />
              {isMentor && (
                <div className="profile-header-pause">
                  <Switch
                    size="small"
                    checked={user.paused_flag}
                    onChange={(e) => changePausedFlag(e)}
                  />
                  <label className="profile-header-pause-label">Paused</label>
                </div>
              )}
            </div>
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
              <div className="mentor-profile-contact">
                <div className="mentor-profile-contact-header">
                  {t("profile.contactInfo")}
                </div>
                {renderEditInfo()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Profile;
