import React, { useState, useEffect } from "react";
import {
  Input,
  Table,
  Select,
  Tag,
  Modal,
  Avatar,
  Spin,
  Typography,
  Alert,
  Row,
  Col,
  Radio,
  DatePicker,
  Button,
  Badge,
  Switch,
} from "antd";
import {
  UserOutlined,
  FilterOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import * as api from "../../utils/api";
import { getUserIdToken } from "../../utils/auth.service";
import moment from "moment";
import "../css/AdminMessages.scss";

export const AdminMessages = () => {
  const { RangePicker } = DatePicker;
  const { Title } = Typography;
  const [totalLength, setTotalLength] = useState(0);
  const [modalData, setModalData] = useState([]);
  const [data, setData] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageNumber, setpageNumber] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPartner, setSelectedPartner] = useState("no-affiliation");
  const [partners, setPartners] = useState([]);
  const [selectedPartnerData, setSelectedPartnerData] = useState(null);
  const VIEW_MODE = "all";
  const [showOnlyUnanswered, setShowOnlyUnanswered] = useState(false);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState("newest");
  const [modalMessageFilter, setModalMessageFilter] = useState("all");

  const pageSize = 20;

  // Fetch partners list and their assigned mentors/mentees
  const fetchPartners = async () => {
    try {
      // Only fetch if we don't already have partners data
      if (partners.length === 0) {

        const partnersData = await api.fetchPartners();

        if (Array.isArray(partnersData) && partnersData.length > 0) {


          setPartners(partnersData);
        } else {
          setPartners([]);
        }
      }
    } catch (error) {
      console.error("Error fetching partners:", error);
      setError("Failed to load partners");
      setPartners([]);
    }
  };

  // Get the selected partner's data including assigned mentors and mentees
  const getSelectedPartnerData = async (partnerId) => {
    if (partnerId === "all" || partnerId === "no-affiliation") {
      setSelectedPartnerData(null);
      return;
    }

    try {
      const existingPartner = partners.find(
        (partner) => partner._id.$oid === partnerId
      );


      if (existingPartner) {
        setSelectedPartnerData(existingPartner);
      } else {
        const partnersData = await api.fetchPartners();

        if (Array.isArray(partnersData) && partnersData.length > 0) {
          setPartners(partnersData);

          const selectedPartner = partnersData.find(
            (partner) => partner._id.$oid === partnerId
          );

          if (selectedPartner) {
            setSelectedPartnerData(selectedPartner);
          } else {
            setSelectedPartnerData(null);
          }
        } else {
          setSelectedPartnerData(null);
        }
      }
    } catch (error) {
      console.error("Error fetching partner details:", error);
      setSelectedPartnerData(null);
    }
  };

  const filterDataByPartner = (data, partnerData) => {
    if (!partnerData || !Array.isArray(data) || data.length === 0) {
      return data;
    }

    const assignMentors = Array.isArray(partnerData.assign_mentors)
      ? partnerData.assign_mentors
      : [];
    const assignMentees = Array.isArray(partnerData.assign_mentees)
      ? partnerData.assign_mentees
      : [];
    

    const mentorIds = assignMentors
      .map((mentor) => {
        if (!mentor || !mentor.id) return null;

        if (typeof mentor.id === "string") {
          return mentor.id;
        } else if (mentor.id && mentor.id.$oid) {
          return mentor.id.$oid;
        } else {
          return mentor.id;
        }
      })
      .filter((id) => id !== null);

    const menteeIds = assignMentees
      .map((mentee) => {
        if (!mentee || !mentee.id) return null;

        if (typeof mentee.id === "string") {
          return mentee.id;
        } else if (mentee.id && mentee.id.$oid) {
          return mentee.id.$oid;
        } else {
          return mentee.id;
        }
      })
      .filter((id) => id !== null);

    return data.filter((item) => {
      if (!item || !item.user || !item.user._id) return false;

      const mentorId = item.user._id.$oid || item.user._id;
      const menteeId = item.otherId;

      const isMentorAssigned = mentorIds.includes(mentorId);
      const isMenteeAssigned = menteeIds.includes(menteeId);

      return isMentorAssigned || isMenteeAssigned;
    });
  };

  // Get message data with sender identification flags
  const getMessageDataWithFlags = async (sender_id, recipient_id) => {
    try {
      const messages = await api.getMessageData(sender_id, recipient_id);
      return Array.isArray(messages) ? messages : [];
    } catch (error) {
      console.error("Error fetching messages:", error);
      setError("Failed to load message details");
      return [];
    }
  };

  // Load messages and partners on component mount and when filters change
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);

        await getUserIdToken();
        await fetchPartners();

        let apiPartnerId;

        if (selectedPartner === "no-affiliation") {
          apiPartnerId = "no-affiliation";
        } else if (selectedPartner === "all-partners") {
          apiPartnerId = "all-partners";
        } else if (selectedPartner === "all") {
          apiPartnerId = "all";
        } else {
          apiPartnerId = selectedPartner;
        }


        let { data: newData, total_length } = (await api.getDetailMessages(
          pageNumber,
          pageSize,
          searchTerm,
          startDate,
          endDate,
          apiPartnerId,
          VIEW_MODE,
          showOnlyUnanswered
        )) || { data: [], total_length: 0 };
        

        if (newData) {

          newData = newData.map((item) => {
            return {
              ...item,
              status: item.hasUnansweredMessages ? "unanswered" : "answered",
            };
          });

          if (
            selectedPartner !== "all" &&
            selectedPartner !== "no-affiliation" &&
            selectedPartnerData
          ) {
            newData = filterDataByPartner(newData, selectedPartnerData);
            total_length = newData.length;

          }

          if (showOnlyUnanswered) {
            newData = newData.filter((item) => item.hasUnansweredMessages);
            total_length = newData.length;
          }

          setTotalLength(total_length);
          setData(newData);
        } else {
          setData([]);
          setTotalLength(0);
        }
      } catch (error) {
        console.error("Error initializing data:", error);
        setError("Failed to load data. Please try again later.");
        setData([]);
        setTotalLength(0);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedPartner,
    selectedPartnerData,
    showOnlyUnanswered,
    pageNumber,
    pageSize,
    startDate,
    endDate,
    searchTerm,
  ]);

  const handleViewDetail = (rowIndex) => {
    if (!data || rowIndex < 0 || rowIndex >= data.length) {
      console.error("Invalid row index or data not loaded");
      setError("Cannot view message details. Please try again.");
      return;
    }

    setSelectedRow(data[rowIndex]);
    setShowModal(true);
    setSortOrder("newest"); // Reset sort order to newest when opening modal
    setModalMessageFilter("all"); // Reset message filter to show all messages

    getMessageDataWithFlags(
      data[rowIndex].user._id.$oid,
      data[rowIndex].otherId
    )
      .then((messages) => {
        // Sort messages in reverse chronological order (newest first)
        const sortedMessages = Array.isArray(messages)
          ? [...messages].sort((a, b) => {
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
      })
      .catch((error) => {
        console.error("Error fetching message details:", error);
        setError("Failed to load message details");
        setModalData([]);
      });
  };

  const getFilteredModalMessages = () => {
    if (!modalData || !Array.isArray(modalData)) return [];

    if (modalMessageFilter === "all") {
      return modalData;
    }

    return modalData.filter((message) => {
      const messageSenderId = message.sender_id?.$oid || message.sender_id;

      if (modalMessageFilter === "from_mentors" && selectedRow) {
        const mentorId = selectedRow.user._id.$oid || selectedRow.user.id;
        return messageSenderId === mentorId;
      } else if (modalMessageFilter === "from_mentees" && selectedRow) {
        return messageSenderId === selectedRow.otherId;
      }
      return true;
    });
  };

  const { Search } = Input;

  const handlePartnerChange = async (value) => {
    setSelectedPartner(value);
    await getSelectedPartnerData(value);
    setpageNumber(1);
  };

  const handleRefresh = () => {
    // Reset all state values to empty
    setSearchTerm("");
    setSelectedPartner("no-affiliation");
    setStartDate("");
    setEndDate("");
    setShowOnlyUnanswered(false);
    setpageNumber(1);
  };

  const onRowHandler = (record, rowIndex) => {
    return {
      onClick: (event) => {
        handleViewDetail(rowIndex);
      },
    };
  };

  const renderPartnerTag = (partner) => {
    if (!partner) return null;

    return (
      <Tag color="purple" style={{ marginTop: "4px" }}>
        {partner.email || partner.organization || "Partner"}
      </Tag>
    );
  };

  const columns = [
    {
      title: "Mentor",
      sorter: (a, b) => (a.user.name < b.user.name ? -1 : 1),
      dataIndex: "user",
      key: "user",
      render: (value) => (
        <div>
          <Avatar
            size={30}
            icon={<UserOutlined />}
            className="modal-profile-icon2"
            src={value.image ? value.image.url : ""}
          />
          <div>{value.name}</div>
          {value.pair_partner && value.pair_partner.organization && (
            <Tag color="blue">{value.pair_partner.organization}</Tag>
          )}
          {value.partner && renderPartnerTag(value.partner)}
        </div>
      ),
    },
    {
      title: "Mentee",
      sorter: (a, b) => (a.otherUser.name < b.otherUser.name ? -1 : 1),
      dataIndex: "otherUser",
      key: "otherUser",
      render: (value) => (
        <div>
          <Avatar
            size={30}
            icon={<UserOutlined />}
            className="modal-profile-icon2"
            src={value.image ? value.image : ""}
          />
          <div>{value.name}</div>
          {value.pair_partner && value.pair_partner.organization && (
            <Tag color="green">{value.pair_partner.organization}</Tag>
          )}
          {value.partner && renderPartnerTag(value.partner)}
        </div>
      ),
    },
    {
      title: "Messages",
      sorter: (a, b) => a.numberOfMessages - b.numberOfMessages,
      dataIndex: "numberOfMessages",
      key: "numberOfMessages",
      render: (value) => <span>{value}</span>,
    },
    {
      title: "Latest Message",
      dataIndex: "latestMessage",
      key: "latestMessage",
      render: (value, row) => (
        <div className="message-cell">
          <Badge
            status={row.status === "unanswered" ? "warning" : "success"}
            style={{ marginRight: 8 }}
          />
          <span className="message-body-text">
            {value && value.body ? value.body : value}
          </span>
        </div>
      ),
      width: "20%",
    },
    {
      title: "Date",
      sorter: (a, b) =>
        new Date(a.latestMessage.created_at.$date) -
        new Date(b.latestMessage.created_at.$date),
      dataIndex: "latestMessage",
      key: "date",
      render: (value) => (
        <span>{new Date(value.created_at.$date).toLocaleDateString()}</span>
      ),
    },
    {
      title: "Sender",
      dataIndex: "sender",
      key: "sender",
      render: (value, row) => {
        const fromMentee =
          row.latestMessage.recipient_id.$oid === row.user._id.$oid;

        return (
          <Tag color={fromMentee ? "green" : "blue"}>
            {fromMentee ? "Mentee" : "Mentor"}
          </Tag>
        );
      },
      width: "15%",
    },
  ];

  return (
    <div className="trains">
      <div className="rolesContainer" style={{ width: "100%" }}>
        <div className="filter-section">
          <Title level={4} className="filter-title">
            <FilterOutlined /> Message Filters
          </Title>

          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: "16px" }}
              closable
              onClose={() => setError(null)}
            />
          )}

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={24} md={12} lg={6} xl={6}>
              <Search
                placeholder="Search by name"
                onSearch={(value) => {
                  setSearchTerm(value);
                  setpageNumber(1);
                }}
                className="search-mentor-input search-input"
                allowClear
                value={searchTerm}
                onChange={(e) => {
                  // Only update the local input value, don't trigger search
                  setSearchTerm(e.target.value);
                }}
                enterButton
              />
            </Col>

            <Col xs={24} sm={24} md={12} lg={6} xl={6}>
              <div className="partner-filter-container">
                <Select
                  className="partner-filter-select"
                  placeholder="Select Partner"
                  value={selectedPartner}
                  onChange={handlePartnerChange}
                >
                  <Select.Option value="no-affiliation">
                    No Affiliation
                  </Select.Option>
                  <Select.Option value="all-partners">
                    All Partners
                  </Select.Option>
                  <Select.Option value="all">All</Select.Option>
                  {Array.isArray(partners) &&
                    partners.map((partner) => {
                      // Skip partners with no assigned mentors or mentees
                      const hasMentors =
                        Array.isArray(partner.assign_mentors) &&
                        partner.assign_mentors.length > 0;
                      const hasMentees =
                        Array.isArray(partner.assign_mentees) &&
                        partner.assign_mentees.length > 0;

                      if (!hasMentors && !hasMentees) {
                        return null;
                      }

                      const displayName =
                        partner.email ||
                        (partner.organization
                          ? `${partner.organization} Partner`
                          : "Partner");

                      return (
                        <Select.Option
                          key={partner._id.$oid}
                          value={partner._id.$oid}
                        >
                          {displayName} (
                          {(hasMentors ? partner.assign_mentors.length : 0) +
                            (hasMentees
                              ? partner.assign_mentees.length
                              : 0)}{" "}
                          assigned)
                        </Select.Option>
                      );
                    })}
                </Select>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  title="Reset all filters"
                />
              </div>
            </Col>

            <Col xs={24} sm={24} md={12} lg={6} xl={6}>
              <RangePicker
                onChange={(date, dateString) => {
                  if (!date || (dateString[0] === "" && dateString[1] === "")) {
                    setStartDate("");
                    setEndDate("");
                  } else {
                    setStartDate(dateString[0]);
                    setEndDate(dateString[1]);
                  }
                  setpageNumber(1);
                }}
                className="messages-date-range date-range-picker"
                value={[
                  startDate ? moment(startDate) : null,
                  endDate ? moment(endDate) : null
                ]}
              />
            </Col>

            <Col xs={24} sm={24} md={12} lg={6} xl={6} className="flex-center">
              <div className="unanswered-toggle">
                <Switch
                  checked={showOnlyUnanswered}
                  onChange={(checked) => {
                    setShowOnlyUnanswered(checked);
                    setpageNumber(1);
                  }}
                  size="small"
                />
                <span className="unanswered-label">
                  {showOnlyUnanswered ? (
                    <strong>Showing unanswered messages only</strong>
                  ) : (
                    "Show unanswered messages only"
                  )}
                </span>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      ) : (
        <div className="trainTable">
          {!Array.isArray(data) || data.length === 0 ? (
            <Alert
              message="No messages found"
              description="Try adjusting the filters to see more results."
              type="info"
              showIcon
            />
          ) : (
            <Table
              columns={columns}
              onRow={onRowHandler}
              dataSource={data}
              pagination={{
                pageSize: pageSize,
                className: "pagination-style",
                defaultCurrent: 1,
                pageNumber: pageNumber,
                current: pageNumber,
                total: totalLength,
                onChange: (page) => {
                  setpageNumber(page);
                },
                responsive: true,
                showSizeChanger: false,
              }}
              scroll={{ x: "max-content" }}
              rowKey={(record) => `${record.user._id.$oid}-${record.otherId}`}
              className="responsive-table"
            />
          )}
        </div>
      )}

      <Modal
        title="Message Details"
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setModalData([]);
          setSelectedRow(null);
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
                      selectedRow?.user.image ? selectedRow?.user.image.url : ""
                    }
                  />
                  <div className="message-profile-info">
                    <p className="message-profile-name">
                      {selectedRow?.user.name}
                    </p>
                    <p className="message-profile-role">Mentor</p>
                    {selectedRow?.user.pair_partner &&
                      selectedRow?.user.pair_partner.organization && (
                        <Tag color="blue">
                          {selectedRow?.user.pair_partner.organization}
                        </Tag>
                      )}
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="message-profile">
                  <Avatar
                    size={50}
                    icon={<UserOutlined />}
                    className="modal-profile-icon2"
                    src={
                      selectedRow?.otherUser.image
                        ? selectedRow?.otherUser.image
                        : ""
                    }
                  />
                  <div className="message-profile-info">
                    <p className="message-profile-name">
                      {selectedRow?.otherUser.name}
                    </p>
                    <p className="message-profile-role">Mentee</p>
                    {selectedRow?.otherUser.pair_partner &&
                      selectedRow?.otherUser.pair_partner.organization && (
                        <Tag color="green">
                          {selectedRow?.otherUser.pair_partner.organization}
                        </Tag>
                      )}
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
              onSearch={(value) => {
                if (!value.trim()) {
                  getMessageDataWithFlags(
                    selectedRow.user._id.$oid,
                    selectedRow.otherId
                  ).then((messages) => {
                    const sortedMessages = Array.isArray(messages)
                      ? [...messages].sort((a, b) => {
                          const dateA = a?.created_at?.$date
                            ? new Date(a.created_at.$date)
                            : new Date(0);
                          const dateB = b?.created_at?.$date
                            ? new Date(b.created_at.$date)
                            : new Date(0);
                          return sortOrder === "newest"
                            ? dateB - dateA
                            : dateA - dateB;
                        })
                      : [];

                    setModalData(sortedMessages || []);
                  });
                  return;
                }

                const searchTerm = value.toLowerCase();
                setModalData((prevData) => {
                  if (!Array.isArray(prevData)) return [];

                  return prevData.filter((message) =>
                    message?.body?.toLowerCase().includes(searchTerm)
                  );
                });
              }}
              allowClear
            />
          </div>

          <div className="message-count">
            <Typography.Text type="secondary">
              Showing {getFilteredModalMessages().length} message
              {getFilteredModalMessages().length !== 1 ? "s" : ""}
              {getFilteredModalMessages().length > 20 &&
                " (scroll to view all)"}
            </Typography.Text>
          </div>

          <div className="message-bubble-container">
            {Array.isArray(getFilteredModalMessages()) &&
            getFilteredModalMessages().length > 0 ? (
              getFilteredModalMessages().map((message, index) => {
                const menteeId = selectedRow?.otherId;
                const senderId = message.sender_id?.$oid || message.sender_id;
                const isMenteeSender = senderId === menteeId;

                const date = new Date(message.created_at.$date);
                
                const showUnansweredTag = selectedRow?.hasUnansweredMessages && isMenteeSender && index === 0;

                return (
                  <div
                    key={index}
                    className={`message-bubble ${
                      isMenteeSender
                        ? "message-bubble-mentee"
                        : "message-bubble-mentor"
                    }`}
                  >
                    <div className="message-bubble-content">{message.body}</div>
                    <div className="message-bubble-footer">
                      <span className="message-date">
                        {date.toLocaleString()}
                      </span>
                      <div>
                        <Tag color={isMenteeSender ? "green" : "blue"}>
                          {isMenteeSender ? "Mentee" : "Mentor"}
                        </Tag>
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
