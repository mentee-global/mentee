import React, { useState, useEffect } from "react";
import { fetchPartners } from "../../utils/api";
import {
  Input,
  Modal,
  Result,
  Spin,
  FloatButton,
  Affix,
  Select,
  Typography,
  theme,
  Button,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import "../css/Gallery.scss";
import { useAuth } from "../../utils/hooks/useAuth";
import PartnerCard from "../PartnerCard";
import { ACCOUNT_TYPE, getRegions, getSDGs } from "utils/consts";
import { useTranslation } from "react-i18next";
import { css } from "@emotion/css";
import { useSelector } from "react-redux";
import { getRole } from "utils/auth.service";

const { Title } = Typography;

function PartnerGallery(props) {
  const {
    token: { colorPrimaryBg },
  } = theme.useToken();
  const { t } = useTranslation();
  const { isAdmin, isPartner, isGuest, isHub } = useAuth();
  const [partners, setPartners] = useState([]);
  const [regions, setRegions] = useState([]);
  const [query, setQuery] = useState();
  const [mobileFilterVisible, setMobileFilterVisible] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [query2, setQuery2] = useState();
  const [sdgs, setSdgs] = useState([]);
  const { user } = useSelector((state) => state.user);
  const role = getRole();

  useEffect(() => {
    async function getPartners(hub_user_id) {
      const Partner_data = await fetchPartners(undefined, hub_user_id);
      if (Partner_data) {
        setPartners(Partner_data);
      }
      setPageLoaded(true);
    }

    var hub_user_id = null;
    if (role == ACCOUNT_TYPE.HUB && user) {
      if (user.hub_id) {
        hub_user_id = user.hub_id;
      } else {
        hub_user_id = user._id.$oid;
      }
    }
    if (user) {
      getPartners(hub_user_id);
    }
  }, [user]);

  const getFilterdPartners = () =>
    partners.filter((partner) => {
      // matches<Property> is true if no options selected, or if partner has AT LEAST one of the selected options
      const matchesSpecializations =
        regions.length === 0 ||
        regions.some((s) => partner.regions.indexOf(s) >= 0);
      const matchSdgs =
        sdgs.length === 0 || sdgs.some((s) => partner.sdgs.indexOf(s) >= 0);
      const matchestopics =
        !query2 ||
        (partner.topics &&
          partner.topics.toUpperCase().includes(query2.toUpperCase()));
      const matchesName =
        !query ||
        partner.organization.toUpperCase().includes(query.toUpperCase());

      return (
        matchesSpecializations && matchesName && matchestopics && matchSdgs
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
        {t("gallery.organization")}
      </Title>
      <Input
        placeholder={t("gallery.organizationPlaceholder")}
        prefix={<SearchOutlined />}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Title level={4}>{t("gallery.regions")}</Title>
      <Select
        placeholder={t("gallery.regions")}
        onChange={(value) => {
          setRegions(value);
        }}
        options={getRegions(t)}
        className={css`
          width: 100%;
        `}
        allowClear
        mode="multiple"
        maxTagCount="responsive"
      />
      <Title level={4}>{t("gallery.projectTopics")}</Title>
      <Input
        className={css`
          width: 100%;
        `}
        placeholder={t("gallery.projectTopicsPlaceholder")}
        allowClear
        onChange={(e) => setQuery2(e.target.value)}
        prefix={<SearchOutlined />}
      />
      <Title level={4}>{t("gallery.sdgs")}</Title>
      <Select
        className={css`
          width: 100%;
        `}
        placeholder={t("gallery.sdgs")}
        allowClear
        mode="multiple"
        options={getSDGs(t)}
        onChange={(selected) => setSdgs(selected)}
        maxTagCount="responsive"
      />
    </>
  );

  // Add some kind of error 403 code
  return !props.isSupport && !isPartner && !isAdmin && !isGuest && !isHub ? (
    <Result
      status="403"
      title="403"
      subTitle={t("gallery.unauthorizedAccess")}
    />
  ) : (
    <>
      {isHub ? (
        <></>
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
              <Button
                type="primary"
                onClick={() => setMobileFilterVisible(false)}
              >
                {t("common.apply")}
              </Button>,
              <Button
                onClick={() => {
                  setMobileFilterVisible(false);
                  setRegions([]);
                  setQuery("");
                }}
              >
                {t("common.cancel")}
              </Button>,
            ]}
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
                <Spin size="large" loading />
              </div>
            ) : (
              <div className="gallery-mentor-container">
                {getFilterdPartners().map((partner, key) => (
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
                    isSupport={props.isSupport}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
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
