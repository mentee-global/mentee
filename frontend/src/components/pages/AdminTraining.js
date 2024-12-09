import React, { useEffect, useMemo, useState } from "react";
import {
  deleteTrainbyId,
  downloadBlob,
  EditTrainById,
  getTrainById,
  getTrainings,
  getTrainVideo,
  fetchAccounts,
  newTrainCreate,
} from "utils/api";
import { ACCOUNT_TYPE, I18N_LANGUAGES, TRAINING_TYPE } from "utils/consts";
import { HubsDropdown } from "../AdminDropdowns";
import {
  Table,
  Popconfirm,
  message,
  Radio,
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
import TrainingTranslationModal from "../TrainingTranslationModal";
import UpdateTrainingForm from "../UpdateTrainingModal";

const AdminTraining = () => {
  const [role, setRole] = useState(ACCOUNT_TYPE.MENTEE);
  const [trainingData, setTrainingData] = useState([]);
  const [reload, setReload] = useState(true);
  const [translateLoading, setTranslateLoading] = useState(false);
  const [translateOpen, setTranslateOpen] = useState(false);
  // const [documentCost, setDocumentCost] = useState(null);
  const [trainingId, setTrainingId] = useState(null);
  const [openUpdateTraining, setOpenUpdateTraining] = useState(false);
  const [currentTraining, setCurrentTraining] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hubOptions, setHubOptions] = useState([]);
  const [resetFilters, setResetFilters] = useState(false);
  const [allData, setAllData] = useState([]);

  const onCancelTrainingForm = () => {
    setTrainingId(null);
    setCurrentTraining(null);
    setOpenUpdateTraining(false);
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
    setTrainingData(allData);
  };

  const onFinishTrainingForm = async (values, isNewTraining) => {
    setLoading(true);
    if (isNewTraining) {
      message.loading("Announcing new training...", 3);
      const res = await newTrainCreate(values);
      if (!res?.success) {
        notification.error({
          message: "ERROR",
          description: `Couldn't create new training`,
        });
      } else {
        notification.success({
          message: "SUCCESS",
          description: "New training has been created successfully",
        });
      }
    } else {
      const res = await EditTrainById(trainingId, values);
      if (!res?.success) {
        notification.error({
          message: "ERROR",
          description: `Couldn't update training`,
        });
      } else {
        notification.success({
          message: "SUCCESS",
          description: "Training has been updated successfully",
        });
      }
    }
    setLoading(false);
    setTrainingId(null);
    setReload(!reload);
    setCurrentTraining(null);
    setOpenUpdateTraining(false);
  };

  const openUpdateTrainingModal = (id = null) => {
    if (id) {
      setTrainingId(id);
      getTrainById(id).then((res) => {
        if (res) {
          setCurrentTraining(res);
          setOpenUpdateTraining(true);
        }
      });
    } else {
      setTrainingId(null);
      setCurrentTraining(null);
      setOpenUpdateTraining(true);
    }
  };

  const handleTrainingDownload = async (record, lang) => {
    let response = await getTrainVideo(record.id, lang);
    if (!response) {
      notification.error({
        message: "ERROR",
        description: "Couldn't download file",
      });
      return;
    }
    downloadBlob(response, record.file_name);
  };

  const deleteTrain = async (id) => {
    const success = await deleteTrainbyId(id);
    if (success) {
      notification.success({
        message: "SUCCESS",
        description: "Training has been deleted successfully",
      });
      setReload(!reload);
    } else {
      notification.error({
        message: "ERROR",
        description: `Couldn't delete training`,
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

  const translateOpenChange = async (selectedId) => {
    // setTranslateLoading(true);
    // message.loading("Getting translation cost...", 4);
    setTrainingId(selectedId);
    // const res = await getTranslateDocumentCost(selectedId);
    // if (!res?.success) {
    //   notification.error({
    //     message: "ERROR",
    //     description: `Couldn't get translation cost`,
    //   });
    //   setTranslateLoading(false);
    //   return;
    // }
    // const resPrice = res?.result?.cost;

    // let formatCost = Intl.NumberFormat("en-US", {
    //   style: "currency",
    //   currency: "USD",
    //   maximumSignificantDigits: 3,
    // });
    // setDocumentCost(formatCost.format(resPrice));
    // setTranslateLoading(false);
    setTranslateOpen(true);
  };

  useMemo(() => {
    const getData = async () => {
      setLoading(true);
      let newData = await getTrainings(role);
      if (newData) {
        setTrainingData(newData);
        setAllData(newData);
      } else {
        setTrainingData([]);
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
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name) => <>{name}</>,
    },
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      render: (url, record) => {
        if (record.typee !== TRAINING_TYPE.DOCUMENT) {
          return (
            <a href={url} target="_blank">
              {url}
            </a>
          );
        } else {
          return (
            <AdminDownloadDropdown
              options={getAvailableLangs(record)}
              title="Download Document"
              onClick={(lang) => handleTrainingDownload(record, lang)}
            />
          );
        }
      },
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (description) => <>{description}</>,
    },
    {
      title: "Type",
      dataIndex: "typee",
      key: "typee",
      render: (typee) => <>{typee}</>,
    },
    {
      title: "Translate Document",
      dataIndex: "id",
      key: "id",
      render: (trainingId, record) => (
        <>
          {record.typee === TRAINING_TYPE.DOCUMENT ? (
            <TeamOutlined
              className={"delete-user-btn"}
              onClick={() => translateOpenChange(trainingId)}
            />
          ) : (
            <></>
          )}
        </>
      ),
      align: "center",
    },
    {
      title: "Sign",
      dataIndex: "requried_sign",
      key: "requried_sign",
      render: (requried_sign) => <>{requried_sign ? "required" : ""}</>,
      align: "center",
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
          onClick={() => openUpdateTrainingModal(id)}
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
            deleteTrain(id);
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
      setTrainingData(allData.filter((x) => x.hub_id == hub_id));
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
    {
      label: `Hub`,
      key: ACCOUNT_TYPE.HUB,
      disabled: translateLoading,
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
            openUpdateTrainingModal();
          }}
          disabled={translateLoading}
        >
          New Training
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
      <Spin spinning={translateLoading}>
        <Skeleton loading={loading} active>
          <Table columns={columns} dataSource={trainingData} />
        </Skeleton>
      </Spin>
      <TrainingTranslationModal
        setOpenModal={setTranslateOpen}
        openModal={translateOpen}
        //documentCost={documentCost}
        trainingId={trainingId}
      />
      <UpdateTrainingForm
        open={openUpdateTraining}
        onCancel={onCancelTrainingForm}
        onFinish={onFinishTrainingForm}
        currentTraining={currentTraining}
        loading={loading}
        hubOptions={hubOptions}
      />
    </div>
  );
};

export default withRouter(AdminTraining);
