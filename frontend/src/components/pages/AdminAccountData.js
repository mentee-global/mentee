import React from "react";
import { Table, Button, Breadcrumb, Pagination, Input, Checkbox } from "antd";
import {
  DownloadOutlined,
  LoadingOutlined,
  ReloadOutlined,
  LinkOutlined,
  UserOutlined,
} from "@ant-design/icons";

/*
TODO:
 [] Implement table
 [] Create dummy data that can be used with the table
 [] Implement buttons and hotwire them to their respective placeholder endpoints
 [] Implement search feature by name
*/

function AdminAccountData() {
  return (
    <div>
      <Breadcrumb>
        <Breadcrumb.Item>User Reports</Breadcrumb.Item>
        <Breadcrumb.Item>
          <a href="account-data">Account Data</a>
        </Breadcrumb.Item>
      </Breadcrumb>
      <Input prefix={<UserOutlined />} allowClear size="small" />
      <Table />
    </div>
  );
}

export default AdminAccountData;
