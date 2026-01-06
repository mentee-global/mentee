import React, { useEffect, useState } from "react";
import {
  fetchAccounts,
  fetchAccountById,
  downloadPartnerMentorsData,
  downloadPartnerMenteesData,
} from "utils/api";
import Meta from "antd/lib/card/Meta";
import {
  Table,
  Input,
  Dropdown,
  message,
  Avatar,
  Layout,
  Spin,
  Divider,
  Card,
  theme,
  Switch,
  Modal,
  Radio,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Tooltip,
  Space,
  Segmented,
  Badge,
} from "antd";
import {
  UserOutlined,
  SearchOutlined,
  DownOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  FileExcelOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { HubsDropdown } from "../components/AdminDropdowns";

import "./css/Training.scss";
import { ACCOUNT_TYPE } from "utils/consts";
import { css } from "@emotion/css";

export const AdminPartnerData = () => {
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const [data, setData] = useState([]);
  const [filterData, setfilterData] = useState([]);
  const [hubOptions, setHubOptions] = useState([]);
  const [resetFilters, setResetFilters] = useState(false);
  const [searchHubUserId, setSearchHubUserId] = useState(null);

  const [messageApi, contextHolder] = message.useMessage();
  const { Sider } = Layout;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPartner, setSelectedPartner] = useState(null);
  const {
    token: {
      colorPrimaryBg,
      colorPrimaryBorder,
      colorBorderSecondary,
      colorPrimary,
    },
  } = theme.useToken();

  const activeCardStyle = css`
    background: ${colorPrimaryBg};
    border: 1px solid ${colorPrimaryBorder};

    :hover {
      background: ${colorPrimaryBg};
    }
  `;

  const options = {
    MENTORS: {
      key: ACCOUNT_TYPE.MENTOR,
      text: "Mentors",
    },
    MENTEES: {
      key: ACCOUNT_TYPE.MENTEE,
      text: "Mentees",
    },
  };

  const { Title } = Typography;

  const [option, setOption] = useState(options.MENTEES);
  const [selectActived, setSelectActived] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [sortOrder, setSortOrder] = useState("newest");
  const [modalMessageFilter, setModalMessageFilter] = useState("all");
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedReceiver, setSelectedReceiver] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [searchWord, setSearchWord] = useState(null);

  const getFilteredModalMessages = () => {
    if (!modalData || !Array.isArray(modalData)) return [];

    return modalData.filter((message) => {
      const matchSearchWord =
        !searchWord ||
        message.body.toUpperCase().includes(searchWord.toUpperCase());
      let matchGroup = true;
      if (modalMessageFilter !== "all") {
        const messageSenderId = message.sender_id?.$oid || message.sender_id;
        if (modalMessageFilter === "from_mentors") {
          if (option.text === "Mentors") {
            matchGroup = messageSenderId === selectedRow.id.$oid;
          } else {
            matchGroup = messageSenderId === selectedReceiver.id.$oid;
          }
        } else {
          if (option.text === "Mentors") {
            matchGroup = messageSenderId === selectedReceiver.id.$oid;
          } else {
            matchGroup = messageSenderId === selectedRow.id.$oid;
          }
        }
      }
      return matchSearchWord && matchGroup;
    });
  };

  const showDetailModal = (receiver_data, record) => {
    setShowModal(true);
    setSelectedRow(record);
    setSelectedReceiver(receiver_data);
    setSortOrder("newest"); // Reset sort order to newest when opening modal
    setModalMessageFilter("all"); // Reset message filter to show all messages
    const sortedMessages = Array.isArray(receiver_data.message_data)
      ? [...receiver_data.message_data].sort((a, b) => {
          const dateA = a?.created_at?.$date
            ? new Date(a.created_at.$date)
            : new Date(0);
          const dateB = b?.created_at?.$date
            ? new Date(b.created_at.$date)
            : new Date(0);
          return dateB - dateA; // Descending order (newest first)
        })
      : [];

    setModalData(sortedMessages || []);
  };

  // Collapsible message list component for the table
  const MessageListCell = ({ message_receive_data, record }) => {
    const [expanded, setExpanded] = useState(false);
    const activeMessages = message_receive_data?.filter(
      (item) => item.numberOfMessages > 0
    );

    if (!activeMessages || activeMessages.length === 0) {
      return (
        <Typography.Text type="secondary" italic>
          No messages
        </Typography.Text>
      );
    }

    const displayCount = expanded ? activeMessages.length : 3;
    const visibleItems = activeMessages.slice(0, displayCount);
    const remainingCount = activeMessages.length - 3;

    return (
      <div
        className={css`
          max-height: ${expanded ? "300px" : "140px"};
          overflow-y: auto;
          padding-right: 4px;

          &::-webkit-scrollbar {
            width: 4px;
          }
          &::-webkit-scrollbar-thumb {
            background-color: ${colorPrimaryBorder};
            border-radius: 4px;
          }
        `}
      >
        {visibleItems.map((item, index) => (
          <div
            key={index}
            className={css`
              display: flex;
              align-items: center;
              padding: 6px 8px;
              margin-bottom: 4px;
              background: ${colorPrimaryBg};
              border-radius: 6px;
              cursor: pointer;
              transition: all 0.2s ease;

              &:hover {
                background: ${colorPrimaryBorder};
              }
            `}
            onClick={() => showDetailModal(item, record)}
          >
            <Avatar
              size={24}
              icon={<UserOutlined />}
              src={item.image ? item.image.url : ""}
              className={css`
                flex-shrink: 0;
              `}
            />
            <div
              className={css`
                margin-left: 8px;
                flex: 1;
                min-width: 0;
              `}
            >
              <Typography.Text
                ellipsis
                className={css`
                  display: block;
                  font-size: 13px;
                `}
              >
                {item.receiver_name}
              </Typography.Text>
            </div>
            <Badge
              count={item.numberOfMessages}
              style={{
                backgroundColor: colorPrimary,
                fontSize: "11px",
              }}
            />
          </div>
        ))}

        {activeMessages.length > 3 && (
          <Button
            type="link"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className={css`
              padding: 4px 0;
              height: auto;
            `}
          >
            {expanded
              ? "Show less"
              : `Show ${remainingCount} more conversation${
                  remainingCount > 1 ? "s" : ""
                }`}
          </Button>
        )}
      </div>
    );
  };

  const columns = [
    {
      title: "Logo",
      dataIndex: "image",
      key: "image",
      width: 60,
      render: (image) => {
        return (
          <div className="flex flex-center">
            <Avatar
              size={36}
              icon={<UserOutlined />}
              className="modal-profile-icon2"
              src={image ? image.url : ""}
            />
          </div>
        );
      },
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "organization",
      width: 180,
      render: (organization) => (
        <Typography.Text strong>{organization}</Typography.Text>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 220,
      render: (email) => (
        <Typography.Text copyable={{ text: email }}>{email}</Typography.Text>
      ),
    },
    {
      title: (
        <Space>
          <MessageOutlined />
          {option.key === ACCOUNT_TYPE.MENTEE
            ? "Conversations with Mentors"
            : "Conversations with Mentees"}
        </Space>
      ),
      dataIndex: "message_receive_data",
      key: "message_receive_data",
      render: (message_receive_data, record) => (
        <MessageListCell
          message_receive_data={message_receive_data}
          record={record}
        />
      ),
    },
  ];
  useEffect(() => {
    const getData = async () => {
      setLoading(true);
      let dataa = await fetchAccounts(ACCOUNT_TYPE.PARTNER);
      const hub_data = await fetchAccounts(ACCOUNT_TYPE.HUB);
      if (dataa) {
        setData(dataa);
        setfilterData(dataa.filter((x) => !x.hub_id));
      }
      var temp = [];
      hub_data.map((hub_item) => {
        temp.push({ label: hub_item.name, value: hub_item._id.$oid });
        return true;
      });
      setHubOptions(temp);
      setLoading(false);
    };
    getData();
  }, []);

  useEffect(() => {
    if (selectedPartner) {
      if (option.key === ACCOUNT_TYPE.MENTEE) {
        if (selectedPartner.assign_mentees) {
          if (selectActived) {
            let temp = [];
            selectedPartner.assign_mentees.map((item) => {
              if (
                item.message_receive_data &&
                item.message_receive_data.length > 0
              ) {
                if (
                  item.message_receive_data.filter(
                    (x) => x.numberOfMessages > 0
                  ).length > 0
                ) {
                  temp.push(item);
                }
              }
            });
            setTableData(temp);
          } else {
            setTableData(selectedPartner.assign_mentees);
          }
        }
      } else {
        if (selectedPartner.assign_mentors) {
          if (selectActived) {
            let temp = [];
            selectedPartner.assign_mentors.map((item) => {
              if (
                item.message_receive_data &&
                item.message_receive_data.length > 0
              ) {
                if (
                  item.message_receive_data.filter(
                    (x) => x.numberOfMessages > 0
                  ).length > 0
                ) {
                  temp.push(item);
                }
              }
            });
            setTableData(temp);
          } else {
            setTableData(selectedPartner.assign_mentors);
          }
        }
      }
    }
  }, [option, selectActived]);

  const handleSearchMessages = (search_word) => {
    setSearchWord(search_word);
  };

  const selectParnter = async (partner) => {
    setSubLoading(true);
    let partner_data = await fetchAccountById(
      partner._id.$oid,
      ACCOUNT_TYPE.PARTNER
    );
    if (partner_data) {
      setSelectedPartner(partner_data);
      if (option.key === ACCOUNT_TYPE.MENTEE) {
        if (partner_data.assign_mentees) {
          if (selectActived) {
            let temp = [];
            partner_data.assign_mentees.map((item) => {
              if (
                item.message_receive_data &&
                item.message_receive_data.length > 0
              ) {
                if (
                  item.message_receive_data.filter(
                    (x) => x.numberOfMessages > 0
                  ).length > 0
                ) {
                  temp.push(item);
                }
              }
            });
            setTableData(temp);
          } else {
            setTableData(partner_data.assign_mentees);
          }
        }
      } else {
        if (partner_data.assign_mentors) {
          if (selectActived) {
            let temp = [];
            partner_data.assign_mentors.map((item) => {
              if (
                item.message_receive_data &&
                item.message_receive_data.length > 0
              ) {
                if (
                  item.message_receive_data.filter(
                    (x) => x.numberOfMessages > 0
                  ).length > 0
                ) {
                  temp.push(item);
                }
              }
            });
            setTableData(temp);
          } else {
            setTableData(partner_data.assign_mentors);
          }
        }
      }
    }
    setSubLoading(false);
  };

  const searchbyHub = (key) => {
    setSearchHubUserId(key);
  };

  const handleResetFilters = () => {
    setResetFilters(!resetFilters);
    setSearchHubUserId(null);
  };

  useEffect(() => {
    setfilterData(
      data.filter((x) => {
        let matchHub = false;
        if (searchHubUserId) {
          matchHub = x.hub_id == searchHubUserId;
        } else {
          matchHub = !x.hub_id;
        }

        let mathcQuery = false;
        if (searchQuery) {
          mathcQuery =
            x.organization &&
            x.organization.toUpperCase().includes(searchQuery.toUpperCase());
        } else {
          mathcQuery = true;
        }
        return matchHub && mathcQuery;
      })
    );
  }, [searchHubUserId, searchQuery, data]);

  return (
    <div className="">
      {contextHolder}
      <div className="trainTable" style={{ display: "flex" }}>
        <Sider
          style={{ background: "white" }}
          width={400}
          className="messages-sidebar-background"
        >
          <Spin
            wrapperClassName={css`
              width: 100%;
            `}
            spinning={loading}
          >
            <div className="messages-sidebar-header">
              <h1>{"Partners"}</h1>
            </div>
            <div
              className={css`
                padding: 0 20px;
                margin-bottom: 10px;
              `}
            >
              <Input
                placeholder={"search"}
                prefix={<SearchOutlined />}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                padding: "0 20px",
                marginBottom: "10px",
              }}
            >
              <div style={{ lineHeight: "30px" }}>Filter Hub</div>
              <HubsDropdown
                className="table-button hub-drop-down"
                options={hubOptions}
                onChange={(key) => searchbyHub(key)}
                onReset={resetFilters}
              />
              <Button
                style={{ marginLeft: "10px" }}
                onClick={() => handleResetFilters()}
              >
                Clear Filters
              </Button>
            </div>
            <Divider className="header-divider" orientation="left"></Divider>
            <div className="messages-sidebar" style={{ paddingTop: "1em" }}>
              {filterData &&
                filterData.length > 0 &&
                filterData.map((partner) => {
                  return (
                    <Card
                      onClick={() => {
                        selectParnter(partner);
                      }}
                      className={css`
                        width: 100%;
                        margin-bottom: 3%;
                        border: 1px solid "#e8e8e8";
                        box-sizing: border-box;
                        border-radius: 7px;

                        :hover {
                          background-color: ${colorBorderSecondary};
                          border-color: ${colorPrimaryBorder};
                          cursor: pointer;
                          transition: all 0.3s
                            cubic-bezier(0.645, 0.045, 0.355, 1);
                        }

                        ${selectedPartner &&
                        selectedPartner._id.$oid == partner._id.$oid &&
                        activeCardStyle}
                      `}
                    >
                      <div
                        className={
                          selectedPartner &&
                          selectedPartner._id.$oid == partner._id.$oid &&
                          css`
                            div {
                              color: ${colorPrimary} !important;
                            }
                          `
                        }
                      >
                        <Meta
                          avatar={
                            <Avatar
                              icon={<UserOutlined />}
                              src={partner.image ? partner.image.url : null}
                            />
                          }
                          title={
                            partner.name ? partner.name : partner.organization
                          }
                        />
                      </div>
                    </Card>
                  );
                })}
            </div>
          </Spin>
        </Sider>
        <div
          className="main-area"
          style={{
            paddingLeft: "2rem",
            width: "100%",
            paddingTop: "1rem",
            paddingRight: "2rem",
          }}
        >
          {/* Header Controls */}
          <div
            className={css`
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 1.5rem;
              flex-wrap: wrap;
              gap: 16px;
            `}
          >
            {/* Left side: View toggle and Active filter */}
            <Space size="large" wrap>
              {/* Mentors/Mentees Segmented Control */}
              <div
                className={css`
                  display: flex;
                  align-items: center;
                  gap: 8px;
                `}
              >
                <TeamOutlined style={{ color: colorPrimary, fontSize: 18 }} />
                <Segmented
                  value={option.key}
                  onChange={(value) => {
                    setOption(
                      value === ACCOUNT_TYPE.MENTOR
                        ? options.MENTORS
                        : options.MENTEES
                    );
                  }}
                  options={[
                    {
                      label: (
                        <span>
                          <UserOutlined style={{ marginRight: 4 }} />
                          Mentees
                        </span>
                      ),
                      value: ACCOUNT_TYPE.MENTEE,
                    },
                    {
                      label: (
                        <span>
                          <UserOutlined style={{ marginRight: 4 }} />
                          Mentors
                        </span>
                      ),
                      value: ACCOUNT_TYPE.MENTOR,
                    },
                  ]}
                />
              </div>

              {/* Active Toggle with Tooltip */}
              <Tooltip
                title={
                  <div>
                    <strong>What is an Active User?</strong>
                    <p style={{ margin: "8px 0 0 0", fontSize: 12 }}>
                      An active user is someone who has exchanged at least one
                      message with another user (mentor or mentee). This filter
                      shows only users who have active conversations.
                    </p>
                  </div>
                }
                placement="bottom"
                overlayStyle={{ maxWidth: 300 }}
              >
                <div
                  className={css`
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 12px;
                    background: ${selectActived ? colorPrimaryBg : "#f5f5f5"};
                    border: 1px solid
                      ${selectActived ? colorPrimaryBorder : "#d9d9d9"};
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s ease;

                    &:hover {
                      border-color: ${colorPrimary};
                    }
                  `}
                  onClick={() => setSelectActived(!selectActived)}
                >
                  <Switch
                    size="small"
                    checked={selectActived}
                    onChange={(e) => setSelectActived(e)}
                  />
                  <CheckCircleOutlined
                    style={{
                      color: selectActived ? colorPrimary : "#999",
                    }}
                  />
                  <Typography.Text
                    style={{
                      color: selectActived ? colorPrimary : "#666",
                      fontWeight: selectActived ? 600 : 400,
                    }}
                  >
                    Active Only
                  </Typography.Text>
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: 11, marginLeft: 4 }}
                  >
                    (?)
                  </Typography.Text>
                </div>
              </Tooltip>
            </Space>

            {/* Right side: Export Button */}
            {selectedPartner && (
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "mentees",
                      label: (
                        <Space>
                          <UserOutlined />
                          Export Mentees Data
                        </Space>
                      ),
                      children: [
                        {
                          key: "mentees-xlsx",
                          label: (
                            <Space>
                              <FileExcelOutlined />
                              Excel (.xlsx)
                            </Space>
                          ),
                          onClick: () => {
                            messageApi.loading(
                              "Preparing mentees Excel export..."
                            );
                            downloadPartnerMenteesData(
                              selectedPartner._id.$oid,
                              "xlsx"
                            )
                              .then(() => {
                                messageApi.success("Mentees Excel downloaded!");
                              })
                              .catch(() => {
                                messageApi.error(
                                  "Failed to export mentees data"
                                );
                              });
                          },
                        },
                        {
                          key: "mentees-csv",
                          label: (
                            <Space>
                              <FileTextOutlined />
                              CSV (.csv)
                            </Space>
                          ),
                          onClick: () => {
                            messageApi.loading(
                              "Preparing mentees CSV export..."
                            );
                            downloadPartnerMenteesData(
                              selectedPartner._id.$oid,
                              "csv"
                            )
                              .then(() => {
                                messageApi.success("Mentees CSV downloaded!");
                              })
                              .catch(() => {
                                messageApi.error(
                                  "Failed to export mentees data"
                                );
                              });
                          },
                        },
                      ],
                    },
                    {
                      key: "mentors",
                      label: (
                        <Space>
                          <UserOutlined />
                          Export Mentors Data
                        </Space>
                      ),
                      children: [
                        {
                          key: "mentors-xlsx",
                          label: (
                            <Space>
                              <FileExcelOutlined />
                              Excel (.xlsx)
                            </Space>
                          ),
                          onClick: () => {
                            messageApi.loading(
                              "Preparing mentors Excel export..."
                            );
                            downloadPartnerMentorsData(
                              selectedPartner._id.$oid,
                              "xlsx"
                            )
                              .then(() => {
                                messageApi.success("Mentors Excel downloaded!");
                              })
                              .catch(() => {
                                messageApi.error(
                                  "Failed to export mentors data"
                                );
                              });
                          },
                        },
                        {
                          key: "mentors-csv",
                          label: (
                            <Space>
                              <FileTextOutlined />
                              CSV (.csv)
                            </Space>
                          ),
                          onClick: () => {
                            messageApi.loading(
                              "Preparing mentors CSV export..."
                            );
                            downloadPartnerMentorsData(
                              selectedPartner._id.$oid,
                              "csv"
                            )
                              .then(() => {
                                messageApi.success("Mentors CSV downloaded!");
                              })
                              .catch(() => {
                                messageApi.error(
                                  "Failed to export mentors data"
                                );
                              });
                          },
                        },
                      ],
                    },
                    {
                      type: "divider",
                    },
                    {
                      key: "info",
                      label: (
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 11 }}
                        >
                          Exports include activity status
                        </Typography.Text>
                      ),
                      disabled: true,
                    },
                  ],
                }}
                trigger={["click"]}
              >
                <Button type="primary" icon={<DownloadOutlined />}>
                  Export Data <DownOutlined />
                </Button>
              </Dropdown>
            )}
          </div>

          {/* Partner Info Banner */}
          {selectedPartner && (
            <div
              className={css`
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                background: linear-gradient(
                  135deg,
                  ${colorPrimaryBg} 0%,
                  #fff 100%
                );
                border: 1px solid ${colorPrimaryBorder};
                border-radius: 8px;
                margin-bottom: 16px;
              `}
            >
              <Avatar
                size={40}
                icon={<UserOutlined />}
                src={selectedPartner.image ? selectedPartner.image.url : null}
              />
              <div>
                <Typography.Text strong style={{ fontSize: 16 }}>
                  {selectedPartner.name || selectedPartner.organization}
                </Typography.Text>
                <div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Showing {tableData?.length || 0} {option.text.toLowerCase()}
                    {selectActived ? " with active conversations" : ""}
                  </Typography.Text>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div style={{ width: "100%" }}>
            <Spin
              wrapperClassName={css`
                width: 100%;
              `}
              spinning={subLoading}
            >
              <Table
                columns={columns}
                dataSource={tableData}
                rowKey={(record) => record.id?.$oid || record.email}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${
                      range[1]
                    } of ${total} ${option.text.toLowerCase()}`,
                }}
                locale={{
                  emptyText: selectedPartner ? (
                    <div style={{ padding: "40px 0" }}>
                      <UserOutlined
                        style={{
                          fontSize: 48,
                          color: "#ccc",
                          marginBottom: 16,
                        }}
                      />
                      <div>
                        <Typography.Text type="secondary">
                          {selectActived
                            ? `No active ${option.text.toLowerCase()} found for this partner`
                            : `No ${option.text.toLowerCase()} assigned to this partner`}
                        </Typography.Text>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: "40px 0" }}>
                      <TeamOutlined
                        style={{
                          fontSize: 48,
                          color: "#ccc",
                          marginBottom: 16,
                        }}
                      />
                      <div>
                        <Typography.Text type="secondary">
                          Select a partner from the sidebar to view their{" "}
                          {option.text.toLowerCase()}
                        </Typography.Text>
                      </div>
                    </div>
                  ),
                }}
              />
            </Spin>
          </div>
        </div>
      </div>

      <Modal
        title="Message Details"
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setModalData([]);
          setSelectedRow(null);
          setSelectedReceiver(null);
          setSearchWord(null);
        }}
        footer={null}
        width={"90%"}
        className="message-details-modal modal-container"
        centered
      >
        <div className="modal-content">
          <div className="message-details-header">
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12}>
                <div className="message-profile">
                  <Avatar
                    size={50}
                    icon={<UserOutlined />}
                    className="modal-profile-icon2"
                    src={
                      selectedRow && selectedRow.image
                        ? selectedRow.image.url
                        : ""
                    }
                  />
                  <div className="message-profile-info">
                    <p className="message-profile-name">{selectedRow?.name}</p>
                    <p className="message-profile-role">
                      {option.text === "Mentors" ? "Mentor" : "Mentee"}
                    </p>
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="message-profile">
                  <Avatar
                    size={50}
                    icon={<UserOutlined />}
                    className="modal-profile-icon2"
                    src={selectedReceiver ? selectedReceiver.image?.url : ""}
                  />
                  <div className="message-profile-info">
                    <p className="message-profile-name">
                      {selectedReceiver ? selectedReceiver.receiver_name : ""}
                    </p>
                    <p className="message-profile-role">
                      {option.text === "Mentors" ? "Mentee" : "Mentor"}
                    </p>
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          <Title level={4} className="modal-title">
            Conversation
          </Title>

          <div className="message-navigation">
            <div className="message-navigation-controls">
              <Radio.Group
                value={sortOrder}
                buttonStyle="solid"
                onChange={(e) => {
                  const newSortOrder = e.target.value;
                  setSortOrder(newSortOrder);

                  setModalData((prevData) => {
                    if (!Array.isArray(prevData)) return [];

                    return [...prevData].sort((a, b) => {
                      const dateA = a?.created_at?.$date
                        ? new Date(a.created_at.$date)
                        : new Date(0);
                      const dateB = b?.created_at?.$date
                        ? new Date(b.created_at.$date)
                        : new Date(0);
                      return newSortOrder === "newest"
                        ? dateB - dateA
                        : dateA - dateB;
                    });
                  });
                }}
              >
                <Radio.Button value="newest">Newest First</Radio.Button>
                <Radio.Button value="oldest">Oldest First</Radio.Button>
              </Radio.Group>

              <Radio.Group
                value={modalMessageFilter}
                buttonStyle="solid"
                onChange={(e) => setModalMessageFilter(e.target.value)}
              >
                <Radio.Button value="all">All Messages</Radio.Button>
                <Radio.Button value="from_mentors">From Mentor</Radio.Button>
                <Radio.Button value="from_mentees">From Mentee</Radio.Button>
              </Radio.Group>
            </div>

            <Input.Search
              placeholder="Search in conversation"
              className="conversation-search"
              allowClear
              value={searchWord}
              onChange={(e) => handleSearchMessages(e.target.value)}
            />
          </div>

          <div className="message-count">
            <Typography.Text type="secondary">
              Showing {getFilteredModalMessages().length} message
              {getFilteredModalMessages().length !== 1 ? "s" : ""}
            </Typography.Text>
          </div>

          <div className="message-bubble-container">
            {Array.isArray(getFilteredModalMessages()) &&
            getFilteredModalMessages().length > 0 ? (
              getFilteredModalMessages().map((message, index) => {
                const selected_user_id = selectedRow?.id.$oid;
                const senderId = message.sender_id?.$oid || message.sender_id;
                const isSender = senderId === selected_user_id;

                const date = new Date(message.created_at.$date);

                const showUnansweredTag =
                  selectedRow?.hasUnansweredMessages && isSender && index === 0;
                return (
                  <div
                    key={index}
                    className={`message-bubble ${
                      isSender
                        ? "message-bubble-mentee"
                        : "message-bubble-mentor"
                    }`}
                  >
                    <div style={{ display: "flex" }}>
                      <Avatar
                        style={{ marginRight: "8px" }}
                        size={25}
                        icon={<UserOutlined />}
                        className=""
                        src={
                          isSender
                            ? selectedRow && selectedRow.image
                              ? selectedRow.image.url
                              : ""
                            : selectedReceiver && selectedReceiver.image
                            ? selectedReceiver.image.url
                            : ""
                        }
                      />
                      <div className="message-bubble-content">
                        {message.body}
                      </div>
                    </div>

                    <div className="message-bubble-footer">
                      <span className="message-date">
                        {date.toLocaleString()}
                      </span>
                      <div>
                        {/* <Tag color={isSender ? "green" : "blue"}>
                          {isSender ? "Mentee" : "Mentor"}
                        </Tag> */}
                        {showUnansweredTag && (
                          <Tag
                            color="orange"
                            icon={<ExclamationCircleOutlined />}
                          >
                            Unanswered
                          </Tag>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-messages">No messages to display</div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
