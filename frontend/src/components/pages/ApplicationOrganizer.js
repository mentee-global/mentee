import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Modal, Select, Table, Button, Popconfirm } from "antd";
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
  const [loading, setLoading] = useState(false);

  const filterApplications = useCallback((data, appStatee) => {
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
  }, []);

  const updateApps = useCallback(async () => {
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
      }
    } catch (error) {
      console.error('Error updating applications:', error);
    }
  }, [isMentor, appState, filterApplications]);

  const handleApplicationStateChange = useCallback(async (e, id) => {
    const dataa = {
      application_state: e,
    };
    await updateApplicationById(dataa, id, isMentor);
    await updateApps();
  }, [isMentor, updateApps]);

  const handleViewApplication = useCallback(async (id) => {
    setSelectedID(id);
    const info = await getApplicationById(id, isMentor);
    if (info) {
      setAppInfo(info);
    }
    setVisible(true);
  }, [isMentor]);

  const handleDeleteApplication = useCallback(async (id) => {
    await deleteApplication(id, isMentor);
    await updateApps();
  }, [isMentor, updateApps]);

  const columns = useMemo(() => [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name) => <span>{name}</span>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email) => <span>{email}</span>,
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
      render: (notes) => <span>{notes}</span>,
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
            onChange={(e) => handleApplicationStateChange(e, id)}
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
            onClick={() => handleViewApplication(id)}
          />
          <Popconfirm
            title={`Are you sure you want to delete?`}
            onConfirm={() => handleDeleteApplication(id)}
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
  ], [handleApplicationStateChange, handleViewApplication, handleDeleteApplication]);

  const getAllApplications = useCallback(async () => {
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
      }
    } finally {
      setLoading(false);
    }
  }, [isMentor]);

  useEffect(() => {
    onAuthStateChanged(getAllApplications);
  }, [getAllApplications, onAuthStateChanged]);

  const handleModalClose = useCallback(async () => {
    await updateApps();
    setVisible(false);
  }, [updateApps]);

  const appStatusOptions = useMemo(() => {
    return [...getAppStatusOptions(), { value: "all", label: "All" }];
  }, []);

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
        }}
        placeholder="Role"
        value={appState}
        options={appStatusOptions}
      />
      <div style={{ margin: 10 }}>
        <Table
          id="applicationstable"
          columns={columns}
          dataSource={filterdData}
          pagination={{ pageSize: 50, showSizeChanger: true, pageSizeOptions: ['20', '50', '100'] }}
          rowKey="id"
          loading={loading}
        />
        ;
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

export default React.memo(ApplicationOrganizer);
