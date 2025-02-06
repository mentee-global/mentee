import React, { useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
  deleteTrainbyId,
  downloadBlob,
  EditTrainById,
  getTrainById,
  getTrainings,
  getTrainVideo,
  fetchAccounts,
  fetchPartners,
  newTrainCreate,
  updateTrainings,
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
  HolderOutlined,
  PlusCircleOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { withRouter } from "react-router-dom";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DndContext, MeasuringStrategy } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

import "components/css/Training.scss";
import AdminDownloadDropdown from "../AdminDownloadDropdown";
import TrainingTranslationModal from "../TrainingTranslationModal";
import UpdateTrainingForm from "../UpdateTrainingModal";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DndContext } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

const RowContext = React.createContext({});
const DragHandle = () => {
  const { setActivatorNodeRef, listeners } = useContext(RowContext);
  return (
    <Button
      type="text"
      size="small"
      icon={<HolderOutlined />}
      style={{
        cursor: "move",
      }}
      ref={setActivatorNodeRef}
      {...listeners}
    />
  );
};

const Row = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props["data-row-key"],
  });
  const style = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    ...(isDragging
      ? {
          position: "relative",
          zIndex: 999,
        }
      : {}),
  };
  const contextValue = useMemo(
    () => ({
      setActivatorNodeRef,
      listeners,
    }),
    [setActivatorNodeRef, listeners]
  );
  return (
    <RowContext.Provider value={contextValue}>
      <tr {...props} ref={setNodeRef} style={style} {...attributes} />
    </RowContext.Provider>
  );
};

const RowContext = React.createContext({});
const DragHandle = () => {
  const { setActivatorNodeRef, listeners } = useContext(RowContext);
  return (
    <Button
      type="text"
      size="small"
      icon={<HolderOutlined />}
      style={{
        cursor: "move",
      }}
      ref={setActivatorNodeRef}
      {...listeners}
    />
  );
};

const Row = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props["data-row-key"],
    animateLayoutChanges: () => false,
  });

  const style = useMemo(() => ({
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition: 'none',  // Disable all transitions
    position: isDragging ? 'relative' : undefined,
    zIndex: isDragging ? 999 : undefined,
    background: isDragging ? '#fafafa' : undefined,
  }), [props.style, transform, isDragging]);

  const contextValue = useMemo(
    () => ({
      setActivatorNodeRef,
      listeners,
    }),
    [setActivatorNodeRef, listeners]
  );

  return (
    <RowContext.Provider value={contextValue}>
      <tr {...props} ref={setNodeRef} style={style} {...attributes} />
    </RowContext.Provider>
  );
};

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
  const [partnerOptions, setPartnerOptions] = useState([]);
  const [mentorOptions, setMentorOptions] = useState([]);
  const [menteeOptions, setMenteeOptions] = useState([]);
  const [allData, setAllData] = useState([]);

  useEffect(() => {
    // Suppress ResizeObserver loop limit exceeded error
    const resizeObserverError = window.ResizeObserver.prototype.constructor;
    window.ResizeObserver.prototype.constructor = (...args) => {
      const observer = resizeObserverError(...args);
      const error = observer.error;
      observer.error = () => {
        // Ignore ResizeObserver loop limit exceeded error
      };
      return observer;
    };
  }, []);

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
    setTrainingData(allData.sort((a, b) => a.sort_order - b.sort_order));
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

  const onDragEnd = useCallback((event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    setTrainingData((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      
      requestAnimationFrame(() => {
        const updatedOrder = newItems.map((item, index) => ({
          id: item.id,
          updated_data: { sort_order: index + 1 },
        }));
        updatedTraningData(updatedOrder);
      });

      return newItems;
    });
  }, []);

  const updatedTraningData = async (data) => {
    try {
      await updateTrainings(data);
      return "success";
    } catch (err) {
      console.error(err);
      return err;
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
    setTrainingId(selectedId);
    setTranslateOpen(true);
  };

  useMemo(() => {
    const getData = async () => {
      setLoading(true);
      let newData = await getTrainings(role);
      if (newData) {
        setTrainingData(newData.sort((a, b) => a.sort_order - b.sort_order));
        setAllData(newData.sort((a, b) => a.sort_order - b.sort_order));
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
      key: "sort",
      align: "center",
      width: 60,
      render: () => <DragHandle />,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 200,
      render: (name) => <>{name}</>,
    },
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      width: 350,
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
      width: 250,
      render: (description) => <>{description}</>,
    },
    {
      title: "Type",
      dataIndex: "typee",
      key: "typee",
      width: 120,
      render: (typee) => <>{typee}</>,
    },
    {
      title: "Translate Document",
      dataIndex: "id",
      key: "id",
      width: 110,
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
      width: 100,
      render: (requried_sign) => <>{requried_sign ? "required" : ""}</>,
      align: "center",
    },
    {
      title: "Hub User",
      dataIndex: "hub_user",
      key: "hub_user",
      width: 150,
      render: (hub_user) => <>{hub_user.name}</>,
      align: "center",
    },
    {
      title: "",
      dataIndex: "id",
      key: "id",
      width: 40,
      render: (id) => (
        <EditOutlined
          className="delete-user-btn"
          onClick={() => openUpdateTrainingModal(id)}
        />
      ),
      align: "center",
    },
    {
      title: "",
      dataIndex: "id",
      key: "id",
      width: 40,
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
      setTrainingData(
        allData
          .sort((a, b) => a.sort_order - b.sort_order)
          .filter((x) => x.hub_id == hub_id)
      );
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

  console.log(trainingData);

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
          <DndContext
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={onDragEnd}
            autoScroll={false}
          >
            <SortableContext
              items={trainingData.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <Table
                rowKey="id"
                components={{
                  body: {
                    row: Row,
                  },
                }}
                columns={columns}
                dataSource={trainingData}
                pagination={false}
                style={{ width: '100%' }}
                tableLayout="fixed"
              />
            </SortableContext>
          </DndContext>
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
        partnerOptions={partnerOptions}
        menteeOptions={menteeOptions}
        mentorOptions={mentorOptions}
      />
    </div>
  );
};

export default withRouter(AdminTraining);
