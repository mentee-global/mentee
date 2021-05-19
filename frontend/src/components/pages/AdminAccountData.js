import React, { useState, useEffect } from "react";
import { Button, Breadcrumb, Input, Spin, message } from "antd";
import {
  DownloadOutlined,
  ReloadOutlined,
  PlusOutlined,
  UserOutlined,
} from "@ant-design/icons";
import "../css/AdminAccountData.scss";
import {
  fetchMentorsAppointments,
  downloadMentorsData,
  deleteMentorById,
  fetchMenteesAppointments,
} from "../../utils/api";
import { MenteeMentorDropdown, SortByApptDropdown } from "../AdminDropdowns";
import UploadEmails from "../UploadEmails";
import AdminDataTable from "../AdminDataTable";
import useAuth from "utils/hooks/useAuth";

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
  const [menteeData, setMenteeData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [displayOption, setDisplayOption] = useState(keys.MENTORS);
  const [filterData, setFilterData] = useState([]);
  const [downloadFile, setDownloadFile] = useState(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  const { onAuthStateChanged } = useAuth();

  useEffect(() => {
    async function getData() {
      setIsReloading(true);
      const mentorRes = await fetchMentorsAppointments();
      const menteeRes = await fetchMenteesAppointments();
      console.log(menteeRes);
      if (mentorRes && menteeRes) {
        const newMenteeData = menteeRes.menteeData.map((elem) => ({
          ...elem,
          isMentee: true,
        }));

        setMentorData(mentorRes.mentorData);
        setMenteeData(newMenteeData);
        setDisplayData(mentorRes.mentorData);
        setFilterData(mentorRes.mentorData);
      } else {
        message.error("Could not fetch account data");
      }
      setIsReloading(false);
    }

    onAuthStateChanged(getData);
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
    setUploadModalVisible(true);
  };

  const handleMentorsDownload = async () => {
    setIsMentorDownload(true);
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
      newData = menteeData;
    } else if (key === keys.ALL) {
      newData = mentorData.concat(menteeData);
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
            setUploadModalVisible={setUploadModalVisible}
            uploadModalVisible={uploadModalVisible}
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
        <AdminDataTable data={filterData} deleteAccount={handleDeleteAccount} />
      </Spin>
    </div>
  );
}

export default AdminAccountData;
