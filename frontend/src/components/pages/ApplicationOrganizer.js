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
} from "antd";
import {
  DownloadOutlined,
  SearchOutlined,
  ClearOutlined,
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
import { getAppStatusOptions } from "utils/consts";
import { useAuth } from "utils/hooks/useAuth";
import ModalInput from "components/ModalInput";

import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

const PAGE_SIZE = 20;

function ApplicationOrganizer({ isMentor }) {
  const { onAuthStateChanged } = useAuth();
  const [applications, setApplications] = useState([]);
  const [appState, setAppstate] = useState("all");
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

  const fetchPage = useCallback(
    async (page, search, state) => {
      const thisRequest = ++requestIdRef.current;
      setLoading(true);
      try {
        const result = await fetchApplicationsSearch(isMentor, {
          page,
          pageSize: PAGE_SIZE,
          search,
          applicationState: state,
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
    [isMentor]
  );

  useEffect(() => {
    onAuthStateChanged(() => {
      fetchPage(1, "", "all");
    });
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setInputValue(value);
    searchTextRef.current = value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchText(value);
      setCurrentPage(1);
      fetchPage(1, value, appStateRef.current);
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
    fetchPage(1, currentSearch, value);
  };

  const handleClearFilters = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    searchTextRef.current = "";
    appStateRef.current = "all";
    setInputValue("");
    setSearchText("");
    setAppstate("all");
    setCurrentPage(1);
    fetchPage(1, "", "all");
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchPage(page, searchTextRef.current, appStateRef.current);
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
        fetchPage(currentPage, searchTextRef.current, appStateRef.current);
      }
    },
    [isMentor, currentPage, fetchPage]
  );

  const handleModalClose = async () => {
    await fetchPage(currentPage, searchTextRef.current, appStateRef.current);
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
                appStateRef.current
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

  const hasActiveFilters = searchText || appState !== "all";

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
        <Button
          id="mentorapplications"
          className="btn-d"
          icon={<DownloadOutlined />}
          onClick={async () => {
            await downloadMentorsApps();
          }}
        >
          Mentor Appications
        </Button>
        <Button
          id="menteeapplications"
          className="btn-d"
          icon={<DownloadOutlined />}
          onClick={async () => {
            await downloadMenteeApps();
          }}
        >
          Mentee Appications
        </Button>
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
