import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Breadcrumb,
  Input,
  Spin,
  Popconfirm,
  message,
} from "antd";
import {
  DownloadOutlined,
  ReloadOutlined,
  LinkOutlined,
  PlusOutlined,
  UserOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import "../css/AdminAccountData.scss";
import {
  fetchMentorsAppointments,
  downloadMentorsData,
  deleteMentorById,
} from "../../utils/api";
import { formatLinkForHref } from "utils/misc";
import { MenteeMentorDropdown, SortByApptDropdown } from "../AdminDropdowns";
import { PROFILE_URL } from "../../utils/consts";
import UploadEmails from "../UploadEmails";

const { Column } = Table;

const keys = {
  MENTORS: 0,
  MENTEES: 1,
  ALL: 2,
  ASCENDING: 0,
  DESCENDING: 1,
};

function AdminAccountData() {
  const [isReloading, setIsReloading] = useState(false);
  const [isMentorDownload, setIsMentorDownload] = useState(false);
  const [isMenteeDownload, setIsMenteeDownload] = useState(false);
  const [reload, setReload] = useState(true);
  const [resetFilters, setResetFilters] = useState(false);
  const [mentorData, setMentorData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [displayOption, setDisplayOption] = useState(keys.MENTORS);
  const [filterData, setFilterData] = useState([]);
  const [downloadFile, setDownloadFile] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    async function getData() {
      setIsReloading(true);
      const res = await fetchMentorsAppointments();
      if (res) {
        setMentorData(res.mentorData);
        // TODO: Add Mentee Data state
        setDisplayData(res.mentorData);
        setFilterData(res.mentorData);
      }
      setIsReloading(false);
    }
    getData();
  }, [reload]);

  const handleDeleteAccount = async (mentorId, name) => {
    if (!mentorId) {
      message.error("Could not get specified mentor id");
      return;
    }
    const success = await deleteMentorById(mentorId);
    if (success) {
      message.success(`Successfully deleted ${name}`);
      setReload(!reload);
    } else {
      message.error(`Could not delete ${name}`);
    }
  };

  const handleAddAccount = () => {
    setModalVisible(true);
  };

  const handleMentorsDownload = async () => {
    setIsMentorDownload(true);
    // TODO: Check up on why this isn't working..
    const file = await downloadMentorsData();
    setDownloadFile(file);
    setIsMentorDownload(false);
  };

  const handleMenteesDownload = () => {
    setIsMenteeDownload(true);
    // TODO: Add Mentee Account Downloads
    console.log("Calling endpoint to download accounts");
    setIsMenteeDownload(false);
  };

  const handleSortData = (key) => {
    const newData = [...filterData];
    const isAscending = key === keys.ASCENDING;
    newData.sort((a, b) => {
      return isAscending
        ? b.appointments.length - a.appointments.length
        : a.appointments.length - b.appointments.length;
    });
    setFilterData(newData);
  };

  const handleAccountDisplay = (key) => {
    let newData = [];
    if (key === keys.MENTORS) {
      newData = mentorData;
    } else if (key === keys.MENTEES) {
      //TODO: Add Mentee Data
    } else if (key === keys.ALL) {
      // TODO: Add Mentee Data
      newData = mentorData.concat([]);
    }

    setDisplayData(newData);
    setFilterData(newData);
    setDisplayOption(key);
  };

  const handleSearchAccount = (name) => {
    if (!name) {
      setFilterData(displayData);
      return;
    }

    let newFiltered = displayData.filter((account) => {
      return account.name.match(new RegExp(name, "i"));
    });
    setFilterData(newFiltered);
  };

  return (
    <div className="account-data-body">
      <div style={{ display: "none" }}>
        <iframe src={downloadFile} />
      </div>
      <Breadcrumb>
        <Breadcrumb.Item>User Reports</Breadcrumb.Item>
        <Breadcrumb.Item>
          <a href="account-data">Account Data</a>
        </Breadcrumb.Item>
      </Breadcrumb>
      <div className="table-search">
        <Input.Search
          placeholder="Search by name"
          prefix={<UserOutlined />}
          allowClear
          size="medium"
          onSearch={(value) => handleSearchAccount(value)}
        />
      </div>
      <div className="table-header">
        <div className="table-title">
          {displayOption === keys.MENTORS
            ? "Mentors"
            : displayOption === keys.MENTEES
            ? "Mentees"
            : "All"}
        </div>
        <div className="table-button-group">
          <MenteeMentorDropdown
            className="table-button"
            onChange={(key) => handleAccountDisplay(key)}
            onReset={resetFilters}
          />
          <SortByApptDropdown
            className="table-button"
            onChange={(key) => handleSortData(key)}
            onReset={resetFilters}
            onChangeData={displayData}
          />
          <Button
            className="table-button"
            icon={<PlusOutlined />}
            onClick={() => handleAddAccount()}
          >
            Add New Account
          </Button>
          <UploadEmails
            setModalVisible={setModalVisible}
            modalVisible={modalVisible}
          />
          <Button
            className="table-button"
            icon={<DownloadOutlined />}
            onClick={() => handleMentorsDownload()}
            loading={isMentorDownload}
          >
            Mentor Account Data
          </Button>
          <Button
            className="table-button"
            icon={<DownloadOutlined />}
            onClick={() => handleMenteesDownload()}
            loading={isMenteeDownload}
          >
            Mentee Account Data
          </Button>
          <ReloadOutlined
            className="table-button"
            style={{ fontSize: "16px" }}
            spin={isReloading}
            onClick={() => {
              setReload(!reload);
              setResetFilters(!resetFilters);
            }}
          />
        </div>
      </div>
      <Spin spinning={isReloading}>
        <Table dataSource={filterData}>
          <Column title="Name" dataIndex="name" key="name" />
          <Column
            title="No. of Appointments"
            dataIndex="numOfAppointments"
            key="numOfAppointments"
            align="center"
          />
          <Column
            title="Appointments Available?"
            dataIndex="appointmentsAvailable"
            key="appointmentsAvailable"
            align="center"
          />
          <Column
            title="Videos Posted?"
            dataIndex="videosUp"
            key="videosUp"
            align="center"
          />
          <Column
            title="Picture Uploaded?"
            dataIndex="profilePicUp"
            key="profilePicUp"
            align="center"
          />
          <Column
            title="Delete"
            dataIndex={["id", "name"]}
            key="id"
            render={(text, data) => (
              <Popconfirm
                title={`Are you sure you want to delete ${data.name}?`}
                onConfirm={() => {
                  handleDeleteAccount(data.id, data.name);
                }}
                onCancel={() =>
                  message.info(`No deletion has been for ${data.name}`)
                }
                okText="Yes"
                cancelText="No"
              >
                <DeleteOutlined className="delete-user-btn" />
              </Popconfirm>
            )}
            align="center"
          />
          <Column
            title="Link to Profile"
            dataIndex="id"
            key="id"
            render={(id) => (
              <a
                style={{ color: "black" }}
                href={formatLinkForHref(`${PROFILE_URL}${id}`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkOutlined /> {`${PROFILE_URL}${id}`}
              </a>
            )}
            align="center"
          />
        </Table>
      </Spin>
    </div>
  );
}

export default AdminAccountData;
