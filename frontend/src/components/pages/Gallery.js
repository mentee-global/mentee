import React, { useState, useEffect, useCallback, useRef } from "react";
import MentorCard from "../MentorCard";
import { css } from "@emotion/css";
import {
  Input,
  Modal,
  Result,
  Spin,
  theme,
  Button,
  Affix,
  Select,
  Typography,
  FloatButton,
  Pagination,
  Switch,
  Empty,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import "../css/Gallery.scss";
import {
  searchMentors,
  fetchPartners,
  fetchMenteeByID,
  editFavMentorById,
} from "utils/api";
import { useAuth } from "utils/hooks/useAuth";
import { useDebounce } from "utils/hooks/useDebounce";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { getTranslatedOptions } from "utils/translations";

const { Title, Text } = Typography;

const PAGE_SIZE = 24;

function Gallery(props) {
  const {
    token: { colorPrimaryBg, colorPrimary },
  } = theme.useToken();
  const { t } = useTranslation();
  const options = useSelector((state) => state.options);
  const { isAdmin, isMentee, profileId, isGuest } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [mentee, setMentee] = useState();
  const [specializations, setSpecializations] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [query, setQuery] = useState();
  const [locationQuery, setLocationQuery] = useState();
  const [mobileFilterVisible, setMobileFilterVisible] = useState(false);
  const [favoriteMentorIds, setFavoriteMentorIds] = useState(new Set());
  const [allPartners, setAllPartners] = useState([]);
  const [selectedPartnerOrg, setSelectedPartnerOrg] = useState(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPaused, setShowPaused] = useState(false);
  const user = useSelector((state) => state.user.user);
  const isAdminView = isAdmin || props.isSupport;

  const debouncedQuery = useDebounce(query, 300);
  const debouncedLocationQuery = useDebounce(locationQuery, 300);

  // Race condition guard
  const requestIdRef = useRef(0);

  const fetchPage = useCallback(
    async (page) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);

      const params = {
        page: page,
        page_size: PAGE_SIZE,
      };

      if (debouncedQuery) {
        params.search = debouncedQuery;
      }
      if (debouncedLocationQuery) {
        params.location = debouncedLocationQuery;
      }
      if (languages.length > 0) {
        params.languages = languages.join(",");
      }
      if (specializations.length > 0) {
        params.specializations = specializations.join(",");
      }
      if (selectedPartnerOrg && selectedPartnerOrg.length > 0) {
        const partnerIds = selectedPartnerOrg.map((org) => {
          const parts = org.split("_");
          return parts[parts.length - 1];
        });
        params.partner_ids = partnerIds.join(",");
      }
      if (isAdminView) {
        params.all = "true";
      }
      if (showPaused) {
        params.show_paused = "true";
      }
      if (user && user.pair_partner && user.pair_partner.restricted) {
        const partnerId =
          user.pair_partner.id || user.pair_partner._id?.["$oid"];
        if (partnerId) {
          params.restricted_partner_id = partnerId;
        }
      } else if (!isAdmin && !isGuest) {
        params.exclude_restricted = "true";
      }

      try {
        const result = await searchMentors(params);
        if (requestId !== requestIdRef.current) return;
        if (result) {
          setMentors(result.accounts || []);
          setTotal(result.total || 0);
        } else {
          setMentors([]);
          setTotal(0);
        }
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        console.error("Failed to fetch mentors:", err);
        setMentors([]);
        setTotal(0);
      } finally {
        if (requestId === requestIdRef.current) {
          setPageLoaded(true);
          setLoading(false);
        }
      }
    },
    [
      debouncedQuery,
      debouncedLocationQuery,
      languages,
      specializations,
      selectedPartnerOrg,
      isAdminView,
      showPaused,
      isAdmin,
      isGuest,
      user,
    ]
  );

  // When filters change, reset to page 1 and fetch
  useEffect(() => {
    setCurrentPage(1);
    fetchPage(1);
  }, [fetchPage]);

  // When only page changes (user clicks pagination), fetch that page
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Fetch partner options for the dropdown
  useEffect(() => {
    async function getAllPartners() {
      var all_data = [];
      if (isAdmin || isGuest) {
        all_data = await fetchPartners(undefined, null);
      } else {
        if (user && user.pair_partner && user.pair_partner.restricted) {
          all_data = [user.pair_partner];
        } else {
          all_data = await fetchPartners(false, null);
        }
      }
      var temp = [];
      if (all_data) {
        all_data.map((item) => {
          temp.push({
            value:
              item.organization + "_" + (item.id ? item.id : item._id["$oid"]),
            label: item.organization,
          });
          return false;
        });
      }
      setAllPartners(temp);
    }
    getAllPartners();
  }, []);

  // Fetch mentee data for favorites
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

  const handleClearFilters = () => {
    setQuery(undefined);
    setSpecializations([]);
    setLanguages([]);
    setSelectedPartnerOrg(undefined);
    setLocationQuery(undefined);
    setShowPaused(false);
  };

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
        placeholder={t(
          "gallery.searchByNameOrEmail",
          "Search by name or email"
        )}
        prefix={<SearchOutlined />}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        allowClear
      />
      <Title level={4}>{t("commonProfile.location", "Location")}</Title>
      <Input
        placeholder={t("gallery.searchByLocation", "Search by location")}
        prefix={<SearchOutlined />}
        value={locationQuery}
        onChange={(e) => setLocationQuery(e.target.value)}
        allowClear
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
          setSelectedPartnerOrg(value);
        }}
        value={selectedPartnerOrg}
        placeholder={t("common.partner")}
        options={allPartners}
        suffixIcon={<SearchOutlined />}
        className={css`
          width: 100%;
        `}
        allowClear
        mode="multiple"
        maxTagCount="responsive"
      />
      <Title level={4}>{t("common.languages")}</Title>
      <Select
        className={css`
          width: 100%;
        `}
        allowClear
        value={languages}
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
        value={specializations}
        mode="multiple"
        placeholder={t("common.specializations")}
        options={options.specializations}
        onChange={(selected) => setSpecializations(selected)}
        maxTagCount="responsive"
      />
      {isAdminView && (
        <div
          className={css`
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 12px;
            padding: 8px;
            background: ${colorPrimaryBg};
            border-radius: 6px;
          `}
        >
          <Text>{t("gallery.showPausedMentors", "Show paused mentors")}</Text>
          <Switch
            checked={showPaused}
            onChange={(checked) => setShowPaused(checked)}
            size="small"
          />
        </div>
      )}
      <Button
        onClick={handleClearFilters}
        className={css`
          margin-top: 12px;
          width: 100%;
        `}
      >
        {t("gallery.clearFilters", "Clear Filters")}
      </Button>
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
              handleClearFilters();
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
          <div
            className={css`
              flex: 5;
              display: flex;
              flex-direction: column;
            `}
          >
            <div
              className={css`
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                padding: 0 4px;
              `}
            >
              <Text type="secondary">
                {t("gallery.showingResults", {
                  defaultValue: "Showing {{from}}-{{to}} of {{total}} results",
                  from: total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1,
                  to: Math.min(currentPage * PAGE_SIZE, total),
                  total: total,
                })}
              </Text>
              {loading && <Spin size="small" />}
            </div>
            {mentors.length === 0 && !loading ? (
              <Empty
                description={t(
                  "gallery.noResults",
                  "No results found. Try adjusting your filters."
                )}
                className={css`
                  margin-top: 80px;
                `}
              />
            ) : (
              <div className="gallery-mentor-container">
                {mentors.map((mentor) => (
                  <MentorCard
                    key={mentor._id["$oid"]}
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
                    isPaused={mentor.paused_flag}
                    showAdminBadges={isAdmin || props.isSupport}
                  />
                ))}
              </div>
            )}
            {total > PAGE_SIZE && (
              <div
                className={css`
                  display: flex;
                  justify-content: center;
                  margin: 24px 0 75px;
                `}
              >
                <Pagination
                  current={currentPage}
                  total={total}
                  pageSize={PAGE_SIZE}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                  showQuickJumper={total > PAGE_SIZE * 5}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default Gallery;
