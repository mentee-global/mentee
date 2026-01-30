import React, { useState, useEffect } from "react";
import { Button, Breadcrumb, Input, Spin, message, Tooltip, Badge, Switch } from "antd";
import {
  DownloadOutlined,
  ReloadOutlined,
  PlusOutlined,
  UserOutlined,
  FilterOutlined,
  ClearOutlined,
  SearchOutlined,
  ClusterOutlined,
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
import {
  SortByApptDropdown,
  HubsDropdown,
} from "../AdminDropdowns";
import UploadEmails from "../UploadEmails";
import AddGuestModal from "../AddGuestModal";
import AdminDataTable from "../AdminDataTable";
import { useAuth } from "utils/hooks/useAuth";
import { ACCOUNT_TYPE } from "utils/consts";

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
    case keys.MENTORS: return "Mentors";
    case keys.MENTEES: return "Mentees";
    case keys.PARTNER: return "Partners";
    case keys.GUEST: return "Guests";
    case keys.SUPPORT: return "Supporters";
    case keys.HUB: return "Hubs";
    case keys.MODERATOR: return "Moderators";
    default: return "All Accounts";
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
  { key: keys.MODERATOR, label: "Moderators", accountType: ACCOUNT_TYPE.MODERATOR },
];

function AdminAccountData() {
  const [isReloading, setIsReloading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [reload, setReload] = useState(true);
  const [displayData, setDisplayData] = useState([]);
  const [displayOption, setDisplayOption] = useState(keys.MENTORS);
  const [filterData, setFilterData] = useState([]);
  const [downloadFile, setDownloadFile] = useState(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [guestModalVisible, setGuestModalVisible] = useState(false);
  const { onAuthStateChanged } = useAuth();
  const [hubOptions, setHubOptions] = useState([]);
  const [resetFilters, setResetFilters] = useState(false);
  const [searchHubUserId, setSearchHubUserId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [partnerSearchText, setPartnerSearchText] = useState("");
  
  // Include Hub Accounts toggle (only for Partners view)
  const [includeHubAccounts, setIncludeHubAccounts] = useState(false);

  // Track active filters for UI feedback
  const hasActiveFilters = searchText || partnerSearchText || searchHubUserId;

  // Check if current tab supports download
  const canDownload = [keys.MENTORS, keys.MENTEES, keys.PARTNER, keys.HUB, keys.GUEST, keys.SUPPORT, keys.MODERATOR].includes(displayOption);

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
            setFilterData(newMenteeData);
          } else {
            message.error("Could not fetch account data");
          }
          break;
        case keys.MENTORS:
          const mentorRes = await fetchMentorsAppointments();
          if (mentorRes) {
            setDisplayData(mentorRes.mentorData);
            setFilterData(mentorRes.mentorData);
          } else {
            message.error("Could not fetch account data");
          }
          break;
        case keys.PARTNER:
          // Fetch Partners with optional Hub accounts inclusion
          const Partners = await fetchAccounts(ACCOUNT_TYPE.PARTNER, undefined, "", includeHubAccounts);
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
          setFilterData(partners_data);
          break;
        case keys.HUB:
          const Hubs = await fetchAccounts(ACCOUNT_TYPE.HUB);
          setDisplayData(Hubs);
          setFilterData(Hubs);
          break;
        case keys.GUEST:
          const Guests = await fetchAccounts(ACCOUNT_TYPE.GUEST);
          setDisplayData(Guests);
          setFilterData(Guests);
          break;
        case keys.SUPPORT:
          const Supporters = await fetchAccounts(ACCOUNT_TYPE.SUPPORT);
          setDisplayData(Supporters);
          setFilterData(Supporters);
          break;
        case keys.MODERATOR:
          const Moderator = await fetchAccounts(ACCOUNT_TYPE.MODERATOR);
          setDisplayData(Moderator);
          setFilterData(Moderator);
          break;
        default:
          break;
      }
      setIsReloading(false);
    }

    onAuthStateChanged(getData);
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
      switch (displayOption) {
        case keys.MENTORS:
          await downloadMentorsData();
          break;
        case keys.MENTEES:
          await downloadMenteesData();
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
      message.success(`Downloaded ${getViewTitle(displayOption)} data successfully`);
    } catch (error) {
      message.error(`Failed to download data`);
      console.error(error);
    }
    setIsDownloading(false);
  };

  const handleSortData = (key) => {
    const newData = [...filterData];
    const isAscending = key === keys.ASCENDING;
    newData.sort((a, b) => {
      if (a.appointments && b.appointments) {
        return isAscending
          ? b.appointments.length - a.appointments.length
          : a.appointments.length - b.appointments.length;
      } else {
        return isAscending
          ? b.numOfAppointments - a.numOfAppointments
          : a.numOfAppointments - b.numOfAppointments;
      }
    });
    setFilterData(newData);
  };

  const handleAccountDisplay = (key) => {
    setDisplayOption(key);
    handleResetFilters();
    setReload(!reload);
  };

  const searchbyHub = (key) => {
    if (!key || displayOption !== keys.PARTNER) {
      setFilterData(displayData);
      setSearchHubUserId(null);
      return;
    }
    setSearchHubUserId(key);
    let newFiltered = displayData.filter((account) => account.hub_id === key);
    setFilterData(newFiltered);
  };

  const handleSearchByPartner = (partner_name) => {
    setPartnerSearchText(partner_name);
    if (!partner_name) {
      setFilterData(displayData);
      return;
    }
    let newFiltered = [];
    if (displayOption === keys.MENTORS || displayOption === keys.MENTEES) {
      newFiltered = displayData.filter((account) => {
        return account.partner?.match(new RegExp(partner_name, "i"));
      });
      setFilterData(newFiltered);
    }
  };

  const handleSearchAccount = (name) => {
    setSearchText(name);
    if (!name) {
      setFilterData(displayData);
      return;
    }
    let newFiltered = [];
    if (displayOption !== keys.PARTNER) {
      newFiltered = displayData.filter((account) => {
        return account.name?.match(new RegExp(name, "i"));
      });
    } else {
      newFiltered = displayData.filter((account) => {
        return account.organization?.match(new RegExp(name, "i"));
      });
    }
    setFilterData(newFiltered);
  };

  const handleResetFilters = () => {
    setResetFilters(!resetFilters);
    setSearchHubUserId(null);
    setSearchText("");
    setPartnerSearchText("");
    setFilterData(displayData);
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
              placeholder={displayOption === keys.PARTNER ? "Search by organization" : "Search by name"}
              value={searchText}
              allowClear
              onChange={(e) => handleSearchAccount(e.target.value)}
              onSearch={handleSearchAccount}
              prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
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
          {(displayOption === keys.MENTORS || displayOption === keys.MENTEES) && (
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
            className={`account-tab ${displayOption === tab.key ? 'active' : ''}`}
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
          <Badge 
            count={filterData.length} 
            style={{ 
              backgroundColor: '#e5e7eb', 
              color: '#374151',
              marginLeft: 12,
              fontSize: 12,
              fontWeight: 600
            }} 
          />
          {displayOption === keys.PARTNER && includeHubAccounts && (
            <span className="hub-indicator">
              (including Hub accounts)
            </span>
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
          
          {/* Download Button - Uses current active tab */}
          {canDownload && (
            <Button
              className="download-btn"
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              loading={isDownloading}
            >
              Download {getViewTitle(displayOption)}
            </Button>
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
