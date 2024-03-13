import React, { useState, useEffect } from "react";
import { fetchPartners, fetchMentees } from "utils/api";
import MenteeCard from "../MenteeCard";
import {
  Input,
  Checkbox,
  Modal,
  Result,
  Spin,
  theme,
  Typography,
  Select,
  Affix,
  Button,
  FloatButton,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import "../css/Gallery.scss";
import { useLocation } from "react-router";
import { useAuth } from "../../utils/hooks/useAuth";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { getTranslatedOptions } from "utils/translations";
import { css } from "@emotion/css";

const { Title } = Typography;

function Gallery(props) {
  const {
    token: { colorPrimaryBg, colorPrimary },
  } = theme.useToken();
  const { t } = useTranslation();
  const options = useSelector((state) => state.options);
  const { isAdmin, isPartner } = useAuth();
  const [mentees, setMentees] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [interests, setInterests] = useState([]);
  const [query, setQuery] = useState();
  const [mobileFilterVisible, setMobileFilterVisible] = useState(false);
  const location = useLocation();
  const [pageLoaded, setPageLoaded] = useState(false);
  const [allPartners, setAllPartners] = useState([]);
  const [selectedPartnerID, setSelectedPartnerID] = useState(undefined);
  const verified = location.state && location.state.verified;
  const user = useSelector((state) => state.user.user);
  useEffect(() => {
    async function getMentees() {
      const mentee_data = await fetchMentees();
      if (mentee_data) {
        if (user && user.pair_partner && user.pair_partner.restricted) {
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
          var restricted_partners = await fetchPartners(true, null);
          if (
            !isAdmin &&
            restricted_partners &&
            restricted_partners.length > 0
          ) {
            var assigned_mentee_ids = [];
            restricted_partners.map((partner_item) => {
              if (partner_item.assign_mentees) {
                partner_item.assign_mentees.map((assign_item) => {
                  assigned_mentee_ids.push(assign_item.id);
                  return false;
                });
              }
              return false;
            });
            temp = [];
            mentee_data.map((mentee_item) => {
              if (!assigned_mentee_ids.includes(mentee_item._id.$oid)) {
                temp.push(mentee_item);
              }
              return false;
            });
            setMentees(temp);
          } else {
            setMentees(mentee_data);
          }
        }
      }
      setPageLoaded(true);
    }

    getMentees();

    async function getAllPartners() {
      var all_data = [];
      if (isAdmin) {
        all_data = await fetchPartners(undefined, null);
      } else {
        if (user && user.pair_partner && user.pair_partner.restricted) {
          all_data = [user.pair_partner];
        } else {
          all_data = await fetchPartners(false, null);
        }
      }
      var temp = [];
      all_data.map((item) => {
        temp.push({
          value: item.id ? item.id : item._id["$oid"],
          label: item.organization,
        });
        return false;
      });
      setAllPartners(temp);
    }
    getAllPartners();
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
        interests.length === 0 ||
        interests.some((l) => specializs.indexOf(l) >= 0);
      const matchPartner =
        !selectedPartnerID ||
        (mentee.pair_partner && mentee.pair_partner.id === selectedPartnerID);
      return matchesLanguages && matchesName && matchInterests && matchPartner;
    });
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
      <Title level={4}>{t("gallery.menteeInterests")}</Title>
      <Select
        className={css`
          width: 100%;
        `}
        allowClear
        defaultValue={interests}
        mode="multiple"
        placeholder={t("gallery.menteeInterests")}
        options={options.specializations}
        onChange={(selected) => setInterests(selected)}
        maxTagCount="responsive"
      />
    </>
  );

  // Add some kind of error 403 code
  return isPartner ? (
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
            <Spin size="large" spinning />
          </div>
        ) : (
          <div className="gallery-mentor-container">
            {getFilteredMentees().map((mentee, key) => {
              return (
                <MenteeCard
                  key={key}
                  name={mentee.name}
                  languages={getTranslatedOptions(
                    mentee.languages,
                    options.languages
                  )}
                  location={mentee.location}
                  gender={mentee.gender}
                  organization={mentee.organization}
                  image={mentee.image}
                  video={mentee.video}
                  age={mentee.age}
                  id={mentee._id["$oid"]}
                  pair_partner={mentee.pair_partner}
                  isSupport={props.isSupport}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default Gallery;
