import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  downloadBlob,
  getLibraryFile,
  deleteLibrarybyId,
  EditDataById,
  newLibraryCreate,
  getLibraryById,
  getCommunityLibraries,
  fetchPartners,
} from "utils/api";
import { I18N_LANGUAGES, ACCOUNT_TYPE } from "utils/consts";
import {
  Table,
  Popconfirm,
  message,
  Button,
  notification,
  Spin,
  Skeleton,
  Avatar,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusCircleOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { withRouter, NavLink } from "react-router-dom";

import "components/css/Training.scss";
import UpdateCommunityLibraryModal from "../UpdateCommunityLibraryModal";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DndContext } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { useSelector } from "react-redux";

const RowContext = React.createContext({});

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

const CommunityLibrary = () => {
  const [data, setData] = useState([]);
  const [reload, setReload] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [openUpdateData, setOpenUpdateData] = useState(false);
  const [currentData, setCurrentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((state) => state.user);
  const [hubData, setHubData] = useState([]);

  useEffect(() => {
    async function getUsers(hub_id) {
      let data = await fetchPartners(undefined, hub_id);
      setHubData(data);
    }
    if (user) {
      getUsers(!user.hub_id ? user._id.$oid : user.hub_id);
    }
  }, [user]);

  const onCancelTrainingForm = () => {
    setSelectedId(null);
    setCurrentData(null);
    setOpenUpdateData(false);
  };

  const onFinishTrainingForm = async (values, isNewTraining) => {
    setLoading(true);
    if (isNewTraining) {
      message.loading("Announcing new library...", 3);
      const res = await newLibraryCreate(values, user);
      if (!res?.success) {
        notification.error({
          message: "ERROR",
          description: `Couldn't create new library`,
        });
      } else {
        notification.success({
          message: "SUCCESS",
          description: "New library has been created successfully",
        });
      }
    } else {
      const res = await EditDataById(selectedId, values);
      if (!res?.success) {
        notification.error({
          message: "ERROR",
          description: `Couldn't update library`,
        });
      } else {
        notification.success({
          message: "SUCCESS",
          description: "Libarary has been updated successfully",
        });
      }
    }
    setLoading(false);
    setSelectedId(null);
    setReload(!reload);
    setCurrentData(null);
    setOpenUpdateData(false);
  };

  const openUpdateTrainingModal = (id = null) => {
    if (id) {
      setSelectedId(id);
      getLibraryById(id).then((res) => {
        if (res) {
          setCurrentData(res);
          setOpenUpdateData(true);
        }
      });
    } else {
      setSelectedId(null);
      setCurrentData(null);
      setOpenUpdateData(true);
    }
  };

  const copyDownLink = async (record, lang) => {
    let copied_link =
      "<a href='#' alt='download_file_" +
      record.id +
      "'>" +
      record.file_name +
      "</a>";
    navigator.clipboard.writeText(copied_link);
    message.success("Copied");
  };

  const handleTrainingDownload = async (record, lang) => {
    let response = await getLibraryFile(record.id, lang);
    if (!response) {
      notification.error({
        message: "ERROR",
        description: "Couldn't download file",
      });
      return;
    }
    downloadBlob(response, record.file_name);
  };

  const deleteData = async (id) => {
    const success = await deleteLibrarybyId(id);
    if (success) {
      notification.success({
        message: "SUCCESS",
        description: "Library has been deleted successfully",
      });
      setReload(!reload);
    } else {
      notification.error({
        message: "ERROR",
        description: `Couldn't delete library`,
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
      let newData = await getCommunityLibraries(user);
      if (newData) {
        setData(newData);
      } else {
        setData([]);
        notification.error({
          message: "ERROR",
          description: "Couldn't get trainings",
        });
      }
      setLoading(false);
    };
    if (user) {
      getData();
    }
  }, [user, reload]);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name) => <>{name}</>,
    },
    {
      title: "User",
      dataIndex: "user_name",
      key: "user_name",
      render: (user_name, record) => {
        let user_data = hubData.find((x) => x._id.$oid == record.user_id);
        if (user_data) {
          return (
            <NavLink
              to={`/gallery/${ACCOUNT_TYPE.PARTNER}/${user_data._id.$oid}`}
            >
              <div style={{ display: "flex" }}>
                <div style={{ width: "50px", textAlign: "center" }}>
                  <Avatar
                    src={user_data?.image?.url}
                    style={{
                      cursor: "pointer",
                      width: "50px",
                      height: "50px",
                      border: "1.5px solid rgb(198, 204, 208)",
                      borderRadius: "50%",
                    }}
                  />
                </div>
                <div style={{ marginLeft: "10px", paddingTop: "10px" }}>
                  {user_name}
                </div>
              </div>
            </NavLink>
          );
        } else {
          return (
            <NavLink to={`/gallery/${ACCOUNT_TYPE.HUB}/${record.user_id}`}>
              <div style={{ display: "flex" }}>
                <div style={{ width: "50px", textAlign: "center" }}>
                  <Avatar
                    src={
                      user
                        ? user.hub_user
                          ? user.hub_user.image?.url
                          : user.image?.url
                        : ""
                    }
                    style={{
                      cursor: "pointer",
                      width: "50px",
                      height: "50px",
                      border: "1.5px solid rgb(198, 204, 208)",
                      borderRadius: "50%",
                    }}
                  />
                </div>
                <div style={{ marginLeft: "10px", paddingTop: "10px" }}>
                  {user_name}
                </div>
              </div>
            </NavLink>
          );
        }
      },
    },
    {
      title: "File",
      dataIndex: "file",
      key: "file",
      render: (file, record) => {
        return (
          <div style={{ display: "flex" }}>
            <a
              href="#"
              onClick={(lang) => handleTrainingDownload(record, lang)}
            >
              {record.file_name}
            </a>
            <Button
              type="link"
              icon={<CopyOutlined />}
              onClick={(lang) => copyDownLink(record, lang)}
              style={{ marginLeft: "8px", paddingTop: "0px" }}
            />
          </div>
        );
      },
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (description) => <>{description}</>,
    },
    {
      title: "Edit",
      dataIndex: "id",
      key: "id",
      render: (id, record) => {
        if (user._id.$oid === record.user_id) {
          return (
            <EditOutlined
              className="delete-user-btn"
              onClick={() => openUpdateTrainingModal(id)}
            />
          );
        } else {
          <></>;
        }
      },
      align: "center",
    },
    {
      title: "Delete",
      dataIndex: "id",
      key: "id",
      render: (id, record) => {
        if (user._id.$oid === record.user_id) {
          return (
            <>
              <Popconfirm
                title={`Are you sure you want to delete ?`}
                onConfirm={() => {
                  deleteData(id);
                }}
                onCancel={() => message.info(`No deletion has been made`)}
                okText="Yes"
                cancelText="No"
              >
                <DeleteOutlined className="delete-user-btn" />
              </Popconfirm>
            </>
          );
        } else {
          return <></>;
        }
      },
      align: "center",
    },
  ];

  return (
    <div className="trains">
      <div className="flex" style={{ marginBottom: "1rem" }}>
        <Button
          className="table-button"
          icon={<PlusCircleOutlined />}
          onClick={() => {
            openUpdateTrainingModal();
          }}
          disabled={false}
        >
          New Data
        </Button>
      </div>
      <Spin spinning={false}>
        <Skeleton loading={loading} active>
          <DndContext modifiers={[restrictToVerticalAxis]}>
            <SortableContext
              items={data.map((i) => i.id)}
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
                dataSource={data}
                pagination={false}
              />
            </SortableContext>
          </DndContext>
        </Skeleton>
      </Spin>
      <UpdateCommunityLibraryModal
        open={openUpdateData}
        onCancel={onCancelTrainingForm}
        onFinish={onFinishTrainingForm}
        currentData={currentData}
        loading={loading}
      />
    </div>
  );
};

export default withRouter(CommunityLibrary);
