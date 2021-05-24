import React, { useState } from "react";
import {
  EnvironmentOutlined,
  CommentOutlined,
  LinkOutlined,
  LinkedinOutlined,
  LockFilled,
} from "@ant-design/icons";
import { formatLinkForHref } from "utils/misc";
import MentorProfileModal from "./MentorProfileModal";
import MenteeProfileModal from "./MenteeProfileModal";
import "./css/Profile.scss";

function ProfileContent(props) {
  const getTitle = (name, age) => {
    if (props.isMentor) {
      return name;
    } else {
      return name + ", " + age;
    }
  }

  const getPrivacy = (privacy) => {
    if (privacy) {
      return <LockFilled></LockFilled>
    }
  }
  const getLanguages = (languages) => {
    return languages.join(" • ");
  };

  const getSpecializationTags = (specializations) => {
    return specializations.map((specialization, idx) => (
      <div className="mentor-specialization-tag">{specialization}</div>
    ));
  };

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
  };

  return (
    <div>
      <div className="mentor-profile-name">
        {getTitle(props.mentor.name, props.mentor.age)}
        {getPrivacy(props.mentor.privacy)}
        {props.isMentor ? (
          <div className="mentor-profile-button">
            <MentorProfileModal
              mentor={props.mentor}
              onSave={props.handleSaveEdits}
            />
          </div>
        ) : (
          <div className="mentor-profile-button">
            <MenteeProfileModal
              mentee={props.mentor}
              onSave={props.handleSaveEdits}
            />
          </div>
        )}
      </div>
      <div>
        {props.mentor.location && (
          <span>
            <EnvironmentOutlined className="mentor-profile-tag-first" />
            {props.mentor.location}
          </span>
        )}
        {props.mentor.languages && props.mentor.languages.length > 0 && (
          <span>
            <CommentOutlined
              className={
                !props.mentor.location
                  ? "mentor-profile-tag-first"
                  : "mentor-profile-tag"
              }
            />
            {getLanguages(props.mentor.languages || [])}
          </span>
        )}
        {props.mentor.website && (
          <span>
            <LinkOutlined className="mentor-profile-tag" />
            <a
              href={formatLinkForHref(props.mentor.website)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {props.mentor.website}
            </a>
          </span>
        )}
        {props.mentor.linkedin && (
          <span>
            <LinkedinOutlined className="mentor-profile-tag" />
            <a
              href={formatLinkForHref(props.mentor.linkedin)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {props.mentor.linkedin}
            </a>
          </span>
        )}
      </div>
      <br />
      <div className="mentor-profile-heading">
        <b>About</b>
      </div>
      <div className="mentor-profile-about">{props.mentor.biography}</div>
      <br />
      {getSpecializations(props.isMentor)}
      <br />
      <div className="mentor-profile-heading">
        <b>Education</b>
      </div>
      <div>{getEducations(props.mentor.education)}</div>
    </div>
  );
}

export default ProfileContent;
