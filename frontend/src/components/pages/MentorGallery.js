import React, { useState } from "react";
import { LinkOutlined, LinkedinOutlined } from "@ant-design/icons";
import Location from "../../resources/location.svg";
import Specializations from "../../resources/specialization.svg";
import Picture from "../../resources/default-picture.svg";
import "../css/MentorGallery.scss";
import { Typography, Button } from "antd";
const { Title, Text } = Typography;

function MentorGallery() {
  const mentors = [
    {
      name: "test",
      professional_title: "Professional Programmer",
      specializations: [
        "cooking",
        "programming",
        "stuff",
        "more stuff",
        "loremipsumdelor",
      ],
      location: "Chicago, IL",
      languages: ["english", "other"],
      website: "https://google.com",
      linkedin: "https://linkedin.com",
      offers_in_person: false,
      offers_group_appointments: true,
    },
    {
      name: "test",
      professional_title: "Professional Programmer",
      specializations: [
        "cooking",
        "programming",
        "stuff",
        "more stuff",
        "loremipsumdelor",
      ],
      location: "Chicago, IL",
      languages: ["english", "other"],
      website: "https://google.com",
      linkedin: "https://linkedin.com",
      offers_in_person: false,
      offers_group_appointments: true,
    },
  ];
  function getLessonTypes(offers_group_appointments, offers_in_person) {
    let output = "1-on-1 | virtual";
    if (offers_group_appointments == true) {
      output += " | " + "group";
    }
    if (offers_in_person == true) {
      output += " | " + "in person";
    }
    return output;
  }

  return (
    <div className="mentor-container">
      {mentors.map(
        (mentor, key) => (
          console.log(mentor.name),
          (
            <MentorCard
              key={key}
              name={mentor.name}
              languages={mentor.languages}
              professional_title={mentor.professional_title}
              location={mentor.location}
              specializations={mentor.specializations}
              website={mentor.website}
              linkedin={mentor.linkedin}
              lesson_types={getLessonTypes(
                mentor.offers_group_appointments,
                mentor.offers_in_person
              )}
            />
          )
        )
      )}
    </div>
  );
}

function MentorCard({
  name,
  picture,
  languages,
  professional_title,
  location,
  lesson_types,
  specializations,
  website,
  linkedin,
}) {
  if (picture == null) {
    picture = Picture;
  }
  return (
    <div className="mentor-card">
      <div className="card-body">
        <div className="card-header">
          <img src={picture} />
          <div className="header-text">
            <Title style={{ margin: 0 }} className="title-text">
              {name}
            </Title>
            <Title type="secondary" style={{ margin: 0 }} level={5}>
              {professional_title}
            </Title>
            <Title type="secondary" style={{ margin: 0 }} level={5}>
              Speaks: {languages.join(", ")}
            </Title>
          </div>
        </div>
        <h3 className="lesson-types">
          <span class="dot" />
          {lesson_types}
        </h3>
        <h3 className="headers">
          <img className="header-icon" src={Location} />
          Location:
        </h3>
        <Text className="list-items">{location}</Text>
        <h3 className="headers">
          <img className="header-icon" src={Specializations} />
          Specializations:
        </h3>
        <Text className="list-items">{specializations.join(", ")}</Text>
        <h4>
          <LinkOutlined style={{ fontSize: "20px" }} />
          <a className="links" href={website}>
            {website}
          </a>
        </h4>
        <h4>
          <LinkedinOutlined style={{ fontSize: "20px" }} />
          <a className="links" href={linkedin}>
            linkedin
          </a>
        </h4>
        <hr class="solid" />
        <Button className="profile-button" shape="round" size="medium">
          View Profile
        </Button>
      </div>
    </div>
  );
}

export default MentorGallery;
