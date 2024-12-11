import React, { useEffect, useMemo, useState } from "react";
import {
  downloadBlob,
  getSignedData,
  getSignedDocfile,
  fetchAccounts,
  newPolicyCreate,
} from "utils/api";
import { ACCOUNT_TYPE } from "utils/consts";
import {
  Table,
  message,
  Button,
  notification,
  Spin,
  Tabs,
  Skeleton,
} from "antd";
import { withRouter } from "react-router-dom";

import "components/css/Training.scss";
import AddPolicyModal from "../AddPolicyModal";

const AdminSign = () => {
  const [role, setRole] = useState("policy");
  const [signedData, setSignedData] = useState([]);
  const [reload, setReload] = useState(true);
  const [translateLoading, setTranslateLoading] = useState(false);
  const [openAddPolicy, setOpenAddPolicy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hubOptions, setHubOptions] = useState([]);
  const [resetFilters, setResetFilters] = useState(false);

  const onCancelTrainingForm = () => {
    setOpenAddPolicy(false);
  };

  useEffect(() => {
    async function getHubData() {
      var temp = [];
      const hub_data = await fetchAccounts(ACCOUNT_TYPE.HUB);
      hub_data.map((hub_item) => {
        temp.push({ label: hub_item.name, value: hub_item._id.$oid });
        return true;
      });
      setHubOptions(temp);
    }
    getHubData();
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    message.loading("Announcing new Policy...", 3);
    const res = await newPolicyCreate(values);
    if (!res?.success) {
      notification.error({
        message: "ERROR",
        description: `Couldn't add new policy doc`,
      });
    } else {
      setOpenAddPolicy(false);
      notification.success({
        message: "SUCCESS",
        description: "New Policy doc has been added successfully",
      });
    }

    setLoading(false);
    setReload(!reload);
  };

  const handleTrainingDownload = async (record) => {
    let response = await getSignedDocfile(record._id.$oid, role);
    if (!response) {
      notification.error({
        message: "ERROR",
        description: "Couldn't download file",
      });
      return;
    }
    downloadBlob(
      response,
      role === "policy" ? "Policy_doc.pdf" : "signed_document.pdf"
    );
  };

  useMemo(() => {
    const getData = async () => {
      setLoading(true);
      let newData = await getSignedData(role);
      if (newData) {
        setSignedData(newData);
      } else {
        setSignedData([]);
        notification.error({
          message: "ERROR",
          description: "Couldn't get trainings",
        });
      }
      setLoading(false);
    };
    getData();
  }, [role, reload]);

  const columns = [
    {
      title: role === "policy" ? "Name" : "User",
      dataIndex: role === "policy" ? "name" : "user_email",
      key: role === "policy" ? "name" : "user_email",
      render:
        role === "policy"
          ? (name) => <>{name}</>
          : (user_email) => <>{user_email}</>,
    },
    {
      title: "Document",
      dataIndex: "id",
      key: "document",
      render: (id, record) => {
        return (
          <Button onClick={() => handleTrainingDownload(record)}>
            {role === "policy" ? "Download Policy PDF" : "Download Signed PDF"}
          </Button>
        );
      },
    },
    {
      title: "Signed Date",
      dataIndex: "date_submitted",
      key: "date_submitted",
      render: (date_submitted) => (
        <>{new Date(date_submitted.$date).toLocaleString()}</>
      ),
    },
  ];

  const tabItems = [
    {
      label: `Policy Doc`,
      key: "policy",
      disabled: translateLoading,
    },
    {
      label: `Mentee`,
      key: ACCOUNT_TYPE.MENTEE,
      disabled: translateLoading,
    },
    {
      label: `Mentor`,
      key: ACCOUNT_TYPE.MENTOR,
      disabled: translateLoading,
    },
    {
      label: `Partner`,
      key: ACCOUNT_TYPE.PARTNER,
      disabled: translateLoading,
    },
  ];

  return (
    <div className="trains">
      <Tabs
        defaultActiveKey={"policy"}
        onChange={(key) => {
          setRole(key);
          setResetFilters(!resetFilters);
        }}
        items={tabItems}
      />
      <div className="flex" style={{ marginBottom: "1rem" }}>
        {/* <div style={{ lineHeight: "30px", marginLeft: "1rem" }}>Hub</div>
        <HubsDropdown
          className="table-button hub-drop-down"
          options={hubOptions}
          onChange={(key) => searchbyHub(key)}
          onReset={resetFilters}
        />
        <Button className="" onClick={() => handleResetFilters()}>
          Clear Filters
        </Button> */}
      </div>
      <Spin spinning={translateLoading}>
        <Skeleton loading={loading} active>
          <Table columns={columns} dataSource={signedData} />
        </Skeleton>
      </Spin>
      <AddPolicyModal
        open={openAddPolicy}
        onCancel={onCancelTrainingForm}
        onFinish={onFinish}
        loading={loading}
        hubOptions={hubOptions}
      />
    </div>
  );
};

export default withRouter(AdminSign);
