import React, { useEffect, useState } from "react";
import { Table, Popconfirm, message, Avatar, Upload, Button, Spin } from "antd";
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
import { uploadAccountImage } from "utils/api";

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

function AdminDataTable({ data, deleteAccount, isMentee, isPartner, mentors }) {
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
  useEffect(() => {
    if (data && data.length != accounts.length) {
      setAccounts(
        data.map((d) => {
          return { id: d.id, image: d.image ? d.image : null };
        })
      );
    }
  }, [data]);
  useEffect(() => {
    if (mentors && mentors.length != mentorAccounts.length) {
      setMentorAccounts(
        mentors.map((d) => {
          return { id: d._id.$oid, image: d.image ? d.image : null };
        })
      );
    }
  }, [mentors]);
  return (
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
          <Column title="Email" dataIndex="email" key="email" align="center" />
          <Column
            title="Organization Name"
            dataIndex="organization"
            key="organization"
            align="center"
          />

          <Column
            title="Headquarters Location"
            dataIndex="location"
            key="location"
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
            dataIndex="website"
            key="website"
            align="center"
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
                  message.info(`No deletion has been for ${data.organization}`)
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
                      ? mentorAccounts.find((m) => m.id == id)?.image?.url
                      : accounts.find((acc) => acc.id == id)?.image?.url
                  }
                />
              )}

              <ImgCrop rotate aspect={5 / 3}>
                <Upload
                  onChange={async (file) => {
                    console.log(
                      mentors[0]._id.$oid,
                      mentors[0]._id.$oid == id,
                      id,
                      mentors[0].image.url,
                      mentors.find((m) => m._id.$oid == id)?.image?.url
                    );
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
  );
}

export default AdminDataTable;
