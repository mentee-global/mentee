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
} from "antd";
import {
  LinkOutlined,
  DeleteOutlined,
  EditFilled,
  UserOutlined,
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
import { uploadAccountImage, editAccountProfile } from "utils/api";
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
  mentors,
  mentees,
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
  const [mentorAccounts, setMentorAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [mentorArr, setMentorArr] = useState([]);
  const [menteeArr, setMenteeArr] = useState([]);
  const [inputClicked, setInputClicked] = useState(new Array(2).fill(false));
  const [selectedMentors, setSelectedMentors] = useState([]);
  const [selectedMentees, setSelectedMentees] = useState([]);
  const [isChanged, setIschanged] = useState(false);

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
    if (
      mentors &&
      (mentors.length !== mentorAccounts.length ||
        (mentors.length > 0 && mentors[0].id !== mentorAccounts[0].id))
    ) {
      setMentorAccounts(
        mentors.map((d) => {
          return { id: d._id.$oid, image: d.image ? d.image : null };
        })
      );
    }
  }, [mentors]);

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
      mentors.map((item) => {
        var record = assign_mentors.find((x) => x.id === item._id["$oid"]);
        if (record === null || record === undefined) {
          temp.push({ id: item._id["$oid"], name: item.name });
        }
        return false;
      });
      setMentorArr(temp);
      temp = [];
      mentees.map((item) => {
        var record = assign_mentees.find((x) => x.id === item.id);
        if (record === null || record === undefined) {
          temp.push({ id: item.id, name: item.name });
        }
        return false;
      });
      setMenteeArr(temp);
    }
  }, [selectedPartner, mentors, mentees, isChanged]);

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
        var mentor_record = mentors.find((x) => x._id.$oid === mentor_id);
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
        var mentee_record = mentees.find((x) => x.id === mentee_id);
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
        {!isPartner && (
          <>
            <Column title="Name" dataIndex="name" key="name" />
            <Column
              title="No. of Appointments"
              dataIndex="numOfAppointments"
              key="numOfAppointments"
              align="center"
            />
            {!isMentee && (
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
                      data.id,
                      data.isMentee ? ACCOUNT_TYPE.MENTEE : ACCOUNT_TYPE.MENTOR,
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
            {/* <Column
            title="Headquarters Location"
            dataIndex="location"
            key="location"
            align="center"
          /> */}
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
              title="Delete"
              dataIndex={["id", "organization"]}
              key="id"
              render={(text, data) => (
                <Popconfirm
                  title={`Are you sure you want to delete ${data.organization}?`}
                  onConfirm={() => {
                    deleteAccount(
                      data.id,
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
          </>
        )}
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
                    src={
                      data.profilePicUp
                        ? mentorAccounts.find((m) => m.id === id)?.image?.url
                        : accounts.find((acc) => acc.id === id)?.image?.url
                    }
                  />
                )}

                <ImgCrop rotate aspect={5 / 3}>
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
                      if (data.profilePicUp) {
                        setMentorAccounts((prev) => {
                          let newAccounts = [...prev];
                          let index = accounts.findIndex((a) => a.id == id);
                          newAccounts[index] = {
                            id: id,
                            image: {
                              url: URL.createObjectURL(file.file.originFileObj),
                            },
                          };
                          return newAccounts;
                        });
                      } else {
                        setAccounts((prev) => {
                          let newAccounts = [...prev];
                          let index = accounts.findIndex((a) => a.id == id);
                          newAccounts[index] = {
                            id: id,
                            image: {
                              url: URL.createObjectURL(file.file.originFileObj),
                            },
                          };
                          return newAccounts;
                        });
                      }

                      setLoading(false);
                    }}
                    accept=".png,.jpg,.jpeg"
                    showUploadList={false}
                  >
                    <Button shape="circle" icon={<EditFilled />} className="" />
                  </Upload>
                </ImgCrop>
              </div>
            );
          }}
          align="center"
        />
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
