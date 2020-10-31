import React, { useState, useEffect } from "react";
import {
  LinkOutlined,
  LinkedinOutlined,
  StarOutlined,
  EnvironmentOutlined,
  UserOutlined,
} from "@ant-design/icons";
import "../css/MentorGallery.scss";
import { fetchMentors } from "../../utils/api";
import { Avatar, Typography, Button } from "antd";
const { Title, Text } = Typography;

function Gallery() {
  const [mentors, setMentors] = useState([]);

  useEffect(() => {
    async function getMentors() {
      const mentor_data = await fetchMentors();
      if (mentor_data) {
        setMentors(mentor_data);
      }
    }
    getMentors();
  }, []);

  function getLessonTypes(offers_group_appointments, offers_in_person) {
    let output = "1-on-1 | virtual";
    if (offers_group_appointments) {
      output += " | " + "group";
    }
    if (offers_in_person) {
      output += " | " + "in person";
    }
    return output;
  }

  return (
    <div className="mentor-container">
      {mentors.map((mentor, key) => (
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
      ))}
    </div>
  );
}
/*  name,
  picture,
  languages,
  professional_title,
  location,
  lesson_types,
  specializations,
  website,
  linkedin,*/
function MentorCard(props) {
  return (
    <div className="mentor-card">
      <div className="card-body">
        <div className="card-header">
          <Avatar size={90} icon={getPicture(props.picture)} />
          <div className="header-text">
            <Title style={styles.title} className="title-text">
              {props.name}
            </Title>
            <Title style={styles.title} type="secondary" level={5}>
              {props.professional_title}
            </Title>
            <Title style={styles.title} type="secondary" level={5}>
              Speaks: {props.languages.join(", ")}
            </Title>
          </div>
        </div>
        <h3 className="lesson-types">
          <span class="dot" />
          {props.lesson_types}
        </h3>
        <h3 className="headers">
          <EnvironmentOutlined style={styles.icon} />
          Location:
        </h3>
        <Text className="list-items">{props.location}</Text>
        <h3 className="headers">
          <StarOutlined style={styles.icon} />
          Specializations:
        </h3>
        <Text className="list-items">{props.specializations.join(", ")}</Text>
        <h4>
          <LinkOutlined style={styles.icon} />
          <a className="links" href={props.website}>
            {props.website}
          </a>
        </h4>
        <h4>
          <LinkedinOutlined style={styles.icon} />
          <a className="links" href={props.linkedin}>
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

function getPicture(picture) {
  if (!picture) {
    return <UserOutlined />;
  } else {
    return <img src={picture} />;
  }
}

const styles = {
  title: {
    margin: 0,
  },
  icon: {
    fontSize: "20px",
    "padding-right": "7px",
  },
};

export default Gallery;
