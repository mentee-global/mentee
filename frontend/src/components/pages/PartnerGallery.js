import React, { useState, useEffect } from "react";
import { fetchPartners, fetchAccounts } from "../../utils/api";
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
  const [queryName, setQueryName] = useState();
  const [sdgs, setSdgs] = useState([]);
  const [searchHub, setSearchHub] = useState(null);
  const { user } = useSelector((state) => state.user);
  const [hubOptions, setHubOptions] = useState([]);
  const role = getRole();

  useEffect(() => {
    async function getPartners(hub_user_id) {
      const Partner_data = await fetchPartners(undefined, hub_user_id);
      if (Partner_data) {
        setPartners(Partner_data);
      }
      setPageLoaded(true);
    }

    async function getHubData() {
      var temp = [];
      const hub_data = await fetchAccounts(ACCOUNT_TYPE.HUB);
      hub_data.map((hub_item) => {
        temp.push({ label: hub_item.name, value: hub_item._id.$oid });
        return true;
      });
      setHubOptions(temp);
    }

    var hub_user_id = null;
    if (role == ACCOUNT_TYPE.HUB && user) {
      if (user.hub_id) {
        hub_user_id = user.hub_id;
      } else {
        hub_user_id = user._id.$oid;
      }
    }
    if (role == ACCOUNT_TYPE.SUPPORT) {
      hub_user_id = "";
    }
    if (user) {
      getPartners(hub_user_id);
      getHubData();
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
      const matchHub =
        !(role == ACCOUNT_TYPE.SUPPORT) ||
        !searchHub ||
        (partner.hub_id && partner.hub_id == searchHub);

      let matchestopics = false;
      if (
        (user && user.hub_user && user.hub_user.url === "GSRFoundation") ||
        (user.role === ACCOUNT_TYPE.HUB && user.url === "GSRFoundation")
      ) {
        matchestopics =
          !query2 ||
          (partner.topics &&
            partner.topics.toUpperCase().includes(query2.toUpperCase())) ||
          (partner.success &&
            partner.success.toUpperCase().includes(query2.toUpperCase()));
      } else {
        matchestopics =
          !query2 ||
          (partner.topics &&
            partner.topics.toUpperCase().includes(query2.toUpperCase()));
      }

      let matchesName = false;
      if (
        (user && user.hub_user && user.hub_user.url.includes("AUAF")) ||
        (user.role === ACCOUNT_TYPE.HUB && user.url.includes("AUAF"))
      ) {
        matchesName =
          !queryName ||
          partner.person_name.toUpperCase().includes(queryName.toUpperCase());
      } else {
        matchesName =
          !query ||
          partner.organization.toUpperCase().includes(query.toUpperCase());
      }

      return (
        matchesSpecializations &&
        matchesName &&
        matchestopics &&
        matchSdgs &&
        matchHub
      );
    });

  const getFilterForm = () => (
    <>
      {(user && user.hub_user && user.hub_user.url.includes("AUAF")) ||
      (user.role === ACCOUNT_TYPE.HUB && user.url.includes("AUAF")) ? (
        <>
          <Title
            level={4}
            className={css`
              margin-top: 0;
            `}
          >
            {t("common.name")}
          </Title>
          <Input
            placeholder={t("common.requiredFullName")}
            prefix={<SearchOutlined />}
            onChange={(e) => setQueryName(e.target.value)}
          />
        </>
      ) : (
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
          <Title level={4}>
            {(user && user.hub_user && user.hub_user.url === "GSRFoundation") ||
            (user.role === ACCOUNT_TYPE.HUB && user.url === "GSRFoundation")
              ? t("gallery.projectTopicsPlaceholder_GSR")
              : t("gallery.projectTopics")}
          </Title>
          <Input
            className={css`
              width: 100%;
            `}
            placeholder={
              (user &&
                user.hub_user &&
                user.hub_user.url === "GSRFoundation") ||
              (user.role === ACCOUNT_TYPE.HUB && user.url === "GSRFoundation")
                ? t("gallery.projectTopicsPlaceholder_GSR")
                : t("gallery.projectTopicsPlaceholder")
            }
            allowClear
            onChange={(e) => setQuery2(e.target.value)}
            prefix={<SearchOutlined />}
          />
        </>
      )}
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
      {role == ACCOUNT_TYPE.SUPPORT && (
        <>
          <Title level={4}>HUB</Title>
          <Select
            className={css`
              width: 100%;
            `}
            placeholder={"HUB"}
            allowClear
            // mode="multiple"
            options={hubOptions}
            onChange={(selected) => setSearchHub(selected)}
            maxTagCount="responsive"
          />
        </>
      )}
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
          <Button type="primary" onClick={() => setMobileFilterVisible(false)}>
            {t("common.apply")}
          </Button>,
          <Button
            onClick={() => {
              setMobileFilterVisible(false);
              setRegions([]);
              setQuery("");
              setQueryName("");
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
              max-width: 250px;
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
                person_name={partner.person_name}
                title={partner.title}
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
                hub_user={partner.hub_user}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default PartnerGallery;
