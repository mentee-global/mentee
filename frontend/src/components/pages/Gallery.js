import React, { useState, useEffect } from "react";
import {
  LinkOutlined,
  LinkedinOutlined,
  StarOutlined,
  EnvironmentOutlined,
  UserOutlined,
} from "@ant-design/icons";
import "../css/Gallery.scss";
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
      output += " | group";
    }
    if (offers_in_person) {
      output += " | in person";
    }
    return output;
  }

  return (
    <div className="gallery-mentor-container">
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

function MentorCard(props) {
  return (
    <div className="gallery-mentor-card">
      <div className="gallery-card-body">
        <div className="gallery-card-header">
          <Avatar size={90} icon={getPicture(props.picture)} />
          <div className="gallery-header-text">
            <Title style={styles.title} className="gallery-title-text">
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
        <h3 className="gallery-lesson-types">
          <span class="dot" />
          {props.lesson_types}
        </h3>
        <h3 className="gallery-headers">
          <EnvironmentOutlined style={styles.icon} />
          Location:
        </h3>
        <Text className="gallery-list-items">{props.location}</Text>
        <h3 className="gallery-headers">
          <StarOutlined style={styles.icon} />
          Specializations:
        </h3>
        <Text className="gallery-list-items">
          {props.specializations.join(", ")}
        </Text>
        <h4>
          <LinkOutlined style={styles.icon} />
          <a className="gallery-links" href={props.website}>
            {props.website}
          </a>
        </h4>
        <h4>
          <LinkedinOutlined style={styles.icon} />
          <a className="gallery-links" href={props.linkedin}>
            linkedin
          </a>
        </h4>
        <hr class="solid" />
        <Button className="gallery-profile-button" shape="round" size="medium">
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
    return <img src={picture} alt="" />;
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
