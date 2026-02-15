import React, { useState, useEffect, useCallback } from "react";
import { Modal, Select, Table, Button, Popconfirm, Spin, Empty } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import {
  fetchApplications,
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

function ApplicationOrganizer({ isMentor }) {
  const { onAuthStateChanged } = useAuth();
  const [applicationData, setApplicationData] = useState([]);
  const [filterdData, setFilterdData] = useState([]);
  const [appState, setAppstate] = useState("all");
  const [visible, setVisible] = useState(false);
  const [selectedID, setSelectedID] = useState(null);
  const [appInfo, setAppInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const handleApplicationStateChange = useCallback(
    async (id, newState) => {
      const updatedData = applicationData.map((app) =>
        app.id === id ? { ...app, application_state: newState } : app
      );
      setApplicationData(updatedData);

      if (appState !== "all") {
        setFilterdData(filterApplications(updatedData, appState));
      } else {
        setFilterdData(updatedData);
      }

      try {
        await updateApplicationById(
          { application_state: newState },
          id,
          isMentor
        );
      } catch (error) {
        console.error("Update failed:", error);
        await updateApps();
      }
    },
    [applicationData, appState, isMentor]
  );

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
        <>
          <ModalInput
            style={styles.modalInput}
            type="dropdown-single"
            title={""}
            onChange={(e) => handleApplicationStateChange(id, e)}
            options={getAppStatusOptions()}
            value={record.application_state}
            handleClick={() => {}}
          />
        </>
      ),
    },
    {
      title: "Full Application",
      dataIndex: "id",
      key: "id",
      render: (id) => (
        <>
          <EditOutlined
            className="delete-user-btn"
            onClick={async () => {
              setSelectedID(id);
              const info = await getApplicationById(id, isMentor);
              if (info) {
                setAppInfo(info);
                //setAppstate(info.application_state);
              }
              setVisible(true);
            }}
          />
          <Popconfirm
            title={`Are you sure you want to delete?`}
            onConfirm={async () => {
              await deleteApplication(id, isMentor);
              await updateApps();
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

      align: "center",
    },
  ];

  useEffect(() => {
    const getAllApplications = async () => {
      setLoading(true);
      try {
        const applications = await fetchApplications(isMentor);
        if (applications) {
          const newApplications = applications.mentor_applications.map(
            (app, index) => {
              return {
                ...app,
                index: index,
                id: app._id["$oid"],
              };
            }
          );
          setApplicationData(newApplications);
          setFilterdData(newApplications);
        } else {
          setApplicationData([]);
          setFilterdData([]);
        }
      } catch (error) {
        console.error("Error fetching applications:", error);
        setApplicationData([]);
        setFilterdData([]);
      } finally {
        setLoading(false);
      }
    };

    onAuthStateChanged(getAllApplications);
  }, []);

  const updateApps = async () => {
    setLoading(true);
    try {
      const applications = await fetchApplications(isMentor);
      if (applications) {
        const newApplications = applications.mentor_applications.map(
          (app, index) => {
            return {
              ...app,
              index: index,
              id: app._id["$oid"],
            };
          }
        );
        if (appState !== "all") {
          setApplicationData(newApplications);
          setFilterdData(filterApplications(newApplications, appState));
        } else {
          setApplicationData(newApplications);
          setFilterdData(newApplications);
        }
      } else {
        setApplicationData([]);
        setFilterdData([]);
      }
    } catch (error) {
      console.error("Error updating applications:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filters application by application state and items stored in the corresponding named columns
   */
  function filterApplications(data, appStatee) {
    if (appStatee === "all") {
      return data;
    } else {
      return data
        .filter(
          (state) =>
            state.application_state &&
            state.application_state.toLowerCase() === appStatee.toLowerCase()
        )
        .map((application) => ({
          id: application._id.$oid,
          ...application,
        }));
    }
  }

  const handleModalClose = async () => {
    await updateApps();
    setVisible(false);
  };

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
        id="applicactionstate"
        style={{ fontSize: 20, fontWeight: 400, padding: 10 }}
      >
        Applications State
      </div>

      <Select
        id="applicationssort"
        style={{ width: 160, height: 50, padding: 10 }}
        onChange={(value) => {
          setAppstate(value);
          setFilterdData(filterApplications(applicationData, value));
          setCurrentPage(1);
        }}
        placeholder="Role"
        value={appState}
        options={[...getAppStatusOptions(), { value: "all", label: "All" }]}
      />

      <div style={{ margin: 10 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Spin size="large" />
            <p>Loading applications...</p>
          </div>
        ) : filterdData.length === 0 ? (
          <Empty
            description="No applications found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            id="applicationstable"
            columns={columns}
            dataSource={filterdData}
            pagination={{
              current: currentPage,
              onChange: (page) => setCurrentPage(page),
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
            isNew={applicationData
              .filter((item) => item.id == selectedID)
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
