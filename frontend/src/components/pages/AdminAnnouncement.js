import React, { useEffect, useMemo, useState } from "react";
import {
  deleteAnnouncebyId,
  downloadBlob,
  EditAnnounceById,
  getAnnounceById,
  getAnnouncements,
  getAnnounceDoc,
  fetchAccounts,
  fetchPartners,
  newAnnounceCreate,
  uploadAnnounceImage,
} from "utils/api";
import { ACCOUNT_TYPE, I18N_LANGUAGES } from "utils/consts";
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
} from "@ant-design/icons";
import { withRouter } from "react-router-dom";

import "components/css/Training.scss";
import AdminDownloadDropdown from "../AdminDownloadDropdown";
import UpdateAnnouncementModal from "../UpdateAnnouncementModal";

const AdminAnnouncement = () => {
  const [role, setRole] = useState(ACCOUNT_TYPE.MENTEE);
  const [announceData, setAnnounceData] = useState([]);
  const [reload, setReload] = useState(true);
  // const [documentCost, setDocumentCost] = useState(null);
  const [announceId, setAnnounceId] = useState(null);
  const [openUpdateAnnounce, setOpenUpdateAnnounce] = useState(false);
  const [currentAnnounce, setCurrentAnnounce] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hubOptions, setHubOptions] = useState([]);
  const [resetFilters, setResetFilters] = useState(false);
  const [partnerOptions, setPartnerOptions] = useState([]);
  const [mentorOptions, setMentorOptions] = useState([]);
  const [menteeOptions, setMenteeOptions] = useState([]);
  const [allData, setAllData] = useState([]);

  const onCancelAnnounceForm = () => {
    setAnnounceId(null);
    setCurrentAnnounce(null);
    setOpenUpdateAnnounce(false);
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
    async function getUsers() {
      var temp = [];
      let data = await fetchPartners();
      data.map((item) => {
        temp.push({
          label: item.organization,
          value: item._id.$oid,
          assign_mentees: item.assign_mentees,
          assign_mentors: item.assign_mentors,
        });
        return true;
      });
      setPartnerOptions(temp);
      data = await fetchAccounts(ACCOUNT_TYPE.MENTEE);
      setMenteeOptions(data);
      data = await fetchAccounts(ACCOUNT_TYPE.MENTOR);
      setMentorOptions(data);
    }
    getHubData();
    getUsers();
  }, []);

  const handleResetFilters = () => {
    setResetFilters(!resetFilters);
    setAnnounceData(allData);
  };

  const onFinishAnnounceForm = async (
    values,
    isNewAnnounce,
    image,
    changedImage
  ) => {
    setLoading(true);
    let res = null;
    if (isNewAnnounce) {
      message.loading("Announcing new Announcement...", 3);
      res = await newAnnounceCreate(values);
      if (!res?.success) {
        notification.error({
          message: "ERROR",
          description: `Couldn't create new Announcement`,
        });
      } else {
        notification.success({
          message: "SUCCESS",
          description: "New Announcement has been created successfully",
        });
      }
    } else {
      res = await EditAnnounceById(announceId, values);
      if (!res?.success) {
        notification.error({
          message: "ERROR",
          description: `Couldn't update Announcement`,
        });
      } else {
        notification.success({
          message: "SUCCESS",
          description: "Announcement has been updated successfully",
        });
      }
    }
    if (image && changedImage) {
      if (res && res.success) {
        await uploadAnnounceImage(image, res.result.announce._id.$oid);
      }
    }
    setLoading(false);
    setAnnounceId(null);
    setReload(!reload);
    setCurrentAnnounce(null);
    setOpenUpdateAnnounce(false);
  };

  const openUpdateAnnounceModal = (id = null) => {
    if (id) {
      setAnnounceId(id);
      getAnnounceById(id).then((res) => {
        if (res) {
          setCurrentAnnounce(res);
          setOpenUpdateAnnounce(true);
        }
      });
    } else {
      setAnnounceId(null);
      setCurrentAnnounce(null);
      setOpenUpdateAnnounce(true);
    }
  };

  const handleAnnounceDownload = async (record, lang) => {
    let response = await getAnnounceDoc(record.id, lang);
    if (!response) {
      notification.error({
        message: "ERROR",
        description: "Couldn't download file",
      });
      return;
    }
    downloadBlob(response, record.file_name);
  };

  const deleteAnnounce = async (id) => {
    const success = await deleteAnnouncebyId(id);
    if (success) {
      notification.success({
        message: "SUCCESS",
        description: "Announcement has been deleted successfully",
      });
      setReload(!reload);
    } else {
      notification.error({
        message: "ERROR",
        description: `Couldn't delete Announcement`,
      });
    }
  };

  const getAvailableLangs = (record) => {
    if (!record?.translations) return [I18N_LANGUAGES[0]];
    let items = I18N_LANGUAGES.filter((lang) => {
      return (
        Object.keys(record?.translations).includes(lang.value) &&
        record?.translations[lang.value] !== null
      );
    });
    // Appends English by default
    items.unshift(I18N_LANGUAGES[0]);
    return items;
  };

  useMemo(() => {
    const getData = async () => {
      setLoading(true);
      let newData = await getAnnouncements(role);
      if (newData) {
        setAnnounceData(newData);
        setAllData(newData);
      } else {
        setAnnounceData([]);
        setAllData([]);
        notification.error({
          message: "ERROR",
          description: "Couldn't get Announcements",
        });
      }
      setLoading(false);
    };
    getData();
  }, [role, reload]);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name) => <>{name}</>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (description) => <>{description}</>,
    },
    {
      title: "Document",
      dataIndex: "file_name",
      key: "file_name",
      render: (file_name, record) => {
        if (file_name && file_name !== "") {
          return (
            <AdminDownloadDropdown
              options={getAvailableLangs(record)}
              title={file_name}
              onClick={(lang) => handleAnnounceDownload(record, lang)}
            />
          );
        }
      },
    },
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      render: (image) => {
        if (image) {
          return <img style={{ maxHeight: "50px" }} src={image.url} alt="" />;
        }
      },
    },
    {
      title: "Hub User",
      dataIndex: "hub_user",
      key: "hub_user",
      render: (hub_user) => <>{hub_user.name}</>,
      align: "center",
    },
    {
      title: "Edit",
      dataIndex: "id",
      key: "id",
      render: (id) => (
        <EditOutlined
          className="delete-user-btn"
          onClick={() => openUpdateAnnounceModal(id)}
        />
      ),

      align: "center",
    },
    {
      title: "Delete",
      dataIndex: "id",
      key: "id",
      render: (id) => (
        <Popconfirm
          title={`Are you sure you want to delete ?`}
          onConfirm={() => {
            deleteAnnounce(id);
          }}
          onCancel={() => message.info(`No deletion has been made`)}
          okText="Yes"
          cancelText="No"
        >
          <DeleteOutlined className="delete-user-btn" />
        </Popconfirm>
      ),
      align: "center",
    },
  ];

  const searchbyHub = (hub_id) => {
    if (role === ACCOUNT_TYPE.HUB) {
      setAnnounceData(allData.filter((x) => x.hub_id == hub_id));
    }
  };

  const tabItems = [
    {
      label: `Mentee`,
      key: ACCOUNT_TYPE.MENTEE,
      disabled: false,
    },
    {
      label: `Mentor`,
      key: ACCOUNT_TYPE.MENTOR,
      disabled: false,
    },
    {
      label: `Partner`,
      key: ACCOUNT_TYPE.PARTNER,
      disabled: false,
    },
    {
      label: `Hub`,
      key: ACCOUNT_TYPE.HUB,
      disabled: false,
    },
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
            openUpdateAnnounceModal();
          }}
          disabled={false}
        >
          New Announcement
        </Button>
        <div style={{ lineHeight: "30px", marginLeft: "1rem" }}>Hub</div>
        <HubsDropdown
          className="table-button hub-drop-down"
          options={hubOptions}
          onChange={(key) => searchbyHub(key)}
          onReset={resetFilters}
        />
        <Button className="" onClick={() => handleResetFilters()}>
          Clear Filters
        </Button>
      </div>
      <Spin spinning={false}>
        <Skeleton loading={loading} active>
          <Table columns={columns} dataSource={announceData} />
        </Skeleton>
      </Spin>
      <UpdateAnnouncementModal
        open={openUpdateAnnounce}
        onCancel={onCancelAnnounceForm}
        onFinish={onFinishAnnounceForm}
        currentAnnounce={currentAnnounce}
        loading={loading}
        hubOptions={hubOptions}
        partnerOptions={partnerOptions}
        menteeOptions={menteeOptions}
        mentorOptions={mentorOptions}
      />
    </div>
  );
};

export default withRouter(AdminAnnouncement);
