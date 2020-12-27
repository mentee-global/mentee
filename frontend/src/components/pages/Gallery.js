import React, { useState, useEffect } from "react";
import { fetchMentors } from "../../utils/api";
import MentorCard from "../MentorCard";
import { Input, Checkbox } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { LANGUAGES, SPECIALIZATIONS } from "../../utils/consts";

import "../css/Gallery.scss";

function Gallery() {
  const [mentors, setMentors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [query, setQuery] = useState();

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

  function getFilteredMentors() {
    return mentors.filter((mentor) => {
      const matchesSpecializations =
        specializations.length == 0 ||
        specializations.some((s) => mentor.specializations.indexOf(s) >= 0);
      const matchesLanguages =
        languages.length == 0 ||
        languages.some((l) => mentor.languages.indexOf(l) >= 0);
      const matchesName =
        !query || mentor.name.toUpperCase().includes(query.toUpperCase());

      return matchesSpecializations && matchesLanguages && matchesName;
    });
  }

  return (
    <div className="gallery-container">
      <div className="gallery-filter-container">
        <div className="gallery-filter-header">Filter By:</div>
        <Input
          placeholder="Search by name"
          prefix={<SearchOutlined />}
          style={styles.searchInput}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="gallery-filter-section-title">Specializations</div>
        <Checkbox.Group
          defaultValue={specializations}
          options={SPECIALIZATIONS}
          onChange={(checked) => setSpecializations(checked)}
        />
        <div className="gallery-filter-section-title">Languages</div>
        <Checkbox.Group
          defaultValue={languages}
          options={LANGUAGES}
          onChange={(checked) => setLanguages(checked)}
        />
      </div>
      <div className="gallery-mentor-container">
        {getFilteredMentors().map((mentor, key) => (
          <MentorCard
            key={key}
            name={mentor.name}
            languages={mentor.languages}
            professional_title={mentor.professional_title}
            location={mentor.location}
            specializations={mentor.specializations}
            website={mentor.website}
            linkedin={mentor.linkedin}
            id={mentor._id["$oid"]}
            lesson_types={getLessonTypes(
              mentor.offers_group_appointments,
              mentor.offers_in_person
            )}
            image={mentor.image}
          />
        ))}
      </div>
    </div>
  );
}

const styles = {
  searchInput: {
    borderRadius: 10,
    marginBottom: 5,
  },
};

export default Gallery;
