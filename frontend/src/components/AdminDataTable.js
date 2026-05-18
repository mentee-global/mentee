import React, { useEffect, useState } from "react";
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
  Tag,
  Tooltip,
  Alert,
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
  EFFECTIVE_STAGE_COLORS,
  EFFECTIVE_STAGE_LABELS,
  EFFECTIVE_STAGE_DESCRIPTIONS,
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
  isModerator,
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
  const [submitting, setSubmitting] = useState(false);
  // Re-render the modal preview when form values change (without going
  // through full form validation just to peek at the current state).
  const watchedEmail = Form.useWatch("email", form);
  const watchedPassword = Form.useWatch("password", form);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  async function changePausedFlag(value, data) {
    var edit_data = {
      paused_flag: value,
    };
    await editAccountProfile(edit_data, data.id, ACCOUNT_TYPE.MENTOR);
    refresh();
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
    if (submitting) return; // don't close mid-flight
    setIsEditEmailModalVisible(false);
    form.resetFields();
    setSelectedRecord(null);
    setValuesChanged(false);
  };
  const handleValuesChange = () => {
    setValuesChanged(true);
  };

  const validatePassword = (_, value) => {
    const passwordFieldValue = form.getFieldValue("password");
    if (passwordFieldValue !== value) {
      return Promise.reject(new Error("The passwords do not match"));
    }

    return Promise.resolve();
  };

  const onFinish = async () => {
    if (!selectedRecord) return;
    if (!valuesChanged) {
      setIsEditEmailModalVisible(false);
      form.resetFields();
      setSelectedRecord(null);
      return;
    }
    let values;
    try {
      values = await form.validateFields();
    } catch (info) {
      // AntD shows inline validation errors; nothing more to do here.
      console.error("Validate Failed:", info);
      return;
    }
    values.ex_email = selectedRecord.email;
    setSubmitting(true);
    try {
      const res = await editEmailPassword(values);
      if (res && res.status === 200) {
        message.success("Account updated successfully");
        setIsEditEmailModalVisible(false);
        form.resetFields();
        setSelectedRecord(null);
        setValuesChanged(false);
        refresh();
      } else {
        message.error("Failed to update email/password");
      }
    } catch (err) {
      // Surface the backend's actual error message (e.g. our 404
      // "No Firebase Auth account exists for {email}…" or the SDK's
      // "Password must be a string at least 6 characters long.")
      // instead of crashing with a TypeError on an undefined response.
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update email/password";
      message.error(serverMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const showEditEmailModal = (_data_record) => {
    if (!_data_record) return;
    form.resetFields();
    form.setFieldValue("email", _data_record.email);
    setSelectedRecord(_data_record);
    setValuesChanged(false);
    setIsEditEmailModalVisible(true);
  };

  // Dynamic "what will happen" preview shown above the submit button.
  // Mirrors the backend's behavior in editEmailPassword so the admin
  // knows exactly which notifications fire before clicking Submit.
  const renderImpactPreview = () => {
    if (!selectedRecord) return null;
    const trimmedEmail = (watchedEmail || "").trim();
    const emailWillChange =
      trimmedEmail && trimmedEmail !== selectedRecord.email;
    const passwordWillChange = !!(
      watchedPassword && watchedPassword.length > 0
    );
    if (!emailWillChange && !passwordWillChange) {
      return (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="No changes yet"
          description="Edit the email or set a new password to enable Submit."
        />
      );
    }
    const items = [];
    if (emailWillChange) {
      items.push(
        <li key="e-old">
          Notification email sent to the <strong>old address</strong> (
          {selectedRecord.email}) confirming the move.
        </li>
      );
      items.push(
        <li key="e-new">
          Notification email sent to the <strong>new address</strong> (
          {trimmedEmail}) confirming the link.
        </li>
      );
      items.push(
        <li key="e-mongo">
          Email updated across all related records (profile, applications,
          etc.).
        </li>
      );
    }
    if (passwordWillChange) {
      items.push(
        <li key="p-notif">
          Notification email sent to the user confirming the password change.
        </li>
      );
      items.push(
        <li key="p-revoke">
          All active login sessions for this user will be{" "}
          <strong>signed out</strong>.
        </li>
      );
    }
    return (
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message="When you click Submit:"
        description={
          <ul style={{ marginBottom: 0, paddingLeft: 20 }}>{items}</ul>
        }
      />
    );
  };

  return (
    <>
      <Modal
        title={
          selectedRecord
            ? `Edit account: ${selectedRecord.email}`
            : "Edit account"
        }
        open={isEditEmailModalVisible}
        footer={null}
        onCancel={handleEditClose}
        closable={!submitting}
        maskClosable={!submitting}
        keyboard={!submitting}
        destroyOnClose={true}
        width={560}
      >
        <Spin
          spinning={submitting}
          tip="Updating account and sending notifications…"
        >
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="How this works"
            description={
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>
                  Change the email, set a new password, or both. Leave password
                  blank to update only the email.
                </li>
                <li>
                  The user will be automatically notified by email — at both the
                  old and new addresses on email change, and at their current
                  address on password change.
                </li>
                <li>
                  Setting a password also signs the user out of all active
                  sessions.
                </li>
              </ul>
            }
          />
          <Form
            form={form}
            layout="vertical"
            onValuesChange={handleValuesChange}
            onFinish={onFinish}
            disabled={submitting}
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please input Email." },
                { type: "email", message: "The input is not a valid email." },
              ]}
            >
              <Input placeholder="Email" />
            </Form.Item>
            <Form.Item
              name="password"
              label="New password (optional)"
              tooltip="Leave blank to keep the current password. Min 6 characters if set."
              rules={[
                {
                  min: 6,
                  message:
                    "Password must be at least 6 characters (Firebase requirement).",
                },
              ]}
            >
              <Input.Password
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
                placeholder="Leave blank to keep current password"
                autoComplete="new-password"
              />
            </Form.Item>
            <Form.Item
              name="confirm"
              label="Confirm new password"
              dependencies={["password"]}
              rules={[{ validator: validatePassword }]}
            >
              <Input.Password
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
                placeholder="Re-type the new password"
                autoComplete="new-password"
              />
            </Form.Item>

            {renderImpactPreview()}

            <Form.Item style={{ marginBottom: 0, marginTop: 12 }}>
              <Button
                onClick={handleEditClose}
                disabled={submitting}
                style={{ marginRight: 8 }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                className="regular-button"
                htmlType="submit"
                loading={submitting}
                disabled={!valuesChanged}
              >
                {submitting ? "Saving…" : "Submit"}
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
      <Table
        dataSource={data}
        expandable={{
          expandedRowRender: (account) => (
            <JsonToTable json={getTableCompliant(account)} />
          ),
          rowExpandable: (account) => account.is_private,
        }}
        rowKey={(account) => account.id}
        pagination={{
          defaultPageSize: 20,
          pageSizeOptions: ["10", "20", "50", "100"],
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total.toLocaleString()}`,
        }}
      >
        <Column
          title="Edit"
          dataIndex={"email"}
          key="email"
          render={(text, data) => (
            <EditOutlined
              className="delete-user-btn"
              onClick={() => showEditEmailModal(data)}
            />
          )}
          align="center"
        />
        {!isPartner && (
          <>
            <Column title="Name" dataIndex="name" key="name" />
            {!isGuest && !isSupport && !isModerator && (
              <>
                <Column
                  title="Affiliated"
                  dataIndex="partner"
                  key="partner"
                  align="center"
                />
                <Column
                  title="Stage"
                  dataIndex="effective_stage"
                  key="effective_stage"
                  align="center"
                  render={(stage, record) =>
                    stage ? (
                      <Tooltip
                        title={EFFECTIVE_STAGE_DESCRIPTIONS[stage]}
                        placement="top"
                        overlayStyle={{ maxWidth: 320 }}
                      >
                        <Tag
                          color={EFFECTIVE_STAGE_COLORS[stage] || "default"}
                          style={{ cursor: "help" }}
                        >
                          {record.effective_stage_label ||
                            EFFECTIVE_STAGE_LABELS[stage] ||
                            stage}
                        </Tag>
                      </Tooltip>
                    ) : (
                      <span style={{ color: "#888" }}>—</span>
                    )
                  }
                />
                <Column
                  title="Total messages sent"
                  dataIndex="total_sent_messages"
                  key="total_sent_messages"
                  align="center"
                />
                <Column
                  title="Total messages received"
                  dataIndex="total_received_messages"
                  key="total_received_messages"
                  align="center"
                />
              </>
            )}
            {(isGuest || isSupport || isModerator) && (
              <Column
                title="Email"
                dataIndex="email"
                key="email"
                align="center"
              />
            )}
            {!isMentee && !isGuest && !isSupport && !isModerator && (
              <>
                {/* <Column
                  title="Appointments Available?"
                  dataIndex="appointmentsAvailable"
                  key="appointmentsAvailable"
                  align="center"
                  render={(text) => (text ? text : "N/A")}
                /> */}
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
                <Column
                  title="Paused"
                  dataIndex="paused_flag"
                  key="paused_flag"
                  align="center"
                  render={(text, data) => {
                    return (
                      <Switch
                        size="small"
                        checked={data.paused_flag}
                        // handleClick={handleClick}
                        onChange={(e) => changePausedFlag(e, data)}
                      />
                    );
                  }}
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
                        : isModerator
                        ? ACCOUNT_TYPE.MODERATOR
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
            {!isGuest && !isSupport && !isModerator && (
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
            {!isGuest && !isSupport && !isModerator && (
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
        {!isGuest && !isSupport && !isModerator && (
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
