import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Modal,
  Select,
  Table,
  Button,
  Popconfirm,
  Spin,
  Empty,
  Input,
  Tag,
  Tooltip,
} from "antd";
import {
  DownloadOutlined,
  SearchOutlined,
  ClearOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import {
  fetchApplicationsSearch,
  updateApplicationById,
  getApplicationById,
  downloadMentorsApps,
  downloadMenteeApps,
  deleteApplication,
} from "../../utils/api";
import MentorApplicationView from "components/MentorApplicationView";
import {
  getAppStatusOptions,
  getEffectiveStageOptions,
  EFFECTIVE_STAGE_COLORS,
  EFFECTIVE_STAGE_LABELS,
  EFFECTIVE_STAGE_DESCRIPTIONS,
} from "utils/consts";
import { useAuth } from "utils/hooks/useAuth";
import ModalInput from "components/ModalInput";

import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

const PAGE_SIZE = 20;

const DAYS_STUCK_WARN = 14;
const DAYS_STUCK_CRIT = 30;

function daysStuckColor(days) {
  if (days == null) return "#888";
  if (days >= DAYS_STUCK_CRIT) return "#c0392b";
  if (days >= DAYS_STUCK_WARN) return "#d4a017";
  return "#333";
}

function ApplicationOrganizer({ isMentor, partnerId }) {
  const { onAuthStateChanged } = useAuth();
  const [applications, setApplications] = useState([]);
  const [appState, setAppstate] = useState("all");
  const [effectiveStage, setEffectiveStage] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [visible, setVisible] = useState(false);
  const [selectedID, setSelectedID] = useState(null);
  const [appInfo, setAppInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  // Refs that always hold the latest filter values so debounce
  // callbacks and event handlers never read stale closures.
  const appStateRef = useRef(appState);
  const searchTextRef = useRef(searchText);
  const effectiveStageRef = useRef(effectiveStage);

  const fetchPage = useCallback(
    async (page, search, state, stage = effectiveStageRef.current) => {
      const thisRequest = ++requestIdRef.current;
      setLoading(true);
      try {
        const result = await fetchApplicationsSearch(isMentor, {
          page,
          pageSize: PAGE_SIZE,
          search,
          applicationState: state,
          partnerId,
          effectiveStage: stage,
        });
        if (thisRequest !== requestIdRef.current) return;
        if (result) {
          const mapped = result.applications.map((app, index) => ({
            ...app,
            index: (page - 1) * PAGE_SIZE + index,
            id: app._id["$oid"],
          }));
          setApplications(mapped);
          setTotal(result.total);
        } else {
          setApplications([]);
          setTotal(0);
        }
      } catch (error) {
        if (thisRequest !== requestIdRef.current) return;
        console.error("Error fetching applications:", error);
        setApplications([]);
        setTotal(0);
      } finally {
        if (thisRequest === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [isMentor, partnerId]
  );

  useEffect(() => {
    onAuthStateChanged(() => {
      fetchPage(1, "", "all", "all");
    });
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId]);

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setInputValue(value);
    searchTextRef.current = value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchText(value);
      setCurrentPage(1);
      fetchPage(1, value, appStateRef.current, effectiveStageRef.current);
    }, 400);
  };

  const handleStateChange = (value) => {
    appStateRef.current = value;
    setAppstate(value);
    // Cancel any pending search debounce and commit current input immediately
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const currentSearch = searchTextRef.current;
    setSearchText(currentSearch);
    setCurrentPage(1);
    fetchPage(1, currentSearch, value, effectiveStageRef.current);
  };

  const handleEffectiveStageChange = (value) => {
    effectiveStageRef.current = value;
    setEffectiveStage(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const currentSearch = searchTextRef.current;
    setSearchText(currentSearch);
    setCurrentPage(1);
    fetchPage(1, currentSearch, appStateRef.current, value);
  };

  const handleClearFilters = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    searchTextRef.current = "";
    appStateRef.current = "all";
    effectiveStageRef.current = "all";
    setInputValue("");
    setSearchText("");
    setAppstate("all");
    setEffectiveStage("all");
    setCurrentPage(1);
    fetchPage(1, "", "all", "all");
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchPage(
      page,
      searchTextRef.current,
      appStateRef.current,
      effectiveStageRef.current
    );
  };

  const handleApplicationStateChange = useCallback(
    async (id, newState) => {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === id ? { ...app, application_state: newState } : app
        )
      );
      try {
        await updateApplicationById(
          { application_state: newState },
          id,
          isMentor
        );
      } catch (error) {
        console.error("Update failed:", error);
        fetchPage(
          currentPage,
          searchTextRef.current,
          appStateRef.current,
          effectiveStageRef.current
        );
      }
    },
    [isMentor, currentPage, fetchPage]
  );

  const handleModalClose = async () => {
    await fetchPage(
      currentPage,
      searchTextRef.current,
      appStateRef.current,
      effectiveStageRef.current
    );
    setVisible(false);
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name) => <a>{name}</a>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email) => <a>{email}</a>,
    },
    {
      title: "Affiliation",
      dataIndex: "organization",
      key: "organization",
      render: (organization, record) =>
        organization ? (
          <a href={`/gallery/3/${record.partner}`}>{organization}</a>
        ) : (
          <span>No affiliation</span>
        ),
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      render: (notes) => <a>{notes}</a>,
    },
    {
      title: "Application State",
      dataIndex: "id",
      key: "application_state",
      render: (id, record) => (
        <ModalInput
          style={styles.modalInput}
          type="dropdown-single"
          title={""}
          onChange={(e) => handleApplicationStateChange(id, e)}
          options={getAppStatusOptions()}
          value={record.application_state}
          handleClick={() => {}}
        />
      ),
    },
    {
      title: "Effective Stage",
      dataIndex: "effective_stage",
      key: "effective_stage",
      render: (stage) =>
        stage ? (
          <Tooltip
            title={EFFECTIVE_STAGE_DESCRIPTIONS[stage]}
            placement="top"
            overlayStyle={{ maxWidth: 320 }}
          >
            <Tag
              color={EFFECTIVE_STAGE_COLORS[stage] || "default"}
              style={{ cursor: "help" }}
            >
              {EFFECTIVE_STAGE_LABELS[stage] || stage}
            </Tag>
          </Tooltip>
        ) : (
          <span style={{ color: "#888" }}>—</span>
        ),
    },
    {
      title: (
        <Tooltip
          title="Days elapsed since the applicant first submitted. This is a ceiling on 'days stuck at current stage' because we don't yet record each state transition's timestamp."
          placement="top"
          overlayStyle={{ maxWidth: 320 }}
        >
          <span style={{ cursor: "help" }}>
            Days since submit <InfoCircleOutlined style={{ fontSize: 12 }} />
          </span>
        </Tooltip>
      ),
      dataIndex: "days_since_submit",
      key: "days_since_submit",
      align: "right",
      sorter: (a, b) =>
        (a.days_since_submit ?? -1) - (b.days_since_submit ?? -1),
      render: (days) =>
        days == null ? (
          <span style={{ color: "#888" }}>—</span>
        ) : (
          <span
            style={{
              color: daysStuckColor(days),
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {days}d
          </span>
        ),
    },
    {
      title: "Full Application",
      dataIndex: "id",
      key: "id",
      align: "center",
      render: (id) => (
        <>
          <EditOutlined
            className="delete-user-btn"
            onClick={async () => {
              setSelectedID(id);
              const info = await getApplicationById(id, isMentor);
              if (info) {
                setAppInfo(info);
              }
              setVisible(true);
            }}
          />
          <Popconfirm
            title={`Are you sure you want to delete?`}
            onConfirm={async () => {
              await deleteApplication(id, isMentor);
              fetchPage(
                currentPage,
                searchTextRef.current,
                appStateRef.current,
                effectiveStageRef.current
              );
            }}
            onCancel={() => {}}
            okText="Yes"
            cancelText="No"
          >
            <DeleteOutlined
              className="delete-user-btn"
              style={{ marginLeft: "10px" }}
            />
          </Popconfirm>
        </>
      ),
    },
  ];

  const hasActiveFilters =
    searchText || appState !== "all" || effectiveStage !== "all";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-start",
        overflowX: "auto",
        flexDirection: "column",
      }}
    >
      <div className="btn-dc">
        {isMentor ? (
          <Button
            id="mentorapplications"
            className="btn-d"
            icon={<DownloadOutlined />}
            onClick={async () => {
              await downloadMentorsApps(partnerId || "", {
                search: searchText,
                applicationState: appState,
                effectiveStage,
              });
            }}
          >
            {partnerId
              ? "Download Mentor Pipeline (this partner)"
              : "Download Mentor Applications"}
          </Button>
        ) : (
          <Button
            id="menteeapplications"
            className="btn-d"
            icon={<DownloadOutlined />}
            onClick={async () => {
              await downloadMenteeApps(partnerId || "", {
                search: searchText,
                applicationState: appState,
                effectiveStage,
              });
            }}
          >
            {partnerId
              ? "Download Mentee Pipeline (this partner)"
              : "Download Mentee Applications"}
          </Button>
        )}
        {hasActiveFilters && (
          <span
            style={{
              marginLeft: 10,
              fontSize: 12,
              color: "#666",
              alignSelf: "center",
            }}
          >
            (export matches your active filters)
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: 10,
          flexWrap: "wrap",
        }}
      >
        <Input
          id="applicationsearch"
          placeholder="Search by name or email"
          prefix={<SearchOutlined />}
          value={inputValue}
          onChange={handleSearchInput}
          style={{ width: 260 }}
          allowClear
          onClear={() => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            searchTextRef.current = "";
            setInputValue("");
            setSearchText("");
            setCurrentPage(1);
            fetchPage(1, "", appStateRef.current);
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 400 }}>State:</span>
          <Select
            id="applicationssort"
            style={{ width: 160 }}
            onChange={handleStateChange}
            value={appState}
            options={[{ value: "all", label: "All" }, ...getAppStatusOptions()]}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 400 }}>Stage:</span>
          <Tooltip
            title={
              <div style={{ lineHeight: 1.5 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  What each stage means
                </div>
                {getEffectiveStageOptions().map((opt) => (
                  <div key={opt.value} style={{ marginBottom: 6 }}>
                    <strong>{opt.label}:</strong>{" "}
                    {EFFECTIVE_STAGE_DESCRIPTIONS[opt.value]}
                  </div>
                ))}
              </div>
            }
            placement="bottomLeft"
            overlayStyle={{ maxWidth: 420 }}
          >
            <InfoCircleOutlined
              style={{ color: "#8c8c8c", cursor: "help", fontSize: 13 }}
            />
          </Tooltip>
          <Select
            id="effectivestagefilter"
            style={{ width: 220 }}
            onChange={handleEffectiveStageChange}
            value={effectiveStage}
            options={[
              { value: "all", label: "All stages" },
              ...getEffectiveStageOptions(),
            ]}
          />
        </div>

        {hasActiveFilters && (
          <Button
            icon={<ClearOutlined />}
            onClick={handleClearFilters}
            size="small"
          >
            Clear filters
          </Button>
        )}

        <span style={{ fontSize: 13, color: "#888", marginLeft: "auto" }}>
          {total} application{total !== 1 ? "s" : ""}
        </span>
      </div>

      <div style={{ margin: 10 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Spin size="large" />
            <p>Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <Empty
            description="No applications found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            id="applicationstable"
            columns={columns}
            dataSource={applications}
            rowKey="id"
            pagination={{
              current: currentPage,
              pageSize: PAGE_SIZE,
              total,
              showSizeChanger: false,
              showTotal: (t) => `${t} total`,
              onChange: handlePageChange,
            }}
          />
        )}
      </div>

      {selectedID && (
        <Modal
          open={visible}
          footer={null}
          className="app-modal"
          onCancel={() => handleModalClose()}
        >
          <MentorApplicationView
            id={selectedID}
            isMentor={isMentor}
            isNew={applications
              .filter((item) => item.id === selectedID)
              .hasOwnProperty("identify")}
            open={visible}
            appInfo={appInfo}
          />
        </Modal>
      )}
    </div>
  );
}

const styles = {
  modalInput: {
    height: 65,
    margin: 18,
    padding: 4,
    paddingTop: 6,
    marginBottom: "40px",
  },
};

export default ApplicationOrganizer;
