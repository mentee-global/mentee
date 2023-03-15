import React, { useState, useEffect } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { Modal, Select, Table, Button } from "antd";
import { ExclamationCircleOutlined, DownloadOutlined } from "@ant-design/icons";
import {
  fetchApplications,
  updateApplicationById,
  getApplicationById,
  downloadMentorsApps,
  downloadMenteeApps,
} from "../../utils/api";
import MentorApplicationView from "../MentorApplicationView";
import { APP_STATUS, NEW_APPLICATION_STATUS } from "../../utils/consts";
import {useAuth} from "utils/hooks/useAuth";
import ModalInput from "../ModalInput";

import { EditOutlined } from "@ant-design/icons";
const { confirm } = Modal;
const { Option } = Select;

function ApplicationOrganizer({ isMentor }) {
  const { onAuthStateChanged } = useAuth();
  const [applicationData, setApplicationData] = useState([]);
  const [filterdData, setFilterdData] = useState([]);
  const [appState, setAppstate] = useState("all");
  const [visible, setVisible] = useState(false);
  const [selectedID, setSelectedID] = useState(null);
  const [appInfo, setAppInfo] = useState({});

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
            onChange={async (e) => {
              const dataa = {
                application_state: e,
              };
              await updateApplicationById(dataa, id, isMentor);
              await updateApps();
            }}
            options={[
              NEW_APPLICATION_STATUS.PENDING,
              NEW_APPLICATION_STATUS.APPROVED,
              NEW_APPLICATION_STATUS.BUILDPROFILE,
              NEW_APPLICATION_STATUS.COMPLETED,
              NEW_APPLICATION_STATUS.REJECTED,
            ]}
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
        </>
      ),

      align: "center",
    },
  ];

  useEffect(() => {
    const getAllApplications = async () => {
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
    };

    onAuthStateChanged(getAllApplications);
  }, []);

  const updateApps = async () => {
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
      if (appState != "all") {
        setApplicationData(newApplications);
        setFilterdData(filterApplications(newApplications, appState));
      } else {
        setApplicationData(newApplications);
        setFilterdData(newApplications);
      }
    }
  };
  /**
   * Filters application by application state and items stored in the corresponding named columns
   */
  function filterApplications(data, appStatee) {
    if (appStatee == "all") {
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
          className="btn-d"
          icon={<DownloadOutlined />}
          onClick={async () => {
            await downloadMentorsApps();
          }}
        >
          Mentor Appications
        </Button>
        <Button
          className="btn-d"
          icon={<DownloadOutlined />}
          onClick={async () => {
            await downloadMenteeApps();
          }}
        >
          Mentee Appications
        </Button>
      </div>
      <div style={{ fontSize: 20, fontWeight: 400, padding: 10 }}>
        Applications State
      </div>

      <Select
        style={{ width: 160, height: 50, padding: 10 }}
        onChange={(value) => {
          setAppstate(value);
          setFilterdData(filterApplications(applicationData, value));
        }}
        placeholder="Role"
        value={appState}
      >
        {" "}
        {Object.keys(NEW_APPLICATION_STATUS).map((state) => {
          return <Option value={state}>{state}</Option>;
        })}
        <Option value={"all"}>All</Option>
      </Select>
      <div style={{ margin: 10 }}>
        <Table columns={columns} dataSource={filterdData} />;
      </div>
      {selectedID && (
        <Modal
          visible={visible}
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
            visible={visible}
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
