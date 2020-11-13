import React from "react";
import {
  EnvironmentOutlined,
  CommentOutlined,
  LinkOutlined,
  LinkedinOutlined,
} from "@ant-design/icons";
import { Button } from "antd";

const profileButtonStyle = { background: "#E4BB4F", color: "white" };

function ProfileContent(props) {
  const getMeetingMethods = () => {
    const in_person = props.mentor.offers_in_person
      ? "In person | Online"
      : "Online";
    const group_session = props.mentor.offers_group_appointments
      ? "Group Meetings | 1-on-1"
      : "1-on-1";
    return in_person + " | " + group_session;
  };

  const getLanguages = (languages) => {
    return languages.join(" • ");
  };

  const getSpecializationTags = (specializations) => {
    return specializations.map((specialization, idx) =>
      idx === 0 ? (
        <div className="mentor-specialization-tag-first">{specialization}</div>
      ) : (
        <div className="mentor-specialization-tag">{specialization}</div>
      )
    );
  };

  const getEducations = (educations) => {
    if (educations == null || educations[0] == null) {
      return;
    }
    return educations.map((education) => (
      <div className="mentor-profile-education">
        <b>{education.school}</b>
        <br />
        {education.education_level}
        <br />
        {"Major(s): " + education.majors.join(", ")}
        <br />
        {education.graduation_year}
      </div>
    ));
  };

  return (
    <div>
      <div className="mentor-profile-name">
        {props.mentor.name}
        {props.isMentor ? (
          <Button
            className="mentor-profile-edit-button"
            style={profileButtonStyle}
          >
            <b>Edit Profile</b>
          </Button>
        ) : (
          <Button
            className="mentor-profile-edit-button"
            style={profileButtonStyle}
          >
            <b>Book Appointment</b>
          </Button>
        )}
      </div>
      <div className="mentor-profile-heading">
        {props.mentor.professional_title} <t className="yellow-dot">•</t>{" "}
        {getMeetingMethods()}
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
            {props.mentor.website}
          </span>
        )}
        {props.mentor.linkedin && (
          <span>
            <LinkedinOutlined className="mentor-profile-tag" />
            {props.mentor.linkedin}
          </span>
        )}
      </div>
      <br />
      <div className="mentor-profile-heading">
        <b>About</b>
      </div>
      <div className="mentor-profile-about">{props.mentor.biography}</div>
      <br />
      <div className="mentor-profile-heading">
        <b>Specializations</b>
      </div>
      <div>{getSpecializationTags(props.mentor.specializations || [])}</div>
      <br />
      <div className="mentor-profile-heading">
        <b>Education</b>
      </div>
      <div>{getEducations(props.mentor.education)}</div>
    </div>
  );
}

export default ProfileContent;
