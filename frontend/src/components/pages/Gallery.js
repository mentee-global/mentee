import React, { useState, useEffect, useCallback } from "react";
import { fetchMenteeByID, fetchMentors, fetchMentees } from "../../utils/api";
import MentorCard from "../MentorCard";
import { Input, Checkbox, Modal, Result, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { LANGUAGES, SPECIALIZATIONS } from "../../utils/consts";
import MenteeButton from "../MenteeButton";
import "../css/Gallery.scss";
import { isLoggedIn, getMenteeID } from "utils/auth.service";
import { useLocation } from "react-router";
import { EditFavMentorById } from "../../utils/api";
import useAuth from "../../utils/hooks/useAuth";

function Gallery() {
  const { isAdmin, isMentor, isMentee } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [mentees, setMentees] = useState([]);
  const [mentee, setMentee] = useState();
  const [specializations, setSpecializations] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [query, setQuery] = useState();
  const [mobileFilterVisible, setMobileFilterVisible] = useState(false);
  const location = useLocation();
  const [favorite_mentorIds, setFavoriteIds] = useState(new Set());
  const [pageLoaded, setPageLoaded] = useState(false);
  const verified = location.state && location.state.verified;

  useEffect(() => {
    async function getMentors() {
      const mentor_data = await fetchMentors();
      if (mentor_data) {
        setMentors(mentor_data);
      }
    }
    setPageLoaded(true);
    if (verified) {
      getMentors();
    }
  }, [verified]);

  useEffect(() => {
    async function getMentees() {
      const mentee_data = await fetchMentees();
      if (mentee_data) {
        setMentees(mentee_data);
        setPageLoaded(true);
      }
    }
    if (verified) {
      getMentees();
    }
  }, [verified]);

  useEffect(() => {
    async function getMentee() {
      const mentee_id = await getMenteeID();
      const mentee_data = await fetchMenteeByID(mentee_id);
      if (mentee_data) {
        setMentee(mentee_data);
      }
    }
    if (isMentee) {
      getMentee();
    }
  }, [isMentee]);

  useEffect(() => {
    function initializeFavorites() {
      let fav_set = new Set();
      mentee.favorite_mentors_ids.forEach((id) => {
        fav_set.add(id);
      });
      setFavoriteIds(fav_set);
      setPageLoaded(true);
    }
    if (isMentee) {
      initializeFavorites();
    }
  }, [mentee]);

  function onEditFav(mentor_id, favorite) {
    EditFavMentorById(mentee.firebase_uid, mentor_id, favorite);
  }

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

  const getFilteredMentors = useCallback(() => {
    return mentors.filter((mentor) => {
      // matches<Property> is true if no options selected, or if mentor has AT LEAST one of the selected options
      const matchesSpecializations =
        specializations.length === 0 ||
        specializations.some((s) => mentor.specializations.indexOf(s) >= 0);
      const matchesLanguages =
        languages.length === 0 ||
        languages.some((l) => mentor.languages.indexOf(l) >= 0);
      const matchesName =
        !query || mentor.name.toUpperCase().includes(query.toUpperCase());

      return matchesSpecializations && matchesLanguages && matchesName;
    });
  }, [favorite_mentorIds]);

  const getFilteredMentees = useCallback(() => {
    return mentees.filter((mentee) => {
      // matches<Property> is true if no options selected, or if mentor has AT LEAST one of the selected options
      const matchesLanguages =
        languages.length === 0 ||
        languages.some((l) => mentee.languages.indexOf(l) >= 0);
      const matchesName =
        !query || mentee.name.toUpperCase().includes(query.toUpperCase());

      return matchesLanguages && matchesName;
    });
  }, [favorite_mentorIds]);

  // Add some kind of error 403 code
  return !(isLoggedIn() || verified) ? (
    <Result
      status="403"
      title="403"
      subTitle="Sorry, you are not authorized to access this page."
    />
  ) : (
    <>
      <MenteeButton
        onClick={() => setMobileFilterVisible(true)}
        content="Filter"
        theme="back"
        id="filter-button"
      />
      <Modal
        onCancel={() => {
          setMobileFilterVisible(false);
        }}
        visible={mobileFilterVisible}
        footer={[
          <MenteeButton
            content="Apply"
            key="apply"
            onClick={() => setMobileFilterVisible(false)}
          />,
          <MenteeButton
            content="Cancel"
            key="cancel"
            onClick={() => {
              setMobileFilterVisible(false);
              setSpecializations([]);
              setQuery("");
              setLanguages([]);
            }}
          />,
        ]}
      >
        <div className="no-margin gallery-filter-container">
          <div className="gallery-filter-header">Filter By:</div>
          <Input
            placeholder="Search by name"
            prefix={<SearchOutlined />}
            style={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isMentor && (
            <div>
              <div className="gallery-filter-section-title">
                Specializations
              </div>
              <Checkbox.Group
                defaultValue={specializations}
                options={SPECIALIZATIONS}
                onChange={(checked) => setSpecializations(checked)}
                value={specializations}
              />
            </div>
          )}
          <div className="gallery-filter-section-title">Languages</div>
          <Checkbox.Group
            defaultValue={languages}
            options={LANGUAGES}
            onChange={(checked) => setLanguages(checked)}
            value={languages}
          />
        </div>
      </Modal>

      <div className="gallery-container">
        <div className="gallery-filter-container mobile-invisible">
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
          {!pageLoaded ? (
            <div className="loadingIcon">
              {" "}
              <Spin />{" "}
            </div>
          ) : (
            // getFilteredMentors().map((mentor, key) => (
            //   <MentorCard
            //     key={key}
            //     name={mentor.name}
            //     languages={mentor.languages}
            //     professional_title={mentor.professional_title}
            //     location={mentor.location}
            //     specializations={mentor.specializations}
            //     website={mentor.website}
            //     linkedin={mentor.linkedin}
            //     id={mentor._id["$oid"]}
            //     firebase_uid={mentor.firebase_uid}
            //     lesson_types={getLessonTypes(
            //       mentor.offers_group_appointments,
            //       mentor.offers_in_person
            //     )}
            //     favorite={favorite_mentorIds.has(mentor._id["$oid"])}
            //     onEditFav={onEditFav}
            //     image={mentor.image}
            //   />

            // ))

            mentees.map((mentee, key) => (
              <MentorCard
                key={key}
                name={mentee.name}
                languages={mentee.languages}
                location={mentee.location}
                mentee
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}

const styles = {
  searchInput: {
    borderRadius: 10,
    marginBottom: 5,
  },
};

export default Gallery;
