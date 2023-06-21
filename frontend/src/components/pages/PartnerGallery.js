import React, { useState, useEffect } from "react";
import { fetchPartners } from "../../utils/api";
import { Input, Checkbox, Modal, Result, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import MenteeButton from "../MenteeButton";
import "../css/Gallery.scss";
import { useAuth } from "../../utils/hooks/useAuth";
import PartnerCard from "../PartnerCard";
import { getRegions, getSDGs } from "utils/consts";
import { useTranslation } from "react-i18next";

function PartnerGallery() {
  const { t } = useTranslation();
  const { isAdmin, isPartner } = useAuth();
  const [partners, setPartners] = useState([]);
  const [regions, setRegions] = useState([]);
  const [query, setQuery] = useState();
  const [mobileFilterVisible, setMobileFilterVisible] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [query2, setQuery2] = useState();
  const [sdgs, setSdgs] = useState([]);

  useEffect(() => {
    async function getPartners() {
      const Partner_data = await fetchPartners();
      if (Partner_data) {
        setPartners(Partner_data);
      }
    }

    getPartners();
  }, []);

  useEffect(() => {
    if (isPartner || isAdmin) {
      setPageLoaded(true);
    }
  }, [isPartner, isAdmin]);

  const getFilterdPartners = () =>
    partners.filter((partner) => {
      // matches<Property> is true if no options selected, or if partner has AT LEAST one of the selected options
      const matchesSpecializations =
        regions.length === 0 ||
        regions.some((s) => partner.regions.indexOf(s) >= 0);
      const matchSdgs =
        sdgs.length === 0 || sdgs.some((s) => partner.sdgs.indexOf(s) >= 0);
      const matchestopics =
        !query2 || partner.topics.toUpperCase().includes(query2.toUpperCase());
      const matchesName =
        !query ||
        partner.organization.toUpperCase().includes(query.toUpperCase());

      return (
        matchesSpecializations && matchesName && matchestopics && matchSdgs
      );
    });

  // Add some kind of error 403 code
  return !isPartner && !isAdmin ? (
    <Result
      status="403"
      title="403"
      subTitle={t("gallery.unauthorizedAccess")}
    />
  ) : (
    <>
      <MenteeButton
        onClick={() => setMobileFilterVisible(true)}
        content={t("gallery.filter")}
        id="filter-button"
      />
      <Modal
        onCancel={() => {
          setMobileFilterVisible(false);
        }}
        visible={mobileFilterVisible}
        footer={[
          <MenteeButton
            content={t("common.apply")}
            key="apply"
            onClick={() => setMobileFilterVisible(false)}
          />,
          <MenteeButton
            content={t("common.cancel")}
            key="cancel"
            onClick={() => {
              setMobileFilterVisible(false);
              setRegions([]);
              setQuery("");
            }}
          />,
        ]}
      >
        <div className="no-margin gallery-filter-container">
          <div className="gallery-filter-header">{t("gallery.filterBy")}</div>
          <div className="gallery-filter-section-title">
            {t("gallery.organization")}{" "}
          </div>
          <Input
            placeholder={t("gallery.organizationPlaceholder")}
            prefix={<SearchOutlined />}
            style={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="gallery-filter-section-title">
            {t("gallery.regions")}
          </div>
          <Checkbox.Group
            defaultValue={regions}
            options={getRegions(t)}
            onChange={(checked) => setRegions(checked)}
            value={regions}
          />
          <div className="gallery-filter-section-title">
            {t("gallery.projectTopics")}
          </div>
          <Input
            placeholder={t("gallery.projectTopicsPlaceholder")}
            prefix={<SearchOutlined />}
            style={styles.searchInput}
            value={query2}
            onChange={(e) => setQuery2(e.target.value)}
          />
          <div className="gallery-filter-section-title">
            {t("gallery.sdgs")}
          </div>
          <Checkbox.Group
            defaultValue={sdgs}
            options={getSDGs(t)}
            onChange={(checked) => setSdgs(checked)}
            value={sdgs}
          />
        </div>
      </Modal>

      <div className="gallery-container">
        <div className="gallery-filter-container mobile-invisible">
          <div className="gallery-filter-header">{t("gallery.filterBy")}</div>
          <div className="gallery-filter-section-title">
            {t("gallery.organization")}
          </div>
          <Input
            placeholder={t("gallery.organizationPlaceholder")}
            prefix={<SearchOutlined />}
            style={styles.searchInput}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="gallery-filter-section-title">
            {t("gallery.regions")}
          </div>
          <Checkbox.Group
            defaultValue={regions}
            options={getRegions(t)}
            onChange={(checked) => setRegions(checked)}
          />
          <div className="gallery-filter-section-title">
            {t("gallery.projectTopics")}
          </div>
          <Input
            placeholder={t("gallery.projectTopicsPlaceholder")}
            prefix={<SearchOutlined />}
            style={styles.searchInput}
            value={query2}
            onChange={(e) => setQuery2(e.target.value)}
          />
          <div className="gallery-filter-section-title">
            {t("gallery.sdgs")}
          </div>
          <Checkbox.Group
            defaultValue={sdgs}
            options={getSDGs(t)}
            onChange={(checked) => setSdgs(checked)}
            value={sdgs}
          />
        </div>

        <div className="gallery-mentor-container">
          {!pageLoaded ? (
            <div className="loadingIcon">
              {" "}
              <Spin />{" "}
            </div>
          ) : (
            getFilterdPartners().map((partner, key) => (
              <PartnerCard
                key={key}
                organization={partner.organization}
                email={partner.email}
                location={partner.location}
                regions={partner.regions}
                website={partner.website}
                linkedin={partner.linkedin}
                video={partner.video}
                id={partner._id["$oid"]}
                firebase_uid={partner.firebase_uid}
                image={partner.image}
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

export default PartnerGallery;
