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
import { fetchMentorByID } from "../../utils/api.js";
// This is just for the timebeing while we get auth up and running
// TODO: Delete this after auth is done!
const mentorID = "5f961535f84a6a4c05255855";

function Profile() {
  // placeholder list data - will be populated later by querying DB
  const [methods, setMethods] = useState(["Zoom", "Bluejeans"]);
  const [languages, setLanguages] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [educations, setEducation] = useState([]);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [website, setWebsite] = useState("");
  const [biography, setBiography] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [fetchedMentor, setFetchedMentor] = useState(false);

  useEffect(() => {
    async function getProfile() {
      const response = await fetchMentorByID(mentorID);
      if (response) {
        setName(response.name);
        setTitle(response.title);
        setWebsite(response.website);
        setBiography(response.biography);
        setLinkedin(response.linkedin);
        setEducation([response.education]);
        setSpecializations(response.specializations);
        setLanguages(response.languages);
        setBiography(response.biography);
      }
    }
    if (!fetchedMentor) {
      getProfile();
      setFetchedMentor(true);
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
    return educations.map((education) => (
      <div className="mentor-profile-education">
        <b>{education["school"]}</b>
        <br />
        {education["education_level"] + ", " + education["major"]}
        <br />
        {education["year"]}
      </div>
    ));
  };

  return (
    <div className="background-color-strip">
      <div className="mentor-profile-content">
        <Avatar size={120} icon={<UserOutlined />} />
        <div className="mentor-profile-content-flexbox">
          <div className="mentor-profile-info">
            <div className="mentor-profile-name">
              {name}
              <Button
                className="mentor-profile-edit-button"
                style={{ background: "#E4BB4F", color: "#FFFFFF" }}
              >
                <b>Edit Profile</b>
              </Button>
            </div>
            <div className="mentor-profile-heading">
              {title} <t className="yellow-dot">•</t>{" "}
              {getMeetingMethods(methods)}
            </div>
            <div>
              <span>
                <EnvironmentOutlined className="mentor-profile-tag-first" />
                Location
              </span>
              <span>
                <CommentOutlined className="mentor-profile-tag" />
                {getLanguages(languages)}
              </span>
              <span>
                <LinkOutlined className="mentor-profile-tag" />
                {website}
              </span>
              <span>
                <LinkedinOutlined className="mentor-profile-tag" />
                {linkedin}
              </span>
            </div>
            <br />
            <div className="mentor-profile-heading">
              <b>About</b>
            </div>
            <div className="mentor-profile-about">{biography}</div>
            <br />
            <div className="mentor-profile-heading">
              <b>Specializations</b>
            </div>
            <div>{getSpecializationTags(specializations)}</div>
            <br />
            <div className="mentor-profile-heading">
              <b>Education</b>
            </div>
            <div>{getEducations(educations)}</div>
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
