import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  UserOutlined,
  EnvironmentOutlined,
  CommentOutlined,
  LinkOutlined,
  LinkedinOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { Avatar } from "antd";
import MentorProfileModal from "../MentorProfileModal";

import "../css/Profile.scss";
import { fetchMentorByID, mentorID } from "../../utils/api";

function Profile() {
  const [mentor, setMentor] = useState({});

  useEffect(() => {
    async function getMentor() {
      const mentor_data = await fetchMentorByID(mentorID);
      if (mentor_data) {
        setMentor(mentor_data);
      }
    }
    getMentor();
  }, []);

  const getMeetingMethods = () => {
    const in_person = mentor.offers_in_person ? "In person | Online" : "Online";
    const group_session = mentor.offers_group_appointments
      ? "Group Meetings | 1-on-1"
      : "1-on-1";
    return in_person + " | " + group_session;
  };

  const getLanguages = (languages) => {
    return languages.map((language, idx) =>
      idx === 0 ? language : " • " + language
    );
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
    <div className="background-color-strip">
      <div className="mentor-profile-content">
        <Avatar size={120} src={mentor.picture} icon={<UserOutlined />} />
        <div className="mentor-profile-content-flexbox">
          <div className="mentor-profile-info">
            <div className="mentor-profile-name">
              {mentor.name}
              <MentorProfileModal />
            </div>
            <div className="mentor-profile-heading">
              {mentor.professional_title} <t className="yellow-dot">•</t>{" "}
              {getMeetingMethods()}
            </div>
            <div>
              {mentor.location && (
                <span>
                  <EnvironmentOutlined className="mentor-profile-tag-first" />
                  {mentor.location}
                </span>
              )}
              <span>
                <CommentOutlined
                  className={
                    !mentor.location
                      ? "mentor-profile-tag-first"
                      : "mentor-profile-tag"
                  }
                />
                {getLanguages(mentor.languages || [])}
              </span>
              {mentor.website && (
                <span>
                  <LinkOutlined className="mentor-profile-tag" />
                  {mentor.website}
                </span>
              )}
              {mentor.linkedin && (
                <span>
                  <LinkedinOutlined className="mentor-profile-tag" />
                  {mentor.linkedin}
                </span>
              )}
            </div>
            <br />
            <div className="mentor-profile-heading">
              <b>About</b>
            </div>
            <div className="mentor-profile-about">{mentor.biography}</div>
            <br />
            <div className="mentor-profile-heading">
              <b>Specializations</b>
            </div>
            <div>{getSpecializationTags(mentor.specializations || [])}</div>
            <br />
            <div className="mentor-profile-heading">
              <b>Education</b>
            </div>
            <div>{getEducations(mentor.education)}</div>
          </div>
          <fieldset className="mentor-profile-contact">
            <legend className="mentor-profile-contact-header">
              Contact Info
            </legend>
            <MailOutlined className="mentor-profile-contact-icon" />
            {mentor.email}
            <br />
            {mentor.phone_number && (
              <div>
                <PhoneOutlined className="mentor-profile-contact-icon" />
                {mentor.phone_number}
                <br />
              </div>
            )}
            <br />
            <Link to="/" className="mentor-profile-contact-edit">
              Edit
            </Link>
          </fieldset>
        </div>
      </div>
    </div>
  );
}

export default Profile;
