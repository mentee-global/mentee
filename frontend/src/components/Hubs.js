import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  deleteAccountById,
  fetchAccountById,
  fetchAccounts,
  checkStatusByEmail,
  adminHubUserData,
} from "utils/api";
import { Input, Form, Button } from "antd";
import { Table, Popconfirm, message, Modal, Upload, Avatar } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusCircleOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  UploadOutlined,
  UserOutlined,
  CopyOutlined,
} from "@ant-design/icons";

import "./css/Training.scss";
import { ACCOUNT_TYPE } from "utils/consts";
import { css } from "@emotion/css";
import ImgCrop from "antd-img-crop";

export const Hubs = () => {
  const [data, setData] = useState([]);
  const [err, setErr] = useState(false);
  const [reload, setReload] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isModalVisible2, setIsModalVisible2] = useState(false);
  const [errMessage, setErrorMessage] = useState(null);
  const [selectedID, setSelectedID] = useState("");

  const [form] = Form.useForm();
  const [valuesChanged, setValuesChanged] = useState(false);
  const [alreadyInFirebase, setAlreadyInFirebase] = useState(false);
  const [image, setImage] = useState(null);
  const [changedImage, setChangedImage] = useState(false);
  const [inviteURL, setInviteURL] = useState("");
  const inviteURLRef = useRef(null);
  const [messageApi, contextHolder] = message.useMessage();

  const showModal = async (_id, isNew) => {
    if (isNew === false) {
      setIsModalVisible(true);
      let record = await fetchAccountById(_id.$oid, ACCOUNT_TYPE.HUB);
      if (record) {
        form.setFieldValue("name", record.name);
        form.setFieldValue("email", record.email);
        form.setFieldValue("url", record.url);
        form.setFieldValue("invite_key", record.invite_key);
        if (record.image) {
          setImage(record.image);
        }
        if (record.url && record.invite_key) {
          setInviteURL(
            window.location.host + "/" + record.url + "/" + record.invite_key
          );
        }
      }
      setSelectedID(_id.$oid);
    } else {
      setIsModalVisible2(true);
      setSelectedID("");
      form.resetFields();
      setImage(null);
      setInviteURL("");
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsModalVisible2(false);
    setSelectedID("");
    form.resetFields();
    setImage(null);
    setInviteURL("");
  };

  const handleValuesChange = () => {
    setValuesChanged(true);
  };

  const validatePassword = (_, value) => {
    const passwordFieldValue = form.getFieldValue("password");
    if (value && passwordFieldValue !== value) {
      return Promise.reject(new Error("The passwords do not match"));
    }

    return Promise.resolve();
  };

  const success = () => {
    message.success("Successfully added Hub user!");
    handleCancel();
  };

  const onFinish = useCallback(
    (valuesChanged, changedImage, __image, selected_id) => {
      async function addHubUser(values, __image, selected_id) {
        await adminHubUserData(values, __image, selected_id).then((res) => {
          if (res.status === 200) {
            success();
            setReload(!reload);
          } else {
            if (res.response && res.response.status === 422) {
              alert("Failed create firebase account");
            } else {
              alert("Already registered Email: " + values.email);
            }
          }
        });
      }
      if (valuesChanged || changedImage) {
        form
          .validateFields()
          .then((values) => {
            addHubUser(values, __image, selected_id);
          })
          .catch((info) => {
            console.error("Validate Failed:", info);
          });
      } else {
        handleCancel();
      }
    },
    []
  );

  const checkEmailExsit = async (e) => {
    const { inFirebase } = await checkStatusByEmail(
      e.target.value,
      ACCOUNT_TYPE.HUB
    );
    setAlreadyInFirebase(inFirebase);
  };

  const generateLink = async () => {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let key = "";

    for (let i = 0; i < 20; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      key += charset[randomIndex];
    }
    form.setFieldValue("invite_key", key);
    var hub_url = form.getFieldValue("url");
    if (hub_url) {
      setInviteURL(window.location.host + "/" + hub_url + "/" + key);
    }
    setValuesChanged(true);
  };

  const copyInviteLink = () => {
    if (inviteURL) {
      inviteURLRef.current.select();
      document.execCommand("copy");
      messageApi.success("Copied");
    }
  };

  const HubForm = () => (
    <Form
      form={form}
      onValuesChange={handleValuesChange}
      onFinish={() => onFinish(valuesChanged, changedImage, image, selectedID)}
    >
      <Form.Item
        name="name"
        rules={[
          {
            required: true,
            message: "Please input Name.",
          },
        ]}
      >
        <Input type="text" className="" bordered={true} placeholder={"Name"} />
      </Form.Item>
      <Form.Item
        name="email"
        rules={[
          {
            required: true,
            message: "Please input Email.",
          },
          {
            type: "email",
            message: "The input is not valid E-mail!",
          },
        ]}
      >
        <Input
          bordered={true}
          placeholder={"Email"}
          onBlur={(e) => checkEmailExsit(e)}
          disabled={selectedID != "" ? true : false}
        />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[
          {
            required: alreadyInFirebase || selectedID != "" ? false : true,
            message: "Please input Password.",
          },
        ]}
      >
        <Input.Password
          iconRender={(visible) =>
            visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
          }
          bordered={true}
          placeholder={"Password"}
          disabled={alreadyInFirebase || selectedID != ""}
        />
      </Form.Item>
      <Form.Item
        name="confirm"
        rules={[
          {
            required: alreadyInFirebase || selectedID != "" ? false : true,
            message: "Please confirm password!",
          },
          { validator: validatePassword },
        ]}
      >
        <Input.Password
          iconRender={(visible) =>
            visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
          }
          bordered={true}
          placeholder={"Confirm Password"}
          disabled={alreadyInFirebase || selectedID != ""}
        />
      </Form.Item>

      <Form.Item
        name="url"
        rules={[
          {
            required: true,
            message: "Please input URL.",
          },
        ]}
      >
        <Input addonBefore="URL" />
      </Form.Item>
      <p>
        ※Please only enter the name of the hub to be used in the URL and not
        the full url
      </p>
      <Button
        className={css`
          margin-top: 0px;
          margin-bottom: 5px;
        `}
        type="primary"
        onClick={() => {
          generateLink();
        }}
      >
        {"Generate Key"}
      </Button>
      <Form.Item name="invite_key" style={{ display: "none" }}>
        <Input addonBefore="Invite Key" readOnly />
      </Form.Item>
      <div style={{ display: "flex", marginBottom: "20px" }}>
        <Input
          style={{}}
          ref={inviteURLRef}
          addonBefore="Invite URL"
          readOnly
          value={inviteURL}
        />
        <div
          style={{ cursor: "pointer", paddingTop: "6px", marginLeft: "10px" }}
          onClick={() => copyInviteLink()}
        >
          <CopyOutlined />
        </div>
      </div>
      <ImgCrop
        rotate
        fillColor={"transparent"}
        aspect={5 / 3}
        minZoom={0.2}
        cropperProps={{ restrictPosition: false }}
      >
        <Upload
          onChange={async (file) => {
            setImage(file.file.originFileObj);
            setChangedImage(true);
          }}
          accept=".png,.jpg,.jpeg"
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />} className="">
            {"Upload Logo"}
          </Button>
        </Upload>
      </ImgCrop>
      {image && (
        <img
          style={{ width: "100px", marginLeft: "15px" }}
          alt=""
          src={
            changedImage
              ? image && URL.createObjectURL(image)
              : image && image.url
          }
        />
      )}

      <Form.Item>
        <Button
          className="regular-button"
          htmlType="submit"
          style={{ marginTop: "20px" }}
        >
          Submit
        </Button>
      </Form.Item>
    </Form>
  );

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name) => <span>{name}</span>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email) => <span>{email}</span>,
    },
    {
      title: "Hub URL",
      dataIndex: "url",
      key: "url",
      render: (url) => <span>{url}</span>,
    },
    {
      title: "Invite URL",
      key: "invite_url",
      render: (record) => {
        if (record.invite_key) {
          return <span>{"/" + record.url + "/" + record.invite_key}</span>;
        }
      },
    },
    {
      title: "Logo",
      dataIndex: "image",
      key: "image",
      render: (image) => {
        return (
          <div className="flex flex-center">
            <Avatar
              size={30}
              icon={<UserOutlined />}
              className="modal-profile-icon2"
              src={image ? image.url : ""}
            />
          </div>
        );
      },
    },
    {
      title: "Delete",
      dataIndex: "_id",
      key: "_id",
      render: (_id) => (
        <Popconfirm
          title={`Are you sure you want to delete this user?`}
          onConfirm={() => {
            deleteData(_id);
          }}
          onCancel={() => message.info(`No deletion has been for `)}
          okText="Yes"
          cancelText="No"
        >
          <DeleteOutlined className="delete-user-btn" />
        </Popconfirm>
      ),
      align: "center",
      width: "10%",
    },
    {
      title: "Edit",
      dataIndex: "_id",
      key: "_id",
      render: (_id) => (
        <>
          <Modal
            title="Hub"
            open={isModalVisible}
            footer={<div></div>}
            onCancel={handleCancel}
            closable={true}
            width={"600px"}
            className={_id}
            mask={false}
          >
            {" "}
            {HubForm()}
            {err ? <p className="error">{errMessage}</p> : ""}
          </Modal>
          <EditOutlined
            className="delete-user-btn"
            onClick={() => showModal(_id, false)}
          />
        </>
      ),

      align: "center",
      width: "10%",
    },
  ];
  const deleteData = async (_id) => {
    const success = await deleteAccountById(_id.$oid, ACCOUNT_TYPE.HUB);
    if (success) {
      message.success(`Successfully deleted `);
      setReload(!reload);
    } else {
      message.error(`Could not delete `);
    }
  };
  useEffect(() => {
    const getData = async () => {
      let dataa = await fetchAccounts(ACCOUNT_TYPE.HUB);
      if (dataa) {
        setData(dataa);
      } else {
        setErr(true);
      }
    };
    getData();
  }, [reload]);
  return (
    <div className="trains">
      {contextHolder}
      <div className="rolesContainer">
        <div
          className={css`
            margin-bottom: 1em;
          `}
        >
          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            onClick={() => {
              showModal("", true);
            }}
          >
            New Hub
          </Button>
        </div>
      </div>
      <div className="trainTable">
        <Table columns={columns} dataSource={data} />
      </div>
      <Modal
        title="Hub"
        open={isModalVisible2}
        footer={<div></div>}
        width={"600px"}
        onCancel={handleCancel}
      >
        {HubForm()}
        {err ? <p className="error">{errMessage}</p> : ""}
      </Modal>
    </div>
  );
};
