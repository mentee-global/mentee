import React, { useEffect, useState, useRef } from "react";
import { Avatar, Input, Button, Spin, Modal, theme, Drawer } from "antd";
import { withRouter, NavLink } from "react-router-dom";
import { ACCOUNT_TYPE } from "utils/consts";
import moment from "moment-timezone";
import { SendOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useAuth } from "utils/hooks/useAuth";
import {
  fetchAccountById,
  sendNotifyUnreadMessage,
  sendInviteMail,
  fetchAppointmentsByMentorId,
  fetchAppointmentsByMenteeId,
  fetchAvailability,
} from "utils/api";
import { formatAppointments } from "utils/dateFormatting";
import MenteeAppointmentModal from "./MenteeAppointmentModal";
import socketInvite from "utils/socket";
import AvailabilityCalendar from "components/AvailabilityCalendar";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from "react-responsive";
import { css } from "@emotion/css";

function MessagesChatArea(props) {
  const {
    token: { colorPrimaryBg },
  } = theme.useToken();
  const { t } = useTranslation();
  const queryParameters = new URLSearchParams(window.location.search);
  const messageId = queryParameters.get("message_id");
  const { socket } = props;
  const { TextArea } = Input;
  const { profileId, isMentee, isMentor, isPartner } = useAuth();
  const [messageText, setMessageText] = useState("");
  const [accountData, setAccountData] = useState(null);
  const [isAlreadyInvited, setIsAlreadyInvited] = useState(false);
  const [isAlreadyInvitedByMentor, setIsAlreadyInvitedByMentor] =
    useState(false);
  const [updateContent, setUpdateContent] = useState(false);
  const [isOpenCalendarModal, setIsOpenCalendarModal] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [availabeInFuture, setAvailabeInFuture] = useState([]);
  const [bookedData, setBookedData] = useState({});
  const isMobile = useMediaQuery({ query: `(max-width: 761px)` });
  var total_index = 0;
  const {
    messages,
    activeMessageId,
    otherId,
    userType,
    loading,
    isBookingVisible,
    inviteeId,
    restrictedPartners,
    user,
  } = props;
  const messagesEndRef = useRef(null);
  const buttonRef = useRef(null);
  const scrollToBottom = () => {
    if (messagesEndRef.current != null) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  };

  function scrollToElement(id) {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  }

  useEffect(() => {
    async function fetchAccount() {
      var account = null;
      if (user && user.pair_partner && user.pair_partner.restricted) {
        var same_kind_user_ids = [];
        if (
          user.pair_partner.assign_mentees &&
          user.pair_partner.assign_mentees.length > 0
        ) {
          user.pair_partner.assign_mentees.map((item) => {
            same_kind_user_ids.push(item.id);
            return false;
          });
        }
        if (
          user.pair_partner.assign_mentors &&
          user.pair_partner.assign_mentors.length > 0
        ) {
          user.pair_partner.assign_mentors.map((item) => {
            same_kind_user_ids.push(item.id);
            return false;
          });
        }
        if (same_kind_user_ids.includes(otherId)) {
          account = await fetchAccountById(otherId, userType);
        }
      } else {
        if (restrictedPartners && restrictedPartners.length > 0) {
          var restricted_user_ids = [];
          restrictedPartners.map((partner_item) => {
            if (partner_item.assign_mentors) {
              partner_item.assign_mentors.map((assign_item) => {
                restricted_user_ids.push(assign_item.id);
                return false;
              });
            }
            if (partner_item.assign_mentees) {
              partner_item.assign_mentees.map((assign_item) => {
                restricted_user_ids.push(assign_item.id);
                return false;
              });
            }
            return false;
          });
          if (!restricted_user_ids.includes(otherId)) {
            account = await fetchAccountById(otherId, userType);
          }
        } else {
          account = await fetchAccountById(otherId, userType);
        }
      }
      if (account) {
        setAccountData(account);
        if (parseInt(userType, 10) === ACCOUNT_TYPE.MENTEE) {
          setIsAlreadyInvitedByMentor(
            account.favorite_mentors_ids.indexOf(otherId) >= 0
          );
        }
      }
      if (parseInt(userType, 10) === ACCOUNT_TYPE.MENTOR) {
        var profileAcount = await fetchAccountById(
          profileId,
          ACCOUNT_TYPE.MENTEE
        );
        if (profileAcount) {
          setIsAlreadyInvited(
            profileAcount.favorite_mentors_ids.indexOf(otherId) >= 0
          );
        }
      }
    }
    fetchAccount();
  }, [updateContent, otherId, messages]);

  useEffect(() => {
    if (messageId) {
      if (!messages?.length) return;
      scrollToElement(messageId);
    } else {
      scrollToBottom();
    }
  }, [loading, messages, messageId]);

  async function getAppointments() {
    const mentorID = profileId;
    var formattedAppointments = {};
    if (isMentor) {
      const appointmentsResponse = await fetchAppointmentsByMentorId(mentorID);

      formattedAppointments = formatAppointments(
        appointmentsResponse,
        ACCOUNT_TYPE.MENTOR
      );
    } else if (isMentee) {
      const appointmentsResponse = await fetchAppointmentsByMenteeId(mentorID);

      formattedAppointments = formatAppointments(
        appointmentsResponse,
        ACCOUNT_TYPE.MENTOR
      );
    }
    const booked_data = {};
    var tmp_avails = [];
    if (formattedAppointments) {
      if (isMentor) {
        tmp_avails = formattedAppointments["upcoming"];
      }
      if (isMentee) {
        formattedAppointments["pending"].map((item) => {
          tmp_avails.push(item);
          return true;
        });

        formattedAppointments["upcoming"].map((item) => {
          tmp_avails.push(item);
          return true;
        });
      }
      setAppointments(tmp_avails);
      if (tmp_avails) {
        tmp_avails.map((item) => {
          item.appointments.map((appoint_item) => {
            booked_data[
              moment
                .parseZone(appoint_item.timeslot.start_time.$date)
                .local()
                .format("YY-MM-DD H:mm")
            ] = true;
            return true;
          });
          return true;
        });
        setBookedData(booked_data);
      }
    }
  }
  async function getAvailableInFuture() {
    const availability_data = await fetchAvailability(profileId);
    const now = moment();

    const future_availables = [];
    if (availability_data) {
      const availability = availability_data.availability;
      availability.forEach((time) => {
        // Checking if saved or set have date already
        var starttime = moment(time.start_time.$date);
        if (
          !bookedData.hasOwnProperty(
            moment
              .parseZone(time.start_time.$date)
              .local()
              .format("YY-MM-DD H:mm")
          ) &&
          starttime.isSameOrAfter(now)
        ) {
          future_availables.push(time);
        }
      });
    }
    setAvailabeInFuture(future_availables);
  }

  useEffect(() => {
    if (isOpenCalendarModal === false) {
      getAppointments();
      getAvailableInFuture();
    }
  }, [isOpenCalendarModal]);

  const handleUpdateAccount = () => {
    setUpdateContent(!updateContent);
  };
  const handleSuccessBooking = (chatMsg) => {
    let dateTime = moment().utc();
    const msg = {
      body: chatMsg,
      message_read: false,
      sender_id: profileId,
      recipient_id: activeMessageId,
      time: dateTime,
    };
    socket.emit("send", msg);
    msg["sender_id"] = { $oid: msg["sender_id"] };
    msg["recipient_id"] = { $oid: msg["recipient_id"] };
    msg.time = moment().local().format("LLL");
    props.addMyMessage(msg);
    setMessageText("");
    getAppointments();
    getAvailableInFuture();
    return;
  };
  /*
    To do: Load user on opening. Read from mongo and also connect to socket.
  */

  const sendInvite = (e) => {
    const inviteMsg = {
      sender_id: profileId,
      recipient_id: activeMessageId,
    };
    socketInvite.emit("invite", inviteMsg);
    let dateTime = moment().utc();
    var availabes_in_future = [];
    availabeInFuture.map((avail_item, index) => {
      if (index < 5) {
        availabes_in_future.push(avail_item);
      }
      return true;
    });
    const msg = {
      body: t("messages.sendInviteBody"),
      message_read: false,
      sender_id: profileId,
      recipient_id: activeMessageId,
      time: dateTime,
      availabes_in_future: availabes_in_future,
    };
    socket.emit("send", msg);
    setTimeout(() => {
      sendInviteMail(activeMessageId, profileId, availabes_in_future);
    }, 1000);
    msg["sender_id"] = { $oid: msg["sender_id"] };
    msg["recipient_id"] = { $oid: msg["recipient_id"] };
    msg.time = moment().local().format("LLL");
    props.addMyMessage(msg);
    setMessageText("");
    return;
  };

  const showSideBar = () => {
    if (isMobile) {
      var sidebar = document.getElementsByClassName("ant-layout-sider");
      if (sidebar.length > 0) {
        sidebar[0].style.display = "block";
      }
    }
  };

  const sendMessage = (e) => {
    let currentMessage = messageText;
    if (!currentMessage.trim().length) {
      return;
    }
    let dateTime = moment().utc();
    const msg = {
      body: currentMessage,
      message_read: false,
      sender_id: profileId,
      recipient_id: activeMessageId,
      time: dateTime,
    };
    socket.emit("send", msg);
    setTimeout(() => {
      sendNotifyUnreadMessage(activeMessageId);
    }, 1000);
    msg["sender_id"] = { $oid: msg["sender_id"] };
    msg["recipient_id"] = { $oid: msg["recipient_id"] };
    msg.time = moment().local().format("LLL");
    props.addMyMessage(msg);
    setMessageText("");
    return;
  };
  if (!activeMessageId || !messages || !messages.length) {
    return (
      <div className="no-messages">
        {isMobile && (
          <div
            onClick={showSideBar}
            style={{ cursor: "pointer", width: "20px", fontSize: "16px" }}
          >
            <ArrowLeftOutlined />
          </div>
        )}
        <div className="start-convo">{t("messages.startConversation")}</div>
      </div>
    );
  }

  const styles = {
    bubbleSent: css`
      float: right;
      clear: right;
      background-color: ${colorPrimaryBg};
    `,
    bubbleReceived: css`
      float: left;
      clear: left;
      background-color: #f4f5f9;
    `,
  };

  const linkify = (text) => {
    const urlPattern =
      /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
    return text.replace(urlPattern, '<a href="$1" target="_blank">$1</a>');
  };

  const HtmlContent = ({ content }) => {
    return <div style={{wordBreak: isMobile ? 'break-word' : 'normal', fontSize: '15px'}} dangerouslySetInnerHTML={{ __html: content }} />;
  };

  return (
    <div className="conversation-container">
      {accountData ? (
        <div className="messages-chat-area-header">
          {isMobile && (
            <div
              onClick={showSideBar}
              style={{ cursor: "pointer", width: "20px", fontSize: "16px" }}
            >
              <ArrowLeftOutlined />
            </div>
          )}
          <NavLink
            to={`/gallery/${userType ? userType : ACCOUNT_TYPE.HUB}/${
              accountData._id.$oid
            }`}
          >
            <Avatar size={60} src={accountData.image?.url} />
          </NavLink>
          <div className="messages-chat-area-header-info">
            <div className="messages-chat-area-header-name">
              {isPartner
                ? accountData.organization
                : accountData.name
                ? accountData.name
                : accountData.organization}
            </div>
            <div className="messages-chat-area-header-title">
              {isPartner
                ? accountData.intro
                : accountData.professional_title
                ? accountData.professional_title
                : accountData.intro}
            </div>
            {((isBookingVisible && inviteeId === otherId) ||
              isAlreadyInvited) && (
              <div className="mentor-profile-book-appt-btn">
                <MenteeAppointmentModal
                  mentor_name={accountData.name}
                  availability={accountData.availability}
                  mentor_id={otherId}
                  mentee_id={profileId}
                  handleUpdateMentor={handleUpdateAccount}
                  handleSuccessBooking={handleSuccessBooking}
                />
              </div>
            )}
            <div style={{ display: "flex", marginTop: "5px" }}>
              {isMentor && (
                <div style={{ marginRight: "10px" }}>
                  <Button
                    onClick={() => {
                      setIsOpenCalendarModal(true);
                    }}
                    type="primary"
                  >
                    {t("messages.availability")}
                  </Button>
                </div>
              )}
              {isMentor &&
                !isAlreadyInvitedByMentor &&
                !isPartner &&
                availabeInFuture.length > 0 && (
                  <div>
                    <Button onClick={sendInvite} type="primary">
                      {t("messages.sendInvite")}
                    </Button>
                  </div>
                )}
            </div>
          </div>
        </div>
      ) : (
        <div></div>
      )}
      <div className="conversation-content">
        <Spin spinning={loading}>
          {accountData &&
            messages.map((block, index) => {
              return (
                <div
                  className={`chatRight__items you-${
                    block.sender_id.$oid === profileId ? "sent" : "received"
                  }`}
                  id={block?._id?.$oid || index}
                >
                  <div
                    className={`chatRight__inner  message-area ${
                      block.sender_id.$oid !== profileId
                        ? "flex-start"
                        : "flex-end"
                    }`}
                    data-chat="person1"
                  >
                    <div className="flex">
                      {block.sender_id.$oid !== profileId && (
                        <span>
                          <Avatar src={accountData.image?.url} />{" "}
                        </span>
                      )}
                      <div className="convo">
                        <div
                          className={css`
                            padding: 5px 15px;
                            border-radius: 5px;
                            margin-left: 8px;
                            width: fit-content;
                            white-space: pre-wrap;
                            ${block.sender_id.$oid === profileId
                              ? styles.bubbleSent
                              : styles.bubbleReceived}
                          `}
                        >
                          <HtmlContent content={linkify(block.body)} />
                          {block.availabes_in_future !== undefined &&
                            block.availabes_in_future !== null &&
                            block.availabes_in_future.length > 0 &&
                            block.availabes_in_future.map((available_item) => {
                              total_index++;
                              return (
                                <>
                                  {block.sender_id.$oid === profileId ||
                                  bookedData.hasOwnProperty(
                                    moment
                                      .parseZone(
                                        available_item.start_time.$date
                                      )
                                      .local()
                                      .format("YY-MM-DD H:mm")
                                  ) ? (
                                    <div>
                                      {moment
                                        .parseZone(
                                          available_item.start_time.$date
                                        )
                                        .local()
                                        .format("LLL")}{" "}
                                      ~{" "}
                                      {moment
                                        .parseZone(
                                          available_item.end_time.$date
                                        )
                                        .local()
                                        .format("LT")}
                                    </div>
                                  ) : (
                                    <MenteeAppointmentModal
                                      mentor_name={accountData.name}
                                      availability={block.availabes_in_future}
                                      selected_availability={available_item}
                                      mentor_id={otherId}
                                      mentee_id={profileId}
                                      handleUpdateMentor={handleUpdateAccount}
                                      handleSuccessBooking={
                                        handleSuccessBooking
                                      }
                                      btn_title={
                                        moment
                                          .parseZone(
                                            available_item.start_time.$date
                                          )
                                          .local()
                                          .format("LLL") +
                                        " ~ " +
                                        moment
                                          .parseZone(
                                            available_item.end_time.$date
                                          )
                                          .local()
                                          .format("LTS")
                                      }
                                      index={total_index}
                                    />
                                  )}
                                </>
                              );
                            })}
                        </div>
                      </div>
                    </div>

                    <span style={{ opacity: "40%" }}>
                      {block.time
                        ? block.time
                        : moment
                            .utc(block.created_at.$date)
                            .local()
                            .format("LLL")}
                    </span>
                  </div>
                </div>
              );
            })}
        </Spin>
        <div ref={messagesEndRef} />
      </div>
      <div className="conversation-footer">
        {accountData && (
          <>
            <TextArea
              className="message-input"
              placeholder={t("messages.sendMessagePlaceholder")}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              autoSize={{ minRows: 1, maxRows: 3 }}
            />
            <Button
              id="sendMessagebtn"
              onClick={sendMessage}
              className={css`
                margin-left: 0.5em;
                padding: 0.5em;
              `}
              shape="default"
              type="primary"
              ref={buttonRef}
              icon={<SendOutlined rotate={315} />}
              size={48}
            >
              {t("messages.sent")}
            </Button>
          </>
        )}
      </div>

      {isMobile ? (
        // TODO: Consolidate the modal and drawer into one component
        <Drawer
          width={"100%"}
          title={t("messages.availabilityTitle")}
          open={isOpenCalendarModal}
          onClose={() => setIsOpenCalendarModal(false)}
          footer={[
            <Button
              type="primary"
              onClick={() => {
                setIsOpenCalendarModal(false);
              }}
            >
              {t("common.cancel")}
            </Button>,
          ]}
        >
          <AvailabilityCalendar appointmentdata={appointments} />
        </Drawer>
      ) : (
        <Modal
          className="calendar-modal"
          title={t("messages.availabilityTitle")}
          open={isOpenCalendarModal}
          onCancel={() => setIsOpenCalendarModal(false)}
          footer={[
            <Button
              type="primary"
              onClick={() => {
                setIsOpenCalendarModal(false);
              }}
            >
              {t("common.cancel")}
            </Button>,
          ]}
        >
          <AvailabilityCalendar appointmentdata={appointments} />
        </Modal>
      )}
    </div>
  );
}
export default withRouter(MessagesChatArea);
