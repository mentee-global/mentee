import React, { useState, useEffect } from "react";
import { fetchMentors } from "../../utils/api";
import MentorCard from "../MentorCard";

import "../css/Gallery.scss";

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
          id={mentor._id["$oid"]}
          lesson_types={getLessonTypes(
            mentor.offers_group_appointments,
            mentor.offers_in_person
          )}
          image={mentor.image}
        />
      ))}
    </div>
  );
}

export default Gallery;
