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
import { Button, Avatar } from "antd";

import "../css/Profile.scss";
import { fetchMentorByID, mentorID } from "../../utils/api";

function Profile() {
  const [methods, setMethods] = useState(["Zoom", "Bluejeans"]);
  const [mentor, setMentor] = useState({});
  const [fetchedMentor, setFetchedMentor] = useState(false);

  useEffect(() => {
    async function getMentor() {
      const mentor_data = await fetchMentorByID(mentorID);
      setFetchedMentor(true);
      if (mentor_data) {
        setMentor(mentor_data);
      }
    }
    if (!fetchedMentor) {
      getMentor();
    }
  });

  const getMeetingMethods = (methods) => {
    return methods.map((method, idx) => (idx === 0 ? method : " | " + method));
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
    console.log(educations);
    return educations[0] != null ? (
      educations.map((education) => (
        <div className="mentor-profile-education">
          <b>{education.school}</b>
          <br />
          {education.education_level}
          <br />
          {"Majors: " + education.majors.join(", ")}
          <br />
          {education.graduation_year}
        </div>
      ))
    ) : (
      <div></div>
    );
  };

  return (
    <div className="background-color-strip">
      <div className="mentor-profile-content">
        <Avatar size={120} icon={<UserOutlined />} />
        <div className="mentor-profile-content-flexbox">
          <div className="mentor-profile-info">
            <div className="mentor-profile-name">
              {mentor.name}
              <Button
                className="mentor-profile-edit-button"
                style={{ background: "#E4BB4F", color: "#FFFFFF" }}
              >
                <b>Edit Profile</b>
              </Button>
            </div>
            <div className="mentor-profile-heading">
              {mentor.professional_title} <t className="yellow-dot">•</t>{" "}
              {getMeetingMethods(methods)}
            </div>
            <div>
              <span>
                <EnvironmentOutlined className="mentor-profile-tag-first" />
                Location
              </span>
              <span>
                <CommentOutlined className="mentor-profile-tag" />
                {getLanguages(mentor.languages || [])}
              </span>
              <span>
                <LinkOutlined className="mentor-profile-tag" />
                {mentor.website}
              </span>
              <span>
                <LinkedinOutlined className="mentor-profile-tag" />
                {mentor.linkedin}
              </span>
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
            <div>
              {
                getEducations([
                  mentor.education,
                ]) /* change this once model supports list of education and remove ternary in getEdu*/
              }
            </div>
          </div>
          <fieldset className="mentor-profile-contact">
            <legend className="mentor-profile-contact-header">
              Contact Info
            </legend>
            <MailOutlined className="mentor-profile-contact-icon" />
            mentoremail@email.com
            <br />
            <PhoneOutlined className="mentor-profile-contact-icon" />
            1-234-567-8901
            <br />
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
