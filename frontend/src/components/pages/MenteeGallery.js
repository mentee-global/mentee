import React, { useState, useEffect, useCallback } from "react";
import { fetchMenteeByID, fetchMentors, fetchMentees } from "../../utils/api";
import MenteeCard from "../MenteeCard";
import { Input, Checkbox, Modal, Result, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import MenteeButton from "../MenteeButton";
import "../css/Gallery.scss";
import { isLoggedIn, getMenteeID } from "utils/auth.service";
import { useLocation } from "react-router";
import {
  editFavMentorById,
  getDisplayLanguages,
  getDisplaySpecializations,
} from "utils/api";
import { useAuth } from "../../utils/hooks/useAuth";
import { useSelector } from "react-redux";

function Gallery() {
  const { isAdmin, isMentor, isMentee } = useAuth();
  const [mentees, setMentees] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [interestRange, setInteresRange] = useState([]);
  const [query, setQuery] = useState();
  const [mobileFilterVisible, setMobileFilterVisible] = useState(false);
  const location = useLocation();
  const [pageLoaded, setPageLoaded] = useState(false);
  const [langMasters, setLangMasters] = useState([]);
  const [specMasters, setSpecMasters] = useState([]);
  const verified = location.state && location.state.verified;
  const user = useSelector((state) => state.user.user);
  useEffect(() => {
    async function getMentees() {
      const mentee_data = await fetchMentees();
      if (mentee_data) {
        if (user.pair_partner && user.pair_partner.restricted) {
          if (user.pair_partner.assign_mentees) {
            var temp = [];
            mentee_data.map((mentee_item) => {
              var check_exist = user.pair_partner.assign_mentees.find(
                (x) => x.id === mentee_item._id.$oid
              );
              if (check_exist) {
                temp.push(mentee_item);
              }
              return false;
            });
            setMentees(temp);
          }
        } else {
          setMentees(mentee_data);
        }
      }
    }
    setPageLoaded(true);
    getMentees();

    async function getMasters() {
      setLangMasters(await getDisplayLanguages());
      setSpecMasters(await getDisplaySpecializations());
    }
    getMasters();
  }, []);

  const getFilteredMentees = () => {
    return mentees.filter((mentee) => {
      // matches<Property> is true if no options selected, or if mentor has AT LEAST one of the selected options
      const matchesLanguages =
        languages.length === 0 ||
        languages.some((l) => mentee.languages.indexOf(l) >= 0);
      const matchesName =
        !query || mentee.name.toUpperCase().includes(query.toUpperCase());
      let specializs = mentee.specializations ? mentee.specializations : [];
      const matchInterests =
        interestRange.length === 0 ||
        interestRange.some((l) => specializs.indexOf(l) >= 0);

      return matchesLanguages && matchesName && matchInterests;
    });
  };

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

          <div className="gallery-filter-section-title">Languages</div>
          <Checkbox.Group
            defaultValue={languages}
            options={langMasters}
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

          <div className="gallery-filter-section-title">Languages</div>
          <Checkbox.Group
            defaultValue={languages}
            options={langMasters}
            onChange={(checked) => setLanguages(checked)}
          />

          <div className="gallery-filter-section-title">Mentee Interests</div>
          <Checkbox.Group
            defaultValue={interestRange}
            options={specMasters}
            onChange={(checked) => setInteresRange(checked)}
            value={interestRange}
          />
        </div>

        <div className="gallery-mentor-container">
          {!pageLoaded ? (
            <div className="loadingIcon">
              {" "}
              <Spin />{" "}
            </div>
          ) : (
            getFilteredMentees().map((mentee, key) => {
              return (
                <MenteeCard
                  key={key}
                  name={mentee.name}
                  languages={mentee.languages}
                  location={mentee.location}
                  gender={mentee.gender}
                  organization={mentee.organization}
                  image={mentee.image}
                  video={mentee.video}
                  age={mentee.age}
                  id={mentee._id["$oid"]}
                />
              );
            })
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
