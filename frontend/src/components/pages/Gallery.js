import React, { useState, useEffect } from "react";
import MentorCard from "../MentorCard";
import { css } from "@emotion/css";
import {
  Input,
  Checkbox,
  Modal,
  Result,
  Spin,
  theme,
  Button,
  Affix,
  Select,
  Typography,
  FloatButton,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import MenteeButton from "../MenteeButton";
import "../css/Gallery.scss";
import { isLoggedIn } from "utils/auth.service";
import {
  editFavMentorById,
  fetchMenteeByID,
  fetchMentors,
  fetchPartners,
} from "utils/api";
import { useAuth } from "utils/hooks/useAuth";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { getTranslatedOptions } from "utils/translations";

const { Title, Text, Paragraph } = Typography;

function Gallery(props) {
  const {
    token: { colorPrimaryBg, colorPrimary },
  } = theme.useToken();
  const { t } = useTranslation();
  const options = useSelector((state) => state.options);
  const { isAdmin, isMentor, isMentee, profileId, isGuest } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [mentee, setMentee] = useState();
  const [specializations, setSpecializations] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [query, setQuery] = useState();
  const [mobileFilterVisible, setMobileFilterVisible] = useState(false);
  const [favoriteMentorIds, setFavoriteMentorIds] = useState(new Set());
  const [pageLoaded, setPageLoaded] = useState(false);
  const [allPartners, setAllPartners] = useState([]);
  const [selectedPartnerID, setSelectedPartnerID] = useState(undefined);
  const user = useSelector((state) => state.user.user);
  useEffect(() => {
    async function getMentors() {
      const mentor_data = await fetchMentors();
      if (mentor_data) {
        if (user && user.pair_partner && user.pair_partner.restricted) {
          if (user.pair_partner.assign_mentors) {
            var temp = [];
            mentor_data.map((mentor_item) => {
              var check_exist = user.pair_partner.assign_mentors.find(
                (x) => x.id === mentor_item._id.$oid
              );
              if (check_exist) {
                temp.push(mentor_item);
              }
              return false;
            });
            setMentors(temp);
          }
        } else {
          var restricted_partners = await fetchPartners(true);
          if (
            !isAdmin &&
            !isGuest &&
            restricted_partners &&
            restricted_partners.length > 0
          ) {
            var assigned_mentor_ids = [];
            restricted_partners.map((partner_item) => {
              if (partner_item.assign_mentors) {
                partner_item.assign_mentors.map((assign_item) => {
                  assigned_mentor_ids.push(assign_item.id);
                  return false;
                });
              }
              return false;
            });
            temp = [];
            mentor_data.map((mentor_item) => {
              if (!assigned_mentor_ids.includes(mentor_item._id.$oid)) {
                temp.push(mentor_item);
              }
              return false;
            });
            setMentors(temp);
          } else {
            setMentors(mentor_data);
          }
        }
      }
      setPageLoaded(true);
    }

    getMentors();

    async function getAllPartners() {
      var all_data = [];
      if (isAdmin || isGuest) {
        all_data = await fetchPartners();
      } else {
        if (user && user.pair_partner && user.pair_partner.restricted) {
          all_data = [user.pair_partner];
        } else {
          all_data = await fetchPartners(false);
        }
      }
      var temp = [];
      if (all_data) {
        all_data.map((item) => {
          temp.push({
            value: item.id ? item.id : item._id["$oid"],
            label: item.organization,
          });
          return false;
        });
      }
      setAllPartners(temp);
    }
    getAllPartners();
  }, []);

  useEffect(() => {
    async function getMentee() {
      const mentee_id = profileId;
      const mentee_data = await fetchMenteeByID(mentee_id);
      if (mentee_data) {
        setMentee(mentee_data);
      }
    }
    if (isMentee && !mentee) {
      getMentee();
    }
  }, [isMentee]);

  useEffect(() => {
    function initializeFavorites() {
      let fav_set = new Set();
      mentee.favorite_mentors_ids.forEach((id) => {
        fav_set.add(id);
      });
      setFavoriteMentorIds(fav_set);
    }
    if (isMentee && mentee) {
      initializeFavorites();
    }
  }, [mentee]);

  function onEditFav(mentor_id, favorite) {
    editFavMentorById(profileId, mentor_id, favorite);
  }

  function getLessonTypes(offers_group_appointments, offers_in_person) {
    let output = `${t("mentorProfile.oneOnOne")} | ${t(
      "mentorProfile.virtual"
    )}`;
    if (offers_group_appointments) {
      output += ` | ${t("mentorProfile.group")}`;
    }
    if (offers_in_person) {
      output += ` | ${t("mentorProfile.inPerson")}`;
    }
    return output;
  }

  const getFilteredMentors = () =>
    mentors.filter((mentor) => {
      // matches<Property> is true if no options selected, or if mentor has AT LEAST one of the selected options
      const matchesSpecializations =
        specializations.length === 0 ||
        specializations.some((s) => mentor.specializations.indexOf(s) >= 0);
      const matchesLanguages =
        languages.length === 0 ||
        languages.some((l) => mentor.languages.indexOf(l) >= 0);
      const matchesName =
        !query || mentor.name.toUpperCase().includes(query.toUpperCase());
      const matchPartner =
        !selectedPartnerID ||
        (mentor.pair_partner && mentor.pair_partner.id === selectedPartnerID);

      return (
        matchesSpecializations &&
        matchesLanguages &&
        matchesName &&
        matchPartner
      );
    });

  const getFilterForm = () => (
    <>
      <Title
        level={4}
        className={css`
          margin-top: 0;
        `}
      >
        {t("gallery.filterBy")}
      </Title>
      <Input
        placeholder={t("gallery.searchByName")}
        prefix={<SearchOutlined />}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Title
        level={4}
        className={css`
          color: ${colorPrimary};
        `}
      >
        {t("common.partner")}
      </Title>
      <Select
        onChange={(value) => {
          setSelectedPartnerID(value);
        }}
        placeholder={t("common.partner")}
        options={allPartners}
        suffixIcon={<SearchOutlined />}
        className={css`
          width: 100%;
        `}
        allowClear
      />
      <Title level={4}>{t("common.languages")}</Title>
      <Select
        className={css`
          width: 100%;
        `}
        allowClear
        defaultValue={languages}
        mode="multiple"
        placeholder={t("common.languages")}
        options={options.languages}
        onChange={(selected) => setLanguages(selected)}
        maxTagCount="responsive"
      />

      <Title level={4}>{t("common.specializations")}</Title>
      <Select
        className={css`
          width: 100%;
        `}
        allowClear
        defaultValue={specializations}
        mode="multiple"
        placeholder={t("common.specializations")}
        options={options.specializations}
        onChange={(selected) => setSpecializations(selected)}
        maxTagCount="responsive"
      />
    </>
  );

  return !(props.isSupport || isAdmin || isMentee || isGuest) ? (
    <Result
      status="403"
      title="403"
      subTitle={t("gallery.unauthorizedAccess")}
    />
  ) : (
    <>
      <Affix offsetTop={10}>
        <Button
          onClick={() => setMobileFilterVisible(true)}
          className={css`
            display: none;
            @media only screen and (max-width: 640px) {
              margin-top: 2%;
              margin-left: 2%;
              display: grid;
            }
          `}
          type="primary"
        >
          {t("gallery.filter")}
        </Button>
      </Affix>
      <Modal
        onCancel={() => {
          setMobileFilterVisible(false);
        }}
        open={mobileFilterVisible}
        footer={[
          <Button onClick={() => setMobileFilterVisible(false)} type="primary">
            {t("common.apply")}
          </Button>,
          <Button
            onClick={() => {
              setMobileFilterVisible(false);
              setSpecializations([]);
              setQuery("");
              setLanguages([]);
            }}
          >
            {t("common.cancel")}
          </Button>,
        ]}
        bodyStyle={{
          padding: "1rem",
        }}
      >
        {getFilterForm()}
      </Modal>

      <div className="gallery-container">
        <FloatButton.BackTop />
        <Affix offsetTop={10}>
          <div
            className={css`
              margin-right: 1em;
              padding: 1em;
              border-radius: 8px;
              height: fit-content;
              border: 2px solid ${colorPrimaryBg};

              @media only screen and (max-width: 640px) {
                display: none;
              }
            `}
          >
            {getFilterForm()}
          </div>
        </Affix>

        {!pageLoaded ? (
          <div
            className={css`
              display: flex;
              flex: 1;
              justify-content: center;
              align-items: center;
              height: 80vh;
            `}
          >
            <Spin size="large" />
          </div>
        ) : (
          <div className="gallery-mentor-container">
            {getFilteredMentors().map((mentor, key) => (
              <MentorCard
                key={key}
                name={mentor.name}
                languages={getTranslatedOptions(
                  mentor.languages,
                  options.languages
                )}
                professional_title={mentor.professional_title}
                location={mentor.location}
                specializations={mentor.specializations}
                video={mentor.video}
                id={mentor._id["$oid"]}
                lesson_types={getLessonTypes(
                  mentor.offers_group_appointments,
                  mentor.offers_in_person
                )}
                favorite={favoriteMentorIds.has(mentor._id["$oid"])}
                onEditFav={onEditFav}
                image={mentor.image}
                pair_partner={mentor.pair_partner}
                isSupport={props.isSupport}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Gallery;
