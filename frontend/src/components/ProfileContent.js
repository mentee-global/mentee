import React, { useState, useEffect } from "react";
import {
  EnvironmentOutlined,
  CommentOutlined,
  LinkOutlined,
  LinkedinOutlined,
} from "@ant-design/icons";

import PublicMessageModal from "components/PublicMessageModal";
import { formatLinkForHref } from "utils/misc";
import { ACCOUNT_TYPE } from "utils/consts";
import MentorProfileModal from "./MentorProfileModal";
import MenteeProfileModal from "./MenteeProfileModal";
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

const getEducations = (educations = []) => {
  if (!educations || !educations.length) {
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
  const { profileId, isMentor } = useAuth();
  const [mentorPublic, setMentorPublic] = useState(false);

  useEffect(() => {
    setMentorPublic(accountType == ACCOUNT_TYPE.MENTOR || props.isMentor);
  }, [accountType]);

  const getProfileButton = () => {
    // In editable profile page
    if (isMentor && !accountType)
      return (
        <MentorProfileModal mentor={account} onSave={props.handleSaveEdits} />
      );

  const getSpecializations = (isMentor) => {
    if (isMentor) {
      return (
        <div>
          <div className="mentor-profile-heading">
            <b>Specializations</b>
          </div>
          <div>{getSpecializationTags(props.mentor.specializations || [])}</div>
        </div>
      );
    } else {
      console.log("afwo;eijflk")
    }
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
            <t className="mentor-profile-heading">
              {education.graduation_year}
            </t>
          </div>
        ))}
      </>
    ));
    // In public mentor profile
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
        <PublicMessageModal
          menteeName={account.name}
          menteeID={id}
          mentorID={profileId}
        />
      );
  };

  return (
    <div>
      <div className="mentor-profile-name">
        {props.mentor.name}
        {props.isMentor ? (
          <div className="mentor-profile-button">
            <MentorProfileModal
              mentor={props.mentor}
              onSave={props.handleSaveEdits}
            />
          </div>
        ) : (
          <div>
            <div className="mentor-profile-button">
              <MenteeProfileModal
                mentee={props.mentor}
                onSave={props.handleSaveEdits}
              />
            </div>
            <div className="mentor-profile-button">
              <MenteeAppointmentModal
                mentor_name={props.mentor.name}
                availability={props.mentor.availability}
                mentor_id={props.id}
                handleUpdateMentor={props.handleUpdateMentor}
              />
            </div>
          </div>
        )}
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
<<<<<<< HEAD
      <div className="mentor-profile-about">{props.mentor.biography}</div>
      <br />
      {getSpecializations(props.isMentor)}
=======
      <div className="mentor-profile-about">{account.biography}</div>
>>>>>>> 41d138dd52ff5f16bde5be296cf88ffa4a58db8d
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
