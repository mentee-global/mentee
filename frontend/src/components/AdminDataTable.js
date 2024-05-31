import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Popconfirm,
  message,
  Avatar,
  Upload,
  Button,
  Spin,
  Modal,
  Switch,
  Form,
  Input,
} from "antd";
import {
  LinkOutlined,
  DeleteOutlined,
  EditFilled,
  UserOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from "@ant-design/icons";
import { JsonToTable } from "react-json-to-table";

import "./css/AdminAccountData.scss";

import { formatLinkForHref } from "utils/misc";
import {
  MENTEE_PROFILE,
  MENTOR_PROFILE,
  ACCOUNT_TYPE,
  PARTNER_PROFILE,
} from "utils/consts";
import ImgCrop from "antd-img-crop";
import {
  uploadAccountImage,
  editAccountProfile,
  fetchAccounts,
  editEmailPassword,
} from "utils/api";
import ModalInput from "./ModalInput";

const { Column } = Table;

const getTableCompliant = (account) => {
  const newAccount = JSON.parse(JSON.stringify(account));
  Object.keys(newAccount).forEach((key) => {
    if (typeof newAccount[key] === "boolean") {
      newAccount[key] = newAccount[key] ? "Yes" : "No";
    }
  });
  return newAccount;
};

function AdminDataTable({
  data,
  deleteAccount,
  isMentee,
  isPartner,
  isGuest,
  isSupport,
  refresh,
}) {
  if (isPartner && !data[0]?.id) {
    let newData = data.map((item) => {
      return {
        id: item._id.$oid,
        ...item,
      };
    });
    data = newData;
  }
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditEmailModalVisible, setIsEditEmailModalVisible] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [mentorArr, setMentorArr] = useState([]);
  const [menteeArr, setMenteeArr] = useState([]);
  const [inputClicked, setInputClicked] = useState(new Array(2).fill(false));
  const [selectedMentors, setSelectedMentors] = useState([]);
  const [selectedMentees, setSelectedMentees] = useState([]);
  const [isChanged, setIschanged] = useState(false);

  const [allMentors, setAllMentors] = useState([]);
  const [allMentees, setAllMentees] = useState([]);

  const [form] = Form.useForm();
  const [valuesChanged, setValuesChanged] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    async function getAllMentorMentee() {
      const all_mentors = await fetchAccounts(ACCOUNT_TYPE.MENTOR);
      setAllMentors(all_mentors);
      const all_mentees = await fetchAccounts(ACCOUNT_TYPE.MENTEE);
      setAllMentees(all_mentees);
    }
    if (isPartner) {
      getAllMentorMentee();
    }
  }, [isPartner]);
  useEffect(() => {
    if (
      data &&
      (data.length !== accounts.length ||
        (data.length > 0 && data[0].id !== accounts[0].id))
    ) {
      setAccounts(
        data.map((d) => {
          return { id: d.id, image: d.image ? d.image : null };
        })
      );
    }
  }, [data]);

  useEffect(() => {
    if (selectedPartner !== null) {
      var temp = [];
      var assign_mentors = [];
      var assign_mentees = [];
      data.map((item) => {
        if (item.assign_mentors && item.assign_mentors.length > 0) {
          assign_mentors = [...assign_mentors, ...item.assign_mentors];
        }
        if (item.assign_mentees && item.assign_mentees.length > 0) {
          assign_mentees = [...assign_mentees, ...item.assign_mentees];
        }
        return false;
      });
      if (selectedPartner.assign_mentors) {
        assign_mentors = [...assign_mentors, ...selectedPartner.assign_mentors];
      }
      if (selectedPartner.assign_mentees) {
        assign_mentees = [...assign_mentees, ...selectedPartner.assign_mentees];
      }
      allMentors.map((item) => {
        var record = assign_mentors.find((x) => x.id === item._id["$oid"]);
        if (record === null || record === undefined) {
          temp.push({ id: item._id["$oid"], name: item.name });
        }
        return false;
      });
      setMentorArr(temp);
      temp = [];
      allMentees.map((item) => {
        var record = assign_mentees.find((x) => x.id === item._id["$oid"]);
        if (record === null || record === undefined) {
          temp.push({ id: item._id["$oid"], name: item.name });
        }
        return false;
      });
      setMenteeArr(temp);
    }
  }, [selectedPartner, allMentors, allMentees, isChanged]);

  const showModal = (item) => {
    setSelectedPartner(item);
    setSelectedMentors([]);
    setSelectedMentees([]);
    setIsModalVisible(true);
  };
  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedMentors([]);
    setSelectedMentees([]);
  };
  function handleClick(index) {
    // Sets only the clicked input box to true to change color, else false
    let newClickedInput = new Array(2).fill(false);
    newClickedInput[index] = true;
    setInputClicked(newClickedInput);
  }
  function handleUsers(e, type = "mentor") {
    let tmp = [];
    e.forEach((value) => {
      tmp.push(value);
    });
    if (type === "mentor") {
      setSelectedMentors(tmp);
    }
    if (type === "mentee") {
      setSelectedMentees(tmp);
    }
  }
  function deleteUser(item, type = "mentor") {
    var selected_partner = selectedPartner;
    if (type === "mentor") {
      var new_assign_mentors = [];
      if (
        selected_partner.assign_mentors &&
        selected_partner.assign_mentors.length > 0
      ) {
        selected_partner.assign_mentors.map((mentor) => {
          if (item.id !== mentor.id) {
            new_assign_mentors.push(mentor);
          }
          return false;
        });
      }
      selected_partner.assign_mentors = new_assign_mentors;
      setSelectedPartner(selected_partner);
    }
    if (type === "mentee") {
      var new_assign_mentees = [];
      if (
        selected_partner.assign_mentees &&
        selected_partner.assign_mentees.length > 0
      ) {
        selected_partner.assign_mentees.map((mentee) => {
          if (item.id !== mentee.id) {
            new_assign_mentees.push(mentee);
          }
          return false;
        });
      }
      selected_partner.assign_mentees = new_assign_mentees;
      setSelectedPartner(selected_partner);
    }
    setIschanged(!isChanged);
  }
  function addUsers(type = "mentor") {
    var selected_partner = selectedPartner;
    if (type === "mentor") {
      if (selectedMentors.length === 0) return;
      if (!selected_partner.assign_mentors) {
        selected_partner.assign_mentors = [];
      }
      selectedMentors.map((mentor_id) => {
        var mentor_record = allMentors.find((x) => x._id.$oid === mentor_id);
        if (mentor_record !== null && mentor_record !== undefined) {
          selected_partner.assign_mentors.push({
            id: mentor_id,
            name: mentor_record.name,
          });
        }
        return false;
      });
      setSelectedPartner(selected_partner);
      setSelectedMentors([]);
      setIschanged(!isChanged);
    }
    if (type === "mentee") {
      if (selectedMentees.length === 0) return;
      if (!selected_partner.assign_mentees) {
        selected_partner.assign_mentees = [];
      }
      selectedMentees.map((mentee_id) => {
        var mentee_record = allMentees.find((x) => x._id.$oid === mentee_id);
        if (mentee_record !== null && mentee_record !== undefined) {
          selected_partner.assign_mentees.push({
            id: mentee_id,
            name: mentee_record.name,
          });
        }
        return false;
      });
      setSelectedPartner(selected_partner);
      setSelectedMentees([]);
      setIschanged(!isChanged);
    }
  }
  function handleRestricted(value) {
    var selected_partner = selectedPartner;
    selected_partner.restricted = value;
    setSelectedPartner(selected_partner);
    setIschanged(!isChanged);
  }
  async function saveData() {
    var edited_data = {
      restricted: selectedPartner.restricted,
      assign_mentors: selectedPartner.assign_mentors,
      assign_mentees: selectedPartner.assign_mentees,
    };
    await editAccountProfile(
      edited_data,
      selectedPartner.id,
      ACCOUNT_TYPE.PARTNER
    );
    refresh();
  }
  const AssignUsers = () => {
    return (
      selectedPartner && (
        <div className="assign-user-modal">
          <div className="assign-header-modal">
            <div className="name-area">
              <Avatar
                size={80}
                src={selectedPartner.image && selectedPartner.image.url}
                icon={<UserOutlined />}
              />
              <div className="org-area">{selectedPartner.organization}</div>
            </div>
            <div className="restricted-area">
              <label>Restricted</label>
              <Switch
                size="small"
                checked={selectedPartner.restricted}
                handleClick={handleClick}
                onChange={(e) => handleRestricted(e)}
              />
            </div>
          </div>
          <div className="main-body">
            <div className="mentors-area w-50">
              <div className="sub-title">Add Mentors</div>
              <div className="flex">
                <ModalInput
                  type="dropdown-multiple-object"
                  title=""
                  clicked={inputClicked[0]}
                  index={0}
                  handleClick={handleClick}
                  onChange={(e) => handleUsers(e, "mentor")}
                  placeholder="Please select Mentors"
                  options={mentorArr}
                  value={selectedMentors}
                  valid={true}
                  style={{ width: "calc(100% - 120px)" }}
                />
                <Button
                  disabled={selectedMentors.length > 0 ? false : true}
                  onClick={() => addUsers("mentor")}
                  className="add-btn"
                >
                  + Add Account
                </Button>
              </div>
              <div className="list">
                {selectedPartner.assign_mentors &&
                  selectedPartner.assign_mentors.map((item, index) => {
                    return (
                      <div
                        className={
                          "record " + (index % 2 === 0 ? "even" : "odd")
                        }
                      >
                        <div>{item.name}</div>
                        <div
                          style={{ cursor: "pointer" }}
                          onClick={() => deleteUser(item, "mentor")}
                        >
                          <DeleteOutlined className="delete-user-btn" />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
            <div className="mentees-area w-50">
              <div className="sub-title">Add Mentees</div>
              <div className="flex">
                <ModalInput
                  type="dropdown-multiple-object"
                  title=""
                  clicked={inputClicked[1]}
                  index={1}
                  handleClick={handleClick}
                  onChange={(e) => handleUsers(e, "mentee")}
                  placeholder="Please select Mentees"
                  options={menteeArr}
                  value={selectedMentees}
                  valid={true}
                  style={{ width: "calc(100% - 120px)" }}
                />
                <Button
                  disabled={selectedMentees.length > 0 ? false : true}
                  onClick={() => addUsers("mentee")}
                  className="add-btn"
                >
                  + Add Account
                </Button>
              </div>
              <div className="list">
                {selectedPartner.assign_mentees &&
                  selectedPartner.assign_mentees.map((item, index) => {
                    return (
                      <div
                        className={
                          "record " + (index % 2 === 0 ? "even" : "odd")
                        }
                      >
                        <div>{item.name}</div>
                        <div
                          style={{ cursor: "pointer" }}
                          onClick={() => deleteUser(item, "mentee")}
                        >
                          <DeleteOutlined className="delete-user-btn" />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )
    );
  };

  const handleEditClose = () => {
    setIsEditEmailModalVisible(false);
    form.resetFields();
    setSelectedRecord(null);
  };
  const handleValuesChange = () => {
    setValuesChanged(true);
  };

  const validatePassword = (_, value) => {
    const passwordFieldValue = form.getFieldValue("password");
    if (passwordFieldValue != value) {
      return Promise.reject(new Error("The passwords do not match"));
    }

    return Promise.resolve();
  };

  const success = () => {
    message.success("Successfully Edited");
    handleEditClose();
  };

  const onFinish = useCallback((valuesChanged, _selected_record) => {
    async function saveValues(values, _selected_record) {
      values.ex_email = _selected_record.email;
      await editEmailPassword(values).then((res) => {
        if (res.status === 200) {
          refresh();
          success();
        } else {
          if (res.response && res.response.status === 422) {
            alert("Failed create firebase account");
          } else {
            alert("Already registered Email: " + values.email);
          }
        }
      });
    }
    if (valuesChanged) {
      form
        .validateFields()
        .then((values) => {
          saveValues(values, _selected_record);
        })
        .catch((info) => {
          console.error("Validate Failed:", info);
        });
    } else {
      handleEditClose();
    }
  }, []);

  const EditEmailForm = () => (
    <Form
      form={form}
      onValuesChange={handleValuesChange}
      onFinish={() => onFinish(valuesChanged, selectedRecord)}
    >
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
        <Input bordered={true} placeholder={"Email"} />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[
          {
            required: false,
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
        />
      </Form.Item>
      <Form.Item
        name="confirm"
        rules={[
          {
            required: false,
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
        />
      </Form.Item>

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

  const showEditEmailModal = async (_data_record) => {
    setIsEditEmailModalVisible(true);
    if (_data_record) {
      form.setFieldValue("email", _data_record.email);
      setSelectedRecord(_data_record);
    }
  };

  return (
    <>
      <Table
        dataSource={data}
        expandable={{
          expandedRowRender: (account) => (
            <JsonToTable json={getTableCompliant(account)} />
          ),
          rowExpandable: (account) => account.is_private,
        }}
        rowKey={(account) => account.id}
      >
        <Column
          title="Edit"
          dataIndex={"email"}
          key="email"
          render={(text, data) => (
            <>
              <Modal
                title="Edit"
                open={isEditEmailModalVisible}
                footer={<div></div>}
                onCancel={handleEditClose}
                closable={true}
                width={"600px"}
                mask={false}
              >
                {" "}
                {EditEmailForm()}
              </Modal>
              <EditOutlined
                className="delete-user-btn"
                onClick={() => showEditEmailModal(data)}
              />
            </>
          )}
          align="center"
        />
        {!isPartner && (
          <>
            <Column title="Name" dataIndex="name" key="name" />
            {!isGuest && !isSupport && (
              <Column
                title="No. of Appointments"
                dataIndex="numOfAppointments"
                key="numOfAppointments"
                align="center"
              />
            )}
            {(isGuest || isSupport) && (
              <Column
                title="Email"
                dataIndex="email"
                key="email"
                align="center"
              />
            )}
            {!isMentee && !isGuest && !isSupport && (
              <>
                <Column
                  title="Appointments Available?"
                  dataIndex="appointmentsAvailable"
                  key="appointmentsAvailable"
                  align="center"
                  render={(text) => (text ? text : "N/A")}
                />
                <Column
                  title="Videos Posted?"
                  dataIndex="videosUp"
                  key="videosUp"
                  align="center"
                  render={(text) => (text ? text : "N/A")}
                />
                <Column
                  title="Picture Uploaded?"
                  dataIndex="profilePicUp"
                  key="profilePicUp"
                  align="center"
                  render={(text) => (text ? text : "N/A")}
                />
              </>
            )}

            <Column
              title="Delete"
              dataIndex={["id", "name"]}
              key="id"
              render={(text, data) => (
                <Popconfirm
                  title={`Are you sure you want to delete ${data.name}?`}
                  onConfirm={() => {
                    deleteAccount(
                      data.id ? data.id : data._id.$oid,
                      isGuest
                        ? ACCOUNT_TYPE.GUEST
                        : isSupport
                        ? ACCOUNT_TYPE.SUPPORT
                        : data.isMentee
                        ? ACCOUNT_TYPE.MENTEE
                        : ACCOUNT_TYPE.MENTOR,
                      data.name
                    );
                  }}
                  onCancel={() =>
                    message.info(`No deletion has been for ${data.name}`)
                  }
                  okText="Yes"
                  cancelText="No"
                >
                  <DeleteOutlined className="delete-user-btn" />
                </Popconfirm>
              )}
              align="center"
            />
            {!isGuest && !isSupport && (
              <Column
                title="Link to Profile"
                dataIndex="id"
                key="id"
                render={(id, data) => {
                  let profileURL = data.isMentee
                    ? `${MENTEE_PROFILE}${id}`
                    : `${MENTOR_PROFILE}${id}`;

                  return (
                    !data.is_private && (
                      <a
                        style={{ color: "black" }}
                        href={formatLinkForHref(profileURL)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <LinkOutlined /> {profileURL}
                      </a>
                    )
                  );
                }}
                align="center"
              />
            )}
          </>
        )}
        {isPartner && (
          <>
            <Column
              title="Email"
              dataIndex="email"
              key="email"
              align="center"
            />
            <Column
              title="Mentors"
              dataIndex="mentor_nums"
              key="mentor_nums"
              align="center"
              render={(mentor_nums, item) => {
                return (
                  <span onClick={() => showModal(item)} className="link-span">
                    {mentor_nums}
                  </span>
                );
              }}
            />
            <Column
              title="Mentees"
              dataIndex="mentee_nums"
              key="mentee_nums"
              align="center"
              render={(mentee_nums, item) => {
                return (
                  <span onClick={() => showModal(item)} className="link-span">
                    {mentee_nums}
                  </span>
                );
              }}
            />
            <Column
              title="Restricted"
              dataIndex="restricted_show"
              key="restricted_show"
              align="center"
              render={(restricted_show, item) => {
                return (
                  <span onClick={() => showModal(item)} className="link-span">
                    {restricted_show}
                  </span>
                );
              }}
            />
            <Column
              title="Organization Name"
              dataIndex="organization"
              key="organization"
              align="center"
            />
            <Column
              title="Contact Person's Full Name"
              dataIndex="person_name"
              key="person_name"
              align="center"
            />
            <Column
              title="Website"
              className="link-td"
              dataIndex="website"
              key="website"
              align="center"
              render={(website) => {
                return (
                  website && (
                    <a
                      style={{ color: "black" }}
                      href={formatLinkForHref(website)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <LinkOutlined /> {website}
                    </a>
                  )
                );
              }}
            />
            <Column
              title="Hub"
              className="link-td"
              dataIndex="hub_user"
              key="hub_user"
              align="center"
              render={(hub_user) => {
                return hub_user && hub_user.name;
              }}
            />

            <Column
              title="Delete"
              dataIndex={["id", "organization"]}
              key="id"
              render={(text, data) => (
                <Popconfirm
                  title={`Are you sure you want to delete ${data.organization}?`}
                  onConfirm={() => {
                    deleteAccount(
                      data.id ? data.id : data._id.$oid,
                      ACCOUNT_TYPE.PARTNER,
                      data.organization
                    );
                  }}
                  onCancel={() =>
                    message.info(
                      `No deletion has been for ${data.organization}`
                    )
                  }
                  okText="Yes"
                  cancelText="No"
                >
                  <DeleteOutlined className="delete-user-btn" />
                </Popconfirm>
              )}
              align="center"
            />
            {!isGuest && !isSupport && (
              <Column
                title="Link to Profile"
                className="link-td"
                dataIndex="id"
                key="id"
                render={(id, data) => {
                  let profileURL = `${PARTNER_PROFILE}${id}`;

                  return (
                    !data.is_private && (
                      <a
                        style={{ color: "black" }}
                        href={formatLinkForHref(profileURL)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <LinkOutlined /> {profileURL}
                      </a>
                    )
                  );
                }}
                align="center"
              />
            )}
          </>
        )}
        {!isGuest && !isSupport && (
          <Column
            title="Profile Picture"
            dataIndex="id"
            key="profile-picture"
            render={(id, data) => {
              return (
                <div className="flex flex-center">
                  {loading ? (
                    <Avatar
                      size={30}
                      icon={<Spin />}
                      className="modal-profile-icon2"
                    />
                  ) : (
                    <Avatar
                      size={30}
                      icon={<UserOutlined />}
                      className="modal-profile-icon2"
                      src={accounts.find((acc) => acc.id === id)?.image?.url}
                    />
                  )}

                  <ImgCrop rotate aspect={5 / 3} minZoom={0.2}>
                    <Upload
                      onChange={async (file) => {
                        setLoading(true);
                        if (isPartner) {
                          await uploadAccountImage(
                            file.file.originFileObj,
                            id,
                            ACCOUNT_TYPE.PARTNER
                          );
                        }
                        if (data.favorite_mentors_ids) {
                          await uploadAccountImage(
                            file.file.originFileObj,
                            id,
                            ACCOUNT_TYPE.MENTEE
                          );
                        } else {
                          await uploadAccountImage(
                            file.file.originFileObj,
                            id,
                            ACCOUNT_TYPE.MENTOR
                          );
                        }

                        setAccounts((prev) => {
                          let newAccounts = [...prev];
                          let index = accounts.findIndex((a) => a.id === id);
                          newAccounts[index] = {
                            id: id,
                            image: {
                              url: URL.createObjectURL(file.file.originFileObj),
                            },
                          };
                          return newAccounts;
                        });

                        setLoading(false);
                      }}
                      accept=".png,.jpg,.jpeg"
                      showUploadList={false}
                    >
                      <Button
                        shape="circle"
                        icon={<EditFilled />}
                        className=""
                      />
                    </Upload>
                  </ImgCrop>
                </div>
              );
            }}
            align="center"
          />
        )}
      </Table>
      <Modal
        title="Assign Users"
        open={isModalVisible}
        // onOk={() => handleOk(false)}
        onCancel={handleCancel}
        okText={
          <Popconfirm
            title={`Are you sure you want to save?`}
            onConfirm={() => {
              setIsModalVisible(false);
              saveData();
            }}
            onCancel={() => {}}
            okText="Yes"
            cancelText="No"
          >
            save
          </Popconfirm>
        }
        closable={false}
        width={"1000px"}
        okButtonProps={{ disabled: loading ? true : false }}
      >
        {" "}
        {AssignUsers()}
      </Modal>
    </>
  );
}

export default AdminDataTable;
