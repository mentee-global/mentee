import React, { useState, useEffect } from "react";
import { Button, Drawer, Modal, Result, Typography } from "antd";
import MenteeButton from "./MenteeButton";
import {
  editAccountProfile,
  editMenteeProfile,
  uploadAccountImage,
  uploadMenteeImage,
} from "../utils/api";
import { useTranslation } from "react-i18next";
import MentorProfileForm from "./pages/MentorProfileForm";
import { getProfileId } from "utils/auth.service";
import { css } from "@emotion/css";
import { useMediaQuery } from "react-responsive";
import { ACCOUNT_TYPE } from "utils/consts";
import MenteeProfileForm from "./pages/MenteeProfileForm";
import PartnerProfileForm from "./PartnerProfileForm";

function EditProfileModal({ profileData, onSave, role }) {
  const profileId = getProfileId();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [saving, setSaving] = useState(false);
  const email = profileData.email;

  const getProfileForm = () => {
    switch (role) {
      case ACCOUNT_TYPE.MENTOR:
        return (
          <MentorProfileForm
            email={email}
            onSubmit={onSubmit}
            loading={saving}
            profileData={profileData}
          />
        );
      case ACCOUNT_TYPE.MENTEE:
        return (
          <MenteeProfileForm
            email={email}
            onSubmit={onSubmit}
            loading={saving}
            profileData={profileData}
          />
        );
      case ACCOUNT_TYPE.PARTNER:
        return (
          <PartnerProfileForm
            role={ACCOUNT_TYPE.PARTNER}
            email={email}
            onSubmit={onSubmit}
            loading={saving}
            profileData={profileData}
          />
        );
      default:
        return (
          <Result
            status="error"
            title="Could not get this role's profile form"
          />
        );
    }
  };

  const onSubmit = async (newData) => {
    setSaving(true);
    if (!newData.edited) {
      setOpen(false);
      setSaving(false);
      return;
    }

    const menteeID = profileId;
    await editAccountProfile(newData, menteeID, role);

    if (newData.changedImage) {
      await uploadAccountImage(newData.image, menteeID, role);
    }

    onSave();
    setSaving(false);
    setOpen(false);
  };

  return (
    <span>
      <span className="mentor-profile-button">
        <Button onClick={() => setOpen(true)} type="primary">
          {t("commonProfile.editProfile")}
        </Button>
      </span>
      {isMobile ? (
        <Drawer
          title={t("commonProfile.editProfile")}
          width={"100%"}
          open={open}
          onClose={() => {
            setOpen(false);
          }}
          children={getProfileForm()}
        />
      ) : (
        <Modal
          title={
            <Typography.Title
              level={3}
              className={css`
                margin-top: 0px;
              `}
            >
              {t("commonProfile.editProfile")}
            </Typography.Title>
          }
          open={open}
          onCancel={() => {
            setOpen(false);
          }}
          width={800}
          footer={null}
          children={getProfileForm()}
        />
      )}
    </span>
  );
}

export default EditProfileModal;
