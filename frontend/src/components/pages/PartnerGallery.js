import React, { useState, useEffect, useCallback, useRef } from "react";
import { searchPartners, fetchAccounts } from "../../utils/api";
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
  Pagination,
  Empty,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import "../css/Gallery.scss";
import { useAuth } from "../../utils/hooks/useAuth";
import { useDebounce } from "../../utils/hooks/useDebounce";
import PartnerCard from "../PartnerCard";
import { ACCOUNT_TYPE, getRegions, getSDGs } from "utils/consts";
import { useTranslation } from "react-i18next";
import { css } from "@emotion/css";
import { useSelector } from "react-redux";
import { getRole } from "utils/auth.service";

const { Title, Text } = Typography;

const PAGE_SIZE = 24;

function PartnerGallery(props) {
  const {
    token: { colorPrimaryBg },
  } = theme.useToken();
  const { t } = useTranslation();
  const { isAdmin, isPartner, isGuest, isHub } = useAuth();
  const [partners, setPartners] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
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
  const [currentPage, setCurrentPage] = useState(1);
  const role = getRole();

  const debouncedQuery = useDebounce(query, 300);
  const debouncedQuery2 = useDebounce(query2, 300);
  const debouncedQueryName = useDebounce(queryName, 300);

  // Fetch hub options for the dropdown (SUPPORT role)
  useEffect(() => {
    async function getHubData() {
      var temp = [];
      const hub_data = await fetchAccounts(ACCOUNT_TYPE.HUB);
      hub_data.map((hub_item) => {
        temp.push({ label: hub_item.name, value: hub_item._id.$oid });
        return true;
      });
      setHubOptions(temp);
    }

    if (user) {
      getHubData();
    }
  }, [user]);

  // Race condition guard
  const requestIdRef = useRef(0);

  const fetchPage = useCallback(
    async (page) => {
      if (!user) return;

      const requestId = ++requestIdRef.current;
      setLoading(true);

      const params = {
        page: page,
        page_size: PAGE_SIZE,
      };

      if (debouncedQuery) {
        params.search = debouncedQuery;
      }
      if (debouncedQueryName) {
        params.search_name = debouncedQueryName;
      }
      if (debouncedQuery2) {
        params.topics = debouncedQuery2;
      }
      if (regions.length > 0) {
        params.regions = regions.join(",");
      }
      if (sdgs.length > 0) {
        params.sdgs = sdgs.join(",");
      }

      if (role == ACCOUNT_TYPE.HUB) {
        if (user.hub_id) {
          params.hub_id = user.hub_id;
        } else {
          params.hub_id = user._id.$oid;
        }
      } else if (role == ACCOUNT_TYPE.SUPPORT) {
        if (searchHub) {
          params.hub_id = searchHub;
        } else {
          params.include_hubs = true;
        }
      }

      try {
        const result = await searchPartners(params);
        if (requestId !== requestIdRef.current) return;
        if (result) {
          setPartners(result.accounts || []);
          setTotal(result.total || 0);
        } else {
          setPartners([]);
          setTotal(0);
        }
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        console.error(err);
        setPartners([]);
        setTotal(0);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setPageLoaded(true);
        }
      }
    },
    [
      user,
      debouncedQuery,
      debouncedQueryName,
      debouncedQuery2,
      regions,
      sdgs,
      searchHub,
      role,
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

  const handleClearFilters = () => {
    setQuery(undefined);
    setQuery2(undefined);
    setQueryName(undefined);
    setRegions([]);
    setSdgs([]);
    setSearchHub(null);
  };

  const getFilterForm = () => (
    <>
      {(user &&
        user.hub_user &&
        user.hub_user.url &&
        user.hub_user.url.includes("AUAF")) ||
      (user &&
        user.role === ACCOUNT_TYPE.HUB &&
        user.url &&
        user.url.includes("AUAF")) ? (
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
            value={queryName}
            onChange={(e) => setQueryName(e.target.value)}
            allowClear
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            allowClear
          />
          <Title level={4}>{t("gallery.regions")}</Title>
          <Select
            placeholder={t("gallery.regions")}
            onChange={(value) => {
              setRegions(value);
            }}
            value={regions}
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
            (user &&
              user.role === ACCOUNT_TYPE.HUB &&
              user.url === "GSRFoundation")
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
              (user &&
                user.role === ACCOUNT_TYPE.HUB &&
                user.url === "GSRFoundation")
                ? t("gallery.projectTopicsPlaceholder_GSR")
                : t("gallery.projectTopicsPlaceholder")
            }
            allowClear
            value={query2}
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
        value={sdgs}
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
            value={searchHub}
            options={hubOptions}
            onChange={(selected) => setSearchHub(selected)}
            maxTagCount="responsive"
          />
        </>
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
              handleClearFilters();
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
            {partners.length === 0 && !loading ? (
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
                {partners.map((partner) => (
                  <PartnerCard
                    key={partner.id ? partner.id : partner._id["$oid"]}
                    organization={partner.organization}
                    person_name={partner.person_name}
                    title={partner.title}
                    email={partner.email}
                    location={partner.location}
                    regions={partner.regions}
                    website={partner.website}
                    linkedin={partner.linkedin}
                    video={partner.video}
                    id={partner.id ? partner.id : partner._id["$oid"]}
                    firebase_uid={partner.firebase_uid}
                    image={partner.image}
                    isSupport={props.isSupport}
                    hub_user={partner.hub_user}
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

export default PartnerGallery;
