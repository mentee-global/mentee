import React, { useState, useEffect } from "react";
import { fetchAccounts } from "../../utils/api";
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
import HubCard from "../HubCard";
import { ACCOUNT_TYPE, getRegions, getSDGs } from "utils/consts";
import { useTranslation } from "react-i18next";
import { css } from "@emotion/css";
import { useSelector } from "react-redux";
import { getRole } from "utils/auth.service";

const { Title } = Typography;

function HubGallery(props) {
  const {
    token: { colorPrimaryBg },
  } = theme.useToken();
  const { t } = useTranslation();
  const { isAdmin, isPartner, isGuest, isHub } = useAuth();
  const [hubs, setHubs] = useState([]);
  const [regions, setRegions] = useState([]);
  const [query, setQuery] = useState();
  const [mobileFilterVisible, setMobileFilterVisible] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [query2, setQuery2] = useState();
  const [sdgs, setSdgs] = useState([]);
  const { user } = useSelector((state) => state.user);

  useEffect(() => {
    async function getHubs() {
      const HubData = await fetchAccounts(ACCOUNT_TYPE.HUB);
      if (HubData) {
        setHubs(HubData);
      }
      setPageLoaded(true);
    }

    if (user) {
      getHubs();
    }
  }, [user]);

  const getFilterdHubs = () =>
    hubs.filter((item) => {
      const matchesName =
        !query || item.name.toUpperCase().includes(query.toUpperCase());

      return matchesName;
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
        onChange={(e) => setQuery(e.target.value)}
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
            {getFilterdHubs().map((hub, key) => (
              <HubCard
                key={key}
                name={hub.name}
                email={hub.email}
                id={hub._id["$oid"]}
                firebase_uid={hub.firebase_uid}
                image={hub.image}
                url={hub.url}
                isSupport={props.isSupport}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default HubGallery;
