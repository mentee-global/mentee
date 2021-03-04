import React, { useState, useEffect } from "react";
import { Table, Button, Breadcrumb, Input, Checkbox, Spin } from "antd";
import {
  DownloadOutlined,
  ReloadOutlined,
  LinkOutlined,
  PlusOutlined,
  UserOutlined,
} from "@ant-design/icons";
import "../css/AdminAccountData.scss";
import { fetchMentorsAppointments, downloadMentorsData } from "../../utils/api";
import { formatLinkForHref } from "utils/misc";

const { Column } = Table;

function AdminAccountData() {
  const [isReloading, setIsReloading] = useState(false);
  const [isMentorDownload, setIsMentorDownload] = useState(false);
  const [isMenteeDownload, setIsMenteeDownload] = useState(false);
  const [reload, setReload] = useState(true);
  const [mentorData, setMentorData] = useState([]);
  const [filterMentors, setFilterMentors] = useState([]);

  useEffect(() => {
    async function getMentorData() {
      setIsReloading(true);
      const res = await fetchMentorsAppointments();
      if (res) {
        setMentorData(res.mentorData);
        setFilterMentors(res.mentorData);
      }
      setIsReloading(false);
    }
    getMentorData();
  }, [reload]);

  const handleDeleteAccount = (mentorId) => {
    // TODO: Create endpoint that deletes a mentor account
    setReload(!reload);
    console.log(`Deleting Mentor with ID: ${mentorId}`);
  };

  const handleAddAccount = () => {
    // TODO: Link to the modal or page where one can add a new account
    console.log("Adding new account!");
  };

  const handleMentorsDownload = async () => {
    setIsMentorDownload(true);
    // TODO: Check up on why this isn't working..
    await downloadMentorsData();
    setIsMentorDownload(false);
  };

  const handleMenteesDownload = () => {
    setIsMentorDownload(true);
    // TODO: Add Mentee Account Downloads
    console.log("Calling endpoint to download accounts");
    setIsMenteeDownload(false);
  };

  const handleSearchAccount = (name) => {
    if (!name) {
      setFilterMentors(mentorData);
      return;
    }

    let newFiltered = mentorData.filter((mentor) => {
      return mentor.name.match(new RegExp(name, "i"));
    });
    setFilterMentors(newFiltered);
  };

  return (
    <div className="account-data-body">
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
        <div className="table-title">Mentors</div>
        <div className="table-button-group">
          <Button
            className="table-button"
            icon={<PlusOutlined />}
            onClick={() => handleAddAccount()}
          >
            Add New Account
          </Button>
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
            onClick={() => setReload(!reload)}
          />
        </div>
      </div>
      <Spin spinning={isReloading}>
        <Table dataSource={filterMentors}>
          <Column title="Name" dataIndex="name" key="name" />
          <Column
            title="No. of Appointments"
            dataIndex="numOfAppointments"
            key="numOfAppointments"
            align="center"
          />
          <Column
            title="Appointment Details"
            dataIndex="appointments"
            key="appointments"
            render={(appointments) => (
              <a className="table-appt-view" props={appointments}>
                View
              </a>
            )}
            align="center"
          />
          <Column
            title="Delete"
            dataIndex="id"
            key="id"
            render={(mentorId) => (
              <Checkbox onClick={() => handleDeleteAccount(mentorId)} />
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
                href={formatLinkForHref(`localhost:3000/gallery/${id}`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkOutlined /> {`localhost:3000/gallery/${id}`}
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
