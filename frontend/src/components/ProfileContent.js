import React, { useState, useEffect } from "react";
import {
  EnvironmentOutlined,
  CommentOutlined,
  LinkOutlined,
  LinkedinOutlined,
} from "@ant-design/icons";

import MenteeButton from "components/MenteeButton";
import { formatLinkForHref } from "utils/misc";
import { ACCOUNT_TYPE } from "utils/consts";
import MentorProfileModal from "./MentorProfileModal";
import MenteeAppointmentModal from "./MenteeAppointmentModal";
import useAuth from "utils/hooks/useAuth";

import "./css/Profile.scss";

const getMeetingMethods = (account) => {
  const in_person = account.offers_in_person ? "In person | Online" : "Online";
  const group_session = account.offers_group_appointments
    ? "Group Meetings | 1-on-1"
    : "1-on-1";
  return in_person + " | " + group_session;
};

const getLanguages = (languages) => {
  return languages.join(" • ");
};

const getSpecializationTags = (specializations) => {
  return specializations.map((specialization, idx) => (
    <div className="mentor-specialization-tag">{specialization}</div>
  ));
};

const getEducations = (educations) => {
  if (!educations || !educations[0]) {
    return;
  }
  return educations.map((education) => (
    <>
      {education.majors.map((major) => (
        <div className="mentor-profile-education">
          <b>{education.school}</b>
          <br />
          {education.education_level}, {major}
          <br />
          <t className="mentor-profile-heading">{education.graduation_year}</t>
        </div>
      ))}
    </>
  ));
};

function ProfileContent(props) {
  const { account, id, handleUpdateAccount, accountType } = props;
  const { profileId } = useAuth();
  const [mentorPublic, setMentorPublic] = useState(false);

  useEffect(() => {
    setMentorPublic(accountType == ACCOUNT_TYPE.MENTOR || props.isMentor);
  }, [accountType]);

  const getProfileButton = () => {
    if (props.isMentor)
      return (
        <MentorProfileModal mentor={account} onSave={props.handleSaveEdits} />
      );

    if (accountType == ACCOUNT_TYPE.MENTOR)
      return (
        <MenteeAppointmentModal
          mentor_name={account.name}
          availability={account.availability}
          mentor_id={id}
          mentee_id={profileId}
          handleUpdateMentor={handleUpdateAccount}
        />
      );
    // Mentee public profile
    else
      return (
        <MenteeButton style={{ fontWeight: "bold" }} content="Send Message" />
      );
  };

  return (
    <div>
      <div className="mentor-profile-name">
        {account.name}
        <div className="mentor-profile-button">{getProfileButton()}</div>
      </div>
      <div className="mentor-profile-heading">
        {mentorPublic ? account.professional_title : account.gender}{" "}
        <t className="yellow-dot">•</t>{" "}
        {mentorPublic ? getMeetingMethods(account) : account.organization}
      </div>
      <div>
        {account.location && (
          <span>
            <EnvironmentOutlined className="mentor-profile-tag-first" />
            {account.location}
          </span>
        )}
        {account.languages && account.languages.length > 0 && (
          <span>
            <CommentOutlined
              className={
                !account.location
                  ? "mentor-profile-tag-first"
                  : "mentor-profile-tag"
              }
            />
            {getLanguages(account.languages || [])}
          </span>
        )}
        {account.website && (
          <span>
            <LinkOutlined className="mentor-profile-tag" />
            <a
              href={formatLinkForHref(account.website)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {account.website}
            </a>
          </span>
        )}
        {account.linkedin && (
          <span>
            <LinkedinOutlined className="mentor-profile-tag" />
            <a
              href={formatLinkForHref(account.linkedin)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {account.linkedin}
            </a>
          </span>
        )}
      </div>
      <br />
      <div className="mentor-profile-heading">
        <b>About</b>
      </div>
      <div className="mentor-profile-about">{account.biography}</div>
      <br />
      {mentorPublic && (
        <>
          <div className="mentor-profile-heading">
            <b>Specializations</b>
          </div>
          <div>{getSpecializationTags(account.specializations || [])}</div>
          <br />
        </>
      )}
      <div className="mentor-profile-heading">
        <b>Education</b>
      </div>
      <div>{getEducations(account.education)}</div>
    </div>
  );
}

export default ProfileContent;
