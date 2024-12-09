import React, { useEffect, useMemo, useState } from "react";
import {
  deleteTrainbyId,
  downloadBlob,
  getSignedData,
  getSignedDocfile,
  fetchAccounts,
  newPolicyCreate,
} from "utils/api";
import { ACCOUNT_TYPE, I18N_LANGUAGES, TRAINING_TYPE } from "utils/consts";
import { HubsDropdown } from "../AdminDropdowns";
import {
  Table,
  Popconfirm,
  message,
  Button,
  notification,
  Spin,
  Tabs,
  Skeleton,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusCircleOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { withRouter } from "react-router-dom";

import "components/css/Training.scss";
import AdminDownloadDropdown from "../AdminDownloadDropdown";
import AddPolicyModal from "../AddPolicyModal";

const AdminSign = () => {
  const [role, setRole] = useState(ACCOUNT_TYPE.MENTEE);
  const [signedData, setSignedData] = useState([]);
  const [reload, setReload] = useState(true);
  const [translateLoading, setTranslateLoading] = useState(false);
  const [translateOpen, setTranslateOpen] = useState(false);
  const [openAddPolicy, setOpenAddPolicy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hubOptions, setHubOptions] = useState([]);
  const [resetFilters, setResetFilters] = useState(false);
  const [allData, setAllData] = useState([]);

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

  const handleResetFilters = () => {
    setResetFilters(!resetFilters);
    setSignedData(allData);
  };

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
    let response = await getSignedDocfile(record._id.$oid);
    if (!response) {
      notification.error({
        message: "ERROR",
        description: "Couldn't download file",
      });
      return;
    }
    downloadBlob(response, "signed_document.pdf");
  };

  useMemo(() => {
    const getData = async () => {
      setLoading(true);
      let newData = await getSignedData(role);
      if (newData) {
        setSignedData(newData);
        setAllData(newData);
      } else {
        setSignedData([]);
        setAllData([]);
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
      title: "User",
      dataIndex: "user_email",
      key: "user_email",
      render: (user_email) => <>{user_email}</>,
    },
    {
      title: "Document",
      dataIndex: "id",
      key: "document",
      render: (id, record) => {
        return (
          <Button onClick={() => handleTrainingDownload(record)}>
            Download Signed PDF
          </Button>
        );
      },
    },
  ];

  const searchbyHub = (hub_id) => {
    if (role === ACCOUNT_TYPE.HUB) {
      setSignedData(allData.filter((x) => x.hub_id == hub_id));
    }
  };

  const tabItems = [
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
    // {
    //   label: `Hub`,
    //   key: ACCOUNT_TYPE.HUB,
    //   disabled: translateLoading,
    // },
  ];

  return (
    <div className="trains">
      <Tabs
        defaultActiveKey={ACCOUNT_TYPE.MENTEE}
        onChange={(key) => {
          setRole(key);
          setResetFilters(!resetFilters);
        }}
        items={tabItems}
      />
      <div className="flex" style={{ marginBottom: "1rem" }}>
        <Button
          className="table-button"
          icon={<PlusCircleOutlined />}
          onClick={() => {
            setOpenAddPolicy(true);
          }}
          disabled={translateLoading}
        >
          New Policy Doc
        </Button>
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
