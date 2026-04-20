import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  Breadcrumb,
  Input,
  Spin,
  message,
  Tooltip,
  Typography,
  Switch,
  Select,
} from "antd";
import {
  DownloadOutlined,
  ReloadOutlined,
  PlusOutlined,
  UserOutlined,
  FilterOutlined,
  ClearOutlined,
  SearchOutlined,
  ClusterOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import "../css/AdminAccountData.scss";
import {
  fetchMentorsAppointments,
  downloadMentorsData,
  downloadMenteesData,
  deleteAccountById,
  fetchMenteesAppointments,
  fetchAccounts,
  downloadPartnersData,
  downloadHubsData,
  downloadGuestsData,
  downloadSupportersData,
  downloadModeratorsData,
} from "../../utils/api";
import { SortByApptDropdown, HubsDropdown } from "../AdminDropdowns";
import UploadEmails from "../UploadEmails";
import AddGuestModal from "../AddGuestModal";
import AdminDataTable from "../AdminDataTable";
import { useAuth } from "utils/hooks/useAuth";
import {
  ACCOUNT_TYPE,
  EFFECTIVE_STAGE,
  EFFECTIVE_STAGE_LABELS,
  EFFECTIVE_STAGE_DESCRIPTIONS,
} from "utils/consts";

const keys = {
  MENTORS: 0,
  MENTEES: 1,
  PARTNER: 2,
  GUEST: 4,
  SUPPORT: 5,
  HUB: 6,
  MODERATOR: 7,
  ASCENDING: 0,
  DESCENDING: 1,
};

// Get display name for current view
const getViewTitle = (displayOption) => {
  switch (displayOption) {
    case keys.MENTORS:
      return "Mentors";
    case keys.MENTEES:
      return "Mentees";
    case keys.PARTNER:
      return "Partners";
    case keys.GUEST:
      return "Guests";
    case keys.SUPPORT:
      return "Supporters";
    case keys.HUB:
      return "Hubs";
    case keys.MODERATOR:
      return "Moderators";
    default:
      return "All Accounts";
  }
};

// Account type tabs configuration
const ACCOUNT_TABS = [
  { key: keys.MENTORS, label: "Mentors", accountType: ACCOUNT_TYPE.MENTOR },
  { key: keys.MENTEES, label: "Mentees", accountType: ACCOUNT_TYPE.MENTEE },
  { key: keys.PARTNER, label: "Partners", accountType: ACCOUNT_TYPE.PARTNER },
  { key: keys.HUB, label: "Hubs", accountType: ACCOUNT_TYPE.HUB },
  { key: keys.GUEST, label: "Guests", accountType: ACCOUNT_TYPE.GUEST },
  { key: keys.SUPPORT, label: "Supporters", accountType: ACCOUNT_TYPE.SUPPORT },
  {
    key: keys.MODERATOR,
    label: "Moderators",
    accountType: ACCOUNT_TYPE.MODERATOR,
  },
];

function AdminAccountData() {
  const [isReloading, setIsReloading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [reload, setReload] = useState(true);
  const [displayData, setDisplayData] = useState([]);
  const [displayOption, setDisplayOption] = useState(keys.MENTORS);
  const [downloadFile, setDownloadFile] = useState(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [guestModalVisible, setGuestModalVisible] = useState(false);
  const { onAuthStateChanged } = useAuth();
  const [hubOptions, setHubOptions] = useState([]);
  const [resetFilters, setResetFilters] = useState(false);
  const [searchHubUserId, setSearchHubUserId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [partnerSearchText, setPartnerSearchText] = useState("");

  // Extra filters (all default to "all"). These compose AND-wise with the
  // existing search filters via the filterData useMemo below.
  const [stageFilter, setStageFilter] = useState("all");
  const [hasPictureFilter, setHasPictureFilter] = useState("all");
  const [hasVideoFilter, setHasVideoFilter] = useState("all");
  const [takingAppointmentsFilter, setTakingAppointmentsFilter] =
    useState("all");
  const [pausedFilter, setPausedFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState(null);

  // Include Hub Accounts toggle (only for Partners view)
  const [includeHubAccounts, setIncludeHubAccounts] = useState(false);

  // Track active filters for UI feedback
  const hasActiveFilters =
    searchText ||
    partnerSearchText ||
    searchHubUserId ||
    stageFilter !== "all" ||
    hasPictureFilter !== "all" ||
    hasVideoFilter !== "all" ||
    takingAppointmentsFilter !== "all" ||
    pausedFilter !== "all";

  // Compose every active filter into one derived array. Keeping this in a
  // useMemo means the individual handlers below just update state — they
  // never overwrite one another's results like the old setFilterData calls.
  const filterData = useMemo(() => {
    let out = displayData;

    if (searchText) {
      const re = new RegExp(searchText, "i");
      out = out.filter((acc) =>
        displayOption === keys.PARTNER
          ? acc.organization?.match(re)
          : acc.name?.match(re)
      );
    }
    if (partnerSearchText) {
      const re = new RegExp(partnerSearchText, "i");
      out = out.filter((acc) => acc.partner?.match(re));
    }
    if (searchHubUserId && displayOption === keys.PARTNER) {
      out = out.filter((acc) => acc.hub_id === searchHubUserId);
    }
    if (stageFilter !== "all") {
      out = out.filter((acc) => acc.effective_stage === stageFilter);
    }
    if (hasPictureFilter !== "all") {
      const want = hasPictureFilter === "yes" ? "Yes" : "No";
      out = out.filter((acc) => acc.profilePicUp === want);
    }
    if (hasVideoFilter !== "all") {
      const want = hasVideoFilter === "yes" ? "Yes" : "No";
      out = out.filter((acc) => acc.videosUp === want);
    }
    if (takingAppointmentsFilter !== "all") {
      const want = takingAppointmentsFilter === "yes";
      out = out.filter((acc) => Boolean(acc.taking_appointments) === want);
    }
    if (pausedFilter !== "all") {
      const want = pausedFilter === "yes";
      out = out.filter((acc) => Boolean(acc.paused_flag) === want);
    }

    if (sortOrder === keys.ASCENDING || sortOrder === keys.DESCENDING) {
      const asc = sortOrder === keys.ASCENDING;
      out = [...out].sort((a, b) => {
        if (a.appointments && b.appointments) {
          return asc
            ? b.appointments.length - a.appointments.length
            : a.appointments.length - b.appointments.length;
        }
        return asc
          ? (b.numOfAppointments || 0) - (a.numOfAppointments || 0)
          : (a.numOfAppointments || 0) - (b.numOfAppointments || 0);
      });
    }

    return out;
  }, [
    displayData,
    displayOption,
    searchText,
    partnerSearchText,
    searchHubUserId,
    stageFilter,
    hasPictureFilter,
    hasVideoFilter,
    takingAppointmentsFilter,
    pausedFilter,
    sortOrder,
  ]);

  // Check if current tab supports download
  const canDownload = [
    keys.MENTORS,
    keys.MENTEES,
    keys.PARTNER,
    keys.HUB,
    keys.GUEST,
    keys.SUPPORT,
    keys.MODERATOR,
  ].includes(displayOption);

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
    getHubData();
  }, []);

  useEffect(() => {
    async function getData() {
      setIsReloading(true);

      switch (displayOption) {
        case keys.MENTEES:
          const menteeRes = await fetchMenteesAppointments();
          if (menteeRes) {
            const newMenteeData = menteeRes.menteeData.map((elem) => ({
              ...elem,
              isMentee: true,
            }));
            setDisplayData(newMenteeData);
          } else {
            message.error("Could not fetch account data");
          }
          break;
        case keys.MENTORS:
          const mentorRes = await fetchMentorsAppointments();
          if (mentorRes) {
            setDisplayData(mentorRes.mentorData);
          } else {
            message.error("Could not fetch account data");
          }
          break;
        case keys.PARTNER:
          // Fetch Partners with optional Hub accounts inclusion
          const Partners = await fetchAccounts(
            ACCOUNT_TYPE.PARTNER,
            undefined,
            "",
            includeHubAccounts
          );
          var partners_data = [];
          if (Partners) {
            Partners.map((item) => {
              item.restricted_show = item.restricted ? "Yes" : "No";
              item.mentor_nums = item.assign_mentors
                ? item.assign_mentors.length
                : 0;
              item.mentee_nums = item.assign_mentees
                ? item.assign_mentees.length
                : 0;
              partners_data.push(item);
              return true;
            });
          }

          setDisplayData(partners_data);
          break;
        case keys.HUB:
          const Hubs = await fetchAccounts(ACCOUNT_TYPE.HUB);
          setDisplayData(Hubs);
          break;
        case keys.GUEST:
          const Guests = await fetchAccounts(ACCOUNT_TYPE.GUEST);
          setDisplayData(Guests);
          break;
        case keys.SUPPORT:
          const Supporters = await fetchAccounts(ACCOUNT_TYPE.SUPPORT);
          setDisplayData(Supporters);
          break;
        case keys.MODERATOR:
          const Moderator = await fetchAccounts(ACCOUNT_TYPE.MODERATOR);
          setDisplayData(Moderator);
          break;
        default:
          break;
      }
      setIsReloading(false);
    }

    onAuthStateChanged(getData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload, displayOption, includeHubAccounts]);

  const handleDeleteAccount = async (id, accountType, name) => {
    try {
      const success = await deleteAccountById(id, accountType);
      if (success) {
        message.success(`Successfully deleted ${name}`);
        setReload(!reload);
      } else {
        message.error(`Could not delete ${name}`);
      }
    } catch (error) {
      message.error(`Error deleting ${name}: ${error.message}`);
    }
  };

  const handleAddAccount = () => {
    setUploadModalVisible(true);
  };

  const handleAddGuest = () => {
    setGuestModalVisible(true);
  };

  // Download handler - uses current active tab to determine what to download
  const handleDownload = async () => {
    if (!canDownload) {
      message.info("Download not available for this account type");
      return;
    }

    setIsDownloading(true);
    try {
      // When filters are active on a Mentor/Mentee tab, send only the IDs
      // that are currently visible so the export matches the view.
      const filteredIds = hasActiveFilters
        ? filterData.map((r) => r._id?.$oid || r.id).filter(Boolean)
        : null;

      switch (displayOption) {
        case keys.MENTORS:
          await downloadMentorsData(filteredIds ? { ids: filteredIds } : {});
          break;
        case keys.MENTEES:
          await downloadMenteesData(filteredIds ? { ids: filteredIds } : {});
          break;
        case keys.PARTNER:
          // Pass includeHubAccounts to download function
          await downloadPartnersData(searchHubUserId, includeHubAccounts);
          break;
        case keys.HUB:
          await downloadHubsData();
          break;
        case keys.GUEST:
          await downloadGuestsData();
          break;
        case keys.SUPPORT:
          await downloadSupportersData();
          break;
        case keys.MODERATOR:
          await downloadModeratorsData();
          break;
        default:
          break;
      }
      message.success(
        `Downloaded ${getViewTitle(displayOption)} data successfully`
      );
    } catch (error) {
      message.error(`Failed to download data`);
      console.error(error);
    }
    setIsDownloading(false);
  };

  // Sort order, search text, and every other filter state feed the
  // filterData useMemo above, so these handlers only update state.
  const handleSortData = (key) => {
    setSortOrder(key);
  };

  const handleAccountDisplay = (key) => {
    setDisplayOption(key);
    handleResetFilters();
    setReload(!reload);
  };

  const searchbyHub = (key) => {
    setSearchHubUserId(key || null);
  };

  const handleSearchByPartner = (partner_name) => {
    setPartnerSearchText(partner_name);
  };

  const handleSearchAccount = (name) => {
    setSearchText(name);
  };

  const handleResetFilters = () => {
    setResetFilters(!resetFilters);
    setSearchHubUserId(null);
    setSearchText("");
    setPartnerSearchText("");
    setStageFilter("all");
    setHasPictureFilter("all");
    setHasVideoFilter("all");
    setTakingAppointmentsFilter("all");
    setPausedFilter("all");
    setSortOrder(null);
  };

  // Handle Include Hub Accounts toggle
  const handleIncludeHubsChange = (checked) => {
    setIncludeHubAccounts(checked);
    // Data will refetch automatically due to useEffect dependency
  };

  return (
    <div className="account-data-body">
      <div style={{ display: "none" }}>
        <iframe src={downloadFile} title="download" />
      </div>

      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <Breadcrumb.Item>User Reports</Breadcrumb.Item>
        <Breadcrumb.Item>
          <a href="account-data">Account Data</a>
        </Breadcrumb.Item>
      </Breadcrumb>

      {/* Filters Section - Clean Card Design */}
      <div className="filters-section">
        <div className="filters-row">
          {/* Search by Name */}
          <div className="filter-group">
            <span className="filter-label">
              <SearchOutlined style={{ marginRight: 6 }} />
              Search
            </span>
            <Input.Search
              className="filter-search"
              placeholder={
                displayOption === keys.PARTNER
                  ? "Search by organization"
                  : "Search by name"
              }
              value={searchText}
              allowClear
              onChange={(e) => handleSearchAccount(e.target.value)}
              onSearch={handleSearchAccount}
              prefix={<UserOutlined style={{ color: "#9ca3af" }} />}
            />
          </div>

          {/* Hub Filter - Only for Partners */}
          {displayOption === keys.PARTNER && (
            <div className="filter-group">
              <span className="filter-label">
                <FilterOutlined style={{ marginRight: 6 }} />
                Hub
              </span>
              <div className="filter-dropdown">
                <HubsDropdown
                  options={hubOptions}
                  onChange={searchbyHub}
                  onReset={resetFilters}
                />
              </div>
            </div>
          )}

          {/* Partner Affiliation Search - Only for Mentors/Mentees */}
          {(displayOption === keys.MENTORS ||
            displayOption === keys.MENTEES) && (
            <div className="filter-group">
              <span className="filter-label">
                <FilterOutlined style={{ marginRight: 6 }} />
                Partner
              </span>
              <Input.Search
                className="filter-search"
                placeholder="Search by partner affiliation"
                value={partnerSearchText}
                allowClear
                onChange={(e) => handleSearchByPartner(e.target.value)}
                onSearch={handleSearchByPartner}
                style={{ width: 240 }}
              />
            </div>
          )}

          {/* Include Hub Accounts Toggle - Only for Partners */}
          {displayOption === keys.PARTNER && (
            <div className="filter-group">
              <span className="filter-label">
                <ClusterOutlined style={{ marginRight: 6 }} />
                Include Hub Accounts
              </span>
              <Tooltip title="When enabled, Hub accounts will be included in the Partners view and download">
                <Switch
                  checked={includeHubAccounts}
                  onChange={handleIncludeHubsChange}
                  checkedChildren="Yes"
                  unCheckedChildren="No"
                />
              </Tooltip>
            </div>
          )}

          {/* Stage Filter - Mentors/Mentees only */}
          {(displayOption === keys.MENTORS ||
            displayOption === keys.MENTEES) && (
            <div className="filter-group">
              <span className="filter-label">
                <FilterOutlined style={{ marginRight: 6 }} />
                Stage{" "}
                <Tooltip
                  placement="bottomLeft"
                  overlayStyle={{ maxWidth: 420 }}
                  title={
                    <div style={{ lineHeight: 1.5 }}>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>
                        What each stage means
                      </div>
                      <div style={{ marginBottom: 6 }}>
                        <strong>
                          {EFFECTIVE_STAGE_LABELS[EFFECTIVE_STAGE.ACTIVE]}:
                        </strong>{" "}
                        {EFFECTIVE_STAGE_DESCRIPTIONS[EFFECTIVE_STAGE.ACTIVE]}
                      </div>
                      <div>
                        <strong>
                          {EFFECTIVE_STAGE_LABELS[EFFECTIVE_STAGE.UNVERIFIED]}:
                        </strong>{" "}
                        {
                          EFFECTIVE_STAGE_DESCRIPTIONS[
                            EFFECTIVE_STAGE.UNVERIFIED
                          ]
                        }
                      </div>
                    </div>
                  }
                >
                  <InfoCircleOutlined
                    style={{ color: "#8c8c8c", marginLeft: 4, fontSize: 12 }}
                  />
                </Tooltip>
              </span>
              <Select
                value={stageFilter}
                onChange={setStageFilter}
                style={{ width: 220 }}
                options={[
                  { value: "all", label: "All stages" },
                  {
                    value: EFFECTIVE_STAGE.ACTIVE,
                    label: EFFECTIVE_STAGE_LABELS[EFFECTIVE_STAGE.ACTIVE],
                  },
                  {
                    value: EFFECTIVE_STAGE.UNVERIFIED,
                    label: EFFECTIVE_STAGE_LABELS[EFFECTIVE_STAGE.UNVERIFIED],
                  },
                ]}
              />
            </div>
          )}

          {/* Profile picture - Mentors/Mentees only */}
          {(displayOption === keys.MENTORS ||
            displayOption === keys.MENTEES) && (
            <div className="filter-group">
              <span className="filter-label">
                <FilterOutlined style={{ marginRight: 6 }} />
                Profile pic
              </span>
              <Select
                value={hasPictureFilter}
                onChange={setHasPictureFilter}
                style={{ width: 140 }}
                options={[
                  { value: "all", label: "All" },
                  { value: "yes", label: "Uploaded" },
                  { value: "no", label: "Missing" },
                ]}
              />
            </div>
          )}

          {/* Video uploaded - Mentors only */}
          {displayOption === keys.MENTORS && (
            <div className="filter-group">
              <span className="filter-label">
                <FilterOutlined style={{ marginRight: 6 }} />
                Video
              </span>
              <Select
                value={hasVideoFilter}
                onChange={setHasVideoFilter}
                style={{ width: 140 }}
                options={[
                  { value: "all", label: "All" },
                  { value: "yes", label: "Uploaded" },
                  { value: "no", label: "Missing" },
                ]}
              />
            </div>
          )}

          {/* Taking appointments - Mentors only */}
          {displayOption === keys.MENTORS && (
            <div className="filter-group">
              <span className="filter-label">
                <FilterOutlined style={{ marginRight: 6 }} />
                Appointments
              </span>
              <Select
                value={takingAppointmentsFilter}
                onChange={setTakingAppointmentsFilter}
                style={{ width: 170 }}
                options={[
                  { value: "all", label: "All" },
                  { value: "yes", label: "Taking" },
                  { value: "no", label: "Not taking" },
                ]}
              />
            </div>
          )}

          {/* Paused - Mentors only */}
          {displayOption === keys.MENTORS && (
            <div className="filter-group">
              <span className="filter-label">
                <FilterOutlined style={{ marginRight: 6 }} />
                Paused
              </span>
              <Select
                value={pausedFilter}
                onChange={setPausedFilter}
                style={{ width: 130 }}
                options={[
                  { value: "all", label: "All" },
                  { value: "yes", label: "Paused" },
                  { value: "no", label: "Active" },
                ]}
              />
            </div>
          )}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Tooltip title="Clear all filters">
              <Button
                className="filter-clear-btn"
                icon={<ClearOutlined />}
                onClick={handleResetFilters}
              >
                Clear Filters
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Account Type Tabs */}
      <div className="account-tabs">
        {ACCOUNT_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`account-tab ${
              displayOption === tab.key ? "active" : ""
            }`}
            onClick={() => handleAccountDisplay(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table Header Section */}
      <div className="table-header-section">
        <div className="table-title">
          {getViewTitle(displayOption)}
          <Typography.Text
            type="secondary"
            style={{ marginLeft: 12, fontSize: 13, fontWeight: 500 }}
          >
            {hasActiveFilters
              ? `${filterData.length.toLocaleString()} of ${displayData.length.toLocaleString()}`
              : `${displayData.length.toLocaleString()} total`}
          </Typography.Text>
          {displayOption === keys.PARTNER && includeHubAccounts && (
            <span className="hub-indicator">(including Hub accounts)</span>
          )}
        </div>

        <div className="table-actions">
          {/* Sort Dropdown */}
          <SortByApptDropdown
            className="action-btn"
            onChange={handleSortData}
            onChangeData={displayData}
          />

          {/* Add Guest/Support/Moderator */}
          <Button
            className="action-btn"
            icon={<PlusOutlined />}
            onClick={handleAddGuest}
          >
            Add Guest/Support
          </Button>
          <AddGuestModal
            setGuestModalVisible={setGuestModalVisible}
            guestModalVisible={guestModalVisible}
            refresh={() => setReload(!reload)}
          />

          {/* Add New Account */}
          <Button
            className="action-btn"
            icon={<PlusOutlined />}
            onClick={handleAddAccount}
          >
            Add Account
          </Button>
          <UploadEmails
            setUploadModalVisible={setUploadModalVisible}
            uploadModalVisible={uploadModalVisible}
          />

          {/* Download Button - Uses current active tab. When the UI has
              active filters for Mentors/Mentees, the export mirrors the
              filtered view via an id list; otherwise exports everything. */}
          {canDownload && (
            <Tooltip
              title={
                hasActiveFilters &&
                (displayOption === keys.MENTORS ||
                  displayOption === keys.MENTEES)
                  ? `Exports the ${filterData.length} filtered ${getViewTitle(
                      displayOption
                    ).toLowerCase()} currently visible`
                  : `Exports all ${displayData.length} ${getViewTitle(
                      displayOption
                    ).toLowerCase()}`
              }
              placement="bottomRight"
            >
              <Button
                className="download-btn"
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                loading={isDownloading}
              >
                Download {getViewTitle(displayOption)}
                {hasActiveFilters &&
                  (displayOption === keys.MENTORS ||
                    displayOption === keys.MENTEES) &&
                  ` (${filterData.length})`}
              </Button>
            </Tooltip>
          )}

          {/* Refresh Button */}
          <Tooltip title="Refresh data">
            <Button
              className="refresh-btn"
              icon={<ReloadOutlined spin={isReloading} />}
              onClick={() => setReload(!reload)}
            />
          </Tooltip>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container">
        <Spin spinning={isReloading} tip="Loading accounts...">
          <AdminDataTable
            data={filterData}
            deleteAccount={handleDeleteAccount}
            refresh={() => setReload(!reload)}
            isMentee={displayOption === keys.MENTEES}
            isPartner={displayOption === keys.PARTNER}
            isGuest={displayOption === keys.GUEST}
            isSupport={displayOption === keys.SUPPORT}
            isModerator={displayOption === keys.MODERATOR}
          />
        </Spin>
      </div>
    </div>
  );
}

export default AdminAccountData;
