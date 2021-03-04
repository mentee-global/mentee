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
import result from "../../resources/accountsData.json";

const { Column } = Table;

/*
TODO:
 [X] Implement table
 [X] Create dummy data that can be used with the table
 [] Implement buttons and hotwire them to their respective placeholder endpoints
 [] Implement search feature by name
*/

function AdminAccountData() {
  const [isReloading, setIsReloading] = useState(false);
  const [mentorData, setMentorData] = useState([]);

  useEffect(() => {
    async function getMentorData() {
      setMentorData(result.result.data);
    }
    getMentorData();
  }, [isReloading]);

  return (
    <div className="account-data-body">
      <Breadcrumb>
        <Breadcrumb.Item>User Reports</Breadcrumb.Item>
        <Breadcrumb.Item>
          <a href="account-data">Account Data</a>
        </Breadcrumb.Item>
      </Breadcrumb>
      <div className="table-search">
        <Input
          placeholder="Search by name"
          prefix={<UserOutlined />}
          allowClear
          size="medium"
        />
      </div>
      <div className="table-header">
        <div className="table-title">Mentors</div>
        <div className="table-button-group">
          <Button className="table-button" icon={<PlusOutlined />}>
            Add New Account
          </Button>
          <Button className="table-button" icon={<DownloadOutlined />}>
            Mentor Account Data
          </Button>
          <Button className="table-button" icon={<DownloadOutlined />}>
            Mentee Account Data
          </Button>
          <ReloadOutlined
            className="table-button"
            style={{ fontSize: "16px" }}
            spin={isReloading}
            onClick={() => setIsReloading(!isReloading)}
          />
        </div>
      </div>
      <Spin spinning={isReloading}>
        <Table dataSource={mentorData}>
          <Column title="Name" dataIndex="name" key="name" />
          <Column
            title="No. of Appointments"
            dataIndex="numOfAppointments"
            key="numOfAppointments"
          />
          <Column
            title="Appointment Details"
            dataIndex="appointments"
            key="appointments"
            render={(appointments) => <a props={appointments}>View</a>}
          />
          <Column
            title="Delete"
            dataIndex="id"
            key="id"
            render={(mentorId) => (
              <Checkbox
                onClick={() => console.log(`Finna delete ${mentorId}`)}
              />
            )}
          />
          <Column
            title="Link to Profile"
            dataIndex="id"
            key="id"
            render={(id) => (
              <a>
                <LinkOutlined /> {`localhost:3000/gallery/${id}`}
              </a>
            )}
          />
        </Table>
      </Spin>
    </div>
  );
}

export default AdminAccountData;
