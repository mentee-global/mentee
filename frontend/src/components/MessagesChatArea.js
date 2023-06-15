import React, { useEffect, useState, useRef } from "react";
import { Avatar, Layout, Input, Button, Spin, Modal, TimePicker } from "antd";
import { withRouter } from "react-router-dom";
import { ACCOUNT_TYPE } from "utils/consts";
import moment from "moment-timezone";
import { SendOutlined } from "@ant-design/icons";
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
import MenteeButton from "./MenteeButton.js";
import AvailabilityCalendar from "components/AvailabilityCalendar";
import { useTranslation } from "react-i18next";

function MessagesChatArea(props) {
  const { t } = useTranslation();
  const { Content, Header } = Layout;
  const { socket } = props;
  const { TextArea } = Input;
  const { profileId, isMentee, isMentor, isPartner } = useAuth();
  const [messageText, setMessageText] = useState("");
  const [accountData, setAccountData] = useState(null);
  const [isAlreadyInvited, setIsAlreadyInvited] = useState(false);
  const [isAlreadyInvitedByMentor, setIsAlreadyInvitedByMentor] =
    useState(false);
  const [updateContent, setUpdateContent] = useState(false);
  const [isInviteSent, setIsInviteSent] = useState(false);
  const [isOpenCalendarModal, setIsOpenCalendarModal] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [availabeInFuture, setAvailabeInFuture] = useState([]);
  const [bookedData, setBookedData] = useState({});
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
    scrollToBottom();
  }, [loading, messages]);

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
    setIsInviteSent(true);
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

  const sendMessage = (e) => {
    if (!messageText.replace(/\s/g, "").length) {
      return;
    }
    let dateTime = moment().utc();
    const msg = {
      body: messageText,
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
        <div className="start-convo">{t("messages.startConversation")}</div>
      </div>
    );
  }

  return (
    <div className="conversation-container">
      {accountData ? (
        <div className="messages-chat-area-header">
          <Avatar size={60} src={accountData.image?.url} />
          <div className="messages-chat-area-header-info">
            <div className="messages-chat-area-header-name">
              {isPartner ? accountData.organization : accountData.name}
            </div>
            <div className="messages-chat-area-header-title">
              {isPartner ? accountData.intro : accountData.professional_title}
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
                    type="default"
                    shape="round"
                    className="regular-button"
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
                    <Button
                      disabled={isInviteSent}
                      onClick={sendInvite}
                      type="default"
                      shape="round"
                      className="regular-button"
                    >
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
            messages.map((block) => {
              return (
                <div
                  className={`chatRight__items you-${
                    block.sender_id.$oid === profileId ? "sent" : "received"
                  }`}
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
                          className={`bubble-${
                            block.sender_id.$oid === profileId
                              ? "sent"
                              : "received"
                          }`}
                        >
                          {block.body}
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
              className="send-message-button"
              shape="circle"
              type="primary"
              ref={buttonRef}
              icon={<SendOutlined rotate={315} />}
              size={48}
            />
          </>
        )}
      </div>

      <Modal
        className="calendar-modal"
        title={t("messages.availabilityTitle")}
        visible={isOpenCalendarModal}
        onCancel={() => setIsOpenCalendarModal(false)}
        footer={[
          <MenteeButton
            key="clear"
            type="back"
            onClick={() => {
              setIsOpenCalendarModal(false);
            }}
            content={t("common.cancel")}
          />,
        ]}
      >
        <AvailabilityCalendar appointmentdata={appointments} />
      </Modal>
    </div>
  );
}
export default withRouter(MessagesChatArea);
