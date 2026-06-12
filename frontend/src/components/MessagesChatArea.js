import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import {
  Avatar,
  Input,
  Button,
  Spin,
  Modal,
  theme,
  Drawer,
  message as antdMessage,
} from "antd";
import { withRouter, NavLink } from "react-router-dom";
import { ACCOUNT_TYPE } from "utils/consts";
import moment from "moment-timezone";
import {
  SendOutlined,
  ArrowLeftOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useAuth } from "utils/hooks/useAuth";
import {
  fetchAccountById,
  sendNotifyUnreadMessage,
  sendInviteMail,
  fetchAppointmentsByMentorId,
  fetchAppointmentsByMenteeId,
  fetchAvailability,
  downloadBlob,
  getLibraryFile,
} from "utils/api";
import { formatAppointments } from "utils/dateFormatting";
import MenteeAppointmentModal from "./MenteeAppointmentModal";
import socketInvite from "utils/socket";
import AvailabilityCalendar from "components/AvailabilityCalendar";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from "react-responsive";
import { css } from "@emotion/css";

const asArray = (value) => (Array.isArray(value) ? value : []);
const objectId = (value) => value?.$oid || value;

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
  // True when the conversation counterpart's profile no longer resolves (the
  // account was deleted). We keep the history visible but block replying.
  const [deletedAccount, setDeletedAccount] = useState(false);
  const [isAlreadyInvited, setIsAlreadyInvited] = useState(false);
  const [isAlreadyInvitedByMentor, setIsAlreadyInvitedByMentor] =
    useState(false);
  const [updateContent, setUpdateContent] = useState(false);
  const [isOpenCalendarModal, setIsOpenCalendarModal] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [availabeInFuture, setAvailabeInFuture] = useState([]);
  const [bookedData, setBookedData] = useState({});
  const [, setRefresh] = useState(false);
  const isMobile = useMediaQuery({ query: `(max-width: 761px)` });
  var total_index = 0;
  const {
    messages: rawMessages,
    activeMessageId,
    otherId,
    userType,
    loading,
    isBookingVisible,
    inviteeId,
    restrictedPartners,
    user,
    hasMore,
    loadingOlder,
    loadOlderMessages,
  } = props;
  const messages = asArray(rawMessages);
  const safeRestrictedPartners = asArray(restrictedPartners);
  const messagesEndRef = useRef(null);
  const buttonRef = useRef(null);
  // Scroll container for the message list + state used to keep the viewport
  // anchored when older messages are prepended during infinite scroll.
  const conversationRef = useRef(null);
  const scrollAnchorRef = useRef(null);
  const prevFirstIdRef = useRef(undefined);
  const prevCountRef = useRef(0);
  // Synchronous lock so rapid scroll events can't fire overlapping fetches
  // before the loadingOlder state has propagated.
  const loadingOlderLockRef = useRef(false);
  const scrollToBottom = () => {
    if (messagesEndRef.current != null) {
      // Jump instantly rather than smooth-scrolling. A smooth scroll from the
      // top animates through scrollTop<=60, which trips the load-older handler
      // and eagerly fetches a second page on every thread open. Landing directly
      // at the newest message is also the expected chat behaviour.
      messagesEndRef.current.scrollIntoView({
        behavior: "auto",
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

  const handleScroll = () => {
    const container = conversationRef.current;
    if (!container || !hasMore || loading || loadingOlderLockRef.current)
      return;
    if (container.scrollTop <= 60) {
      loadingOlderLockRef.current = true;
      // Snapshot distance-from-bottom (invariant to content prepended at the
      // top, and to the transient "loading older" spinner) so the layout effect
      // can keep the user pinned to the same message after the page prepends.
      scrollAnchorRef.current = {
        scrollBottom: container.scrollHeight - container.scrollTop,
      };
      Promise.resolve(loadOlderMessages && loadOlderMessages()).finally(() => {
        loadingOlderLockRef.current = false;
      });
    }
  };

  useEffect(() => {
    // fetchAccount needs userType (the counterparty's role) and otherId.
    // Skip until both are set — otherwise we'd hit /account/<id> without
    // account_type and the backend returns 422.
    if (userType == null || !otherId) return;
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
        if (
          otherId &&
          same_kind_user_ids.includes(otherId) &&
          otherId.length > 3
        ) {
          account = await fetchAccountById(otherId, userType);
        }
      } else {
        if (safeRestrictedPartners.length > 0) {
          var restricted_user_ids = [];
          safeRestrictedPartners.map((partner_item) => {
            if (partner_item.assign_mentors) {
              asArray(partner_item.assign_mentors).map((assign_item) => {
                restricted_user_ids.push(assign_item.id);
                return false;
              });
            }
            if (partner_item.assign_mentees) {
              asArray(partner_item.assign_mentees).map((assign_item) => {
                restricted_user_ids.push(assign_item.id);
                return false;
              });
            }
            return false;
          });
          if (
            otherId &&
            otherId.length > 3 &&
            !restricted_user_ids.includes(otherId)
          ) {
            account = await fetchAccountById(otherId, userType);
          }
        } else {
          if (otherId && otherId.length > 3) {
            account = await fetchAccountById(otherId, userType);
          }
        }
      }
      if (account) {
        setAccountData(account);
        setDeletedAccount(false);
        if (parseInt(userType, 10) === ACCOUNT_TYPE.MENTEE) {
          setIsAlreadyInvitedByMentor(
            asArray(account.favorite_mentors_ids).indexOf(otherId) >= 0
          );
        }
      } else if (otherId && otherId.length > 3) {
        // Counterpart profile is gone (deleted account): keep history but mark
        // it deleted so the input is replaced with a notice.
        setAccountData(null);
        setDeletedAccount(true);
      }
      if (parseInt(userType, 10) === ACCOUNT_TYPE.MENTOR) {
        var profileAcount = await fetchAccountById(
          profileId,
          ACCOUNT_TYPE.MENTEE
        );
        if (profileAcount) {
          setIsAlreadyInvited(
            asArray(profileAcount.favorite_mentors_ids).indexOf(otherId) >= 0
          );
        }
      }
    }
    if (accountData && props.paused_flag !== accountData.paused_flag) {
      var temp = accountData;
      accountData.paused_flag = props.paused_flag;
      setAccountData(temp);
      setRefresh((r) => !r);
    }
    fetchAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateContent, otherId, messages]);

  // Decide how to position the scroll after a messages change:
  // - prepend (older page loaded at top): restore the prior offset so the
  //   message the user was reading stays in place instead of jumping.
  // - otherwise (initial load / sent or received message): jump to the bottom,
  //   or to a deep-linked message when ?message_id is present.
  useLayoutEffect(() => {
    const container = conversationRef.current;
    const count = messages?.length || 0;
    const firstId = messages?.[0]?._id?.$oid;
    const grewAtFront =
      count > prevCountRef.current &&
      firstId !== prevFirstIdRef.current &&
      scrollAnchorRef.current != null;
    prevCountRef.current = count;
    prevFirstIdRef.current = firstId;

    if (grewAtFront && container) {
      container.scrollTop =
        container.scrollHeight - scrollAnchorRef.current.scrollBottom;
      scrollAnchorRef.current = null;
      return;
    }
    scrollAnchorRef.current = null;

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
        tmp_avails = asArray(formattedAppointments["upcoming"]);
      }
      if (isMentee) {
        asArray(formattedAppointments["pending"]).map((item) => {
          tmp_avails.push(item);
          return true;
        });

        asArray(formattedAppointments["upcoming"]).map((item) => {
          tmp_avails.push(item);
          return true;
        });
      }
      setAppointments(tmp_avails);
      if (tmp_avails) {
        tmp_avails.map((item) => {
          asArray(item.appointments).map((appoint_item) => {
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
    // Availability is a mentor-only concept; mentees don't have one to fetch.
    if (!isMentor) return;
    const availability_data = await fetchAvailability(profileId);
    const now = moment();

    const future_availables = [];
    if (availability_data) {
      const availability = asArray(availability_data.availability);
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
    if (!profileId) return;
    if (isOpenCalendarModal === false) {
      getAppointments();
      getAvailableInFuture();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpenCalendarModal, profileId]);

  const handleUpdateAccount = () => {
    setUpdateContent(!updateContent);
  };

  const handleSendAck = (response, onDelivered, onHeld) => {
    if (response?.success === false) {
      antdMessage.error(response.message || "Message could not be sent");
      return;
    }
    if (response?.held) {
      if (onHeld) {
        onHeld();
      } else {
        antdMessage.error(t("messages.policyBlocked"));
      }
      return;
    }
    onDelivered();
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
    socket.emit("send", msg, (response) =>
      handleSendAck(response, () => {
        msg["sender_id"] = { $oid: msg["sender_id"] };
        msg["recipient_id"] = { $oid: msg["recipient_id"] };
        msg.time = moment().local().format("LLL");
        props.addMyMessage(msg);
        setMessageText("");
        getAppointments();
        getAvailableInFuture();
      })
    );
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
    let dateTime = moment().utc();
    var availabes_in_future = [];
    asArray(availabeInFuture).map((avail_item, index) => {
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
    socket.emit("send", msg, (response) =>
      handleSendAck(response, () => {
        socketInvite.emit("invite", inviteMsg);
        setTimeout(() => {
          sendInviteMail(activeMessageId, profileId, availabes_in_future);
        }, 1000);
        msg["sender_id"] = { $oid: msg["sender_id"] };
        msg["recipient_id"] = { $oid: msg["recipient_id"] };
        msg.time = moment().local().format("LLL");
        props.addMyMessage(msg);
        setMessageText("");
      })
    );
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
    const currentMessage = messageText;
    if (!currentMessage.trim().length) {
      return;
    }
    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const wireMsg = {
      body: currentMessage,
      message_read: false,
      sender_id: profileId,
      recipient_id: activeMessageId,
      time: moment().utc(),
    };
    // Render the sender's message instantly (optimistic) and clear the input;
    // moderation runs in the background and we reconcile on the ack below.
    props.addMyMessage({
      _tempId: tempId,
      body: currentMessage,
      message_read: false,
      sender_id: { $oid: profileId },
      recipient_id: { $oid: activeMessageId },
      time: moment().local().format("LLL"),
      pending: true,
    });
    setMessageText("");
    socket.emit("send", wireMsg, (response) => {
      if (response?.success === false) {
        antdMessage.error(response.message || "Message could not be sent");
        props.removeMyMessage(tempId);
        return;
      }
      if (response?.held) {
        // Flagged: keep it in the sender's thread (dimmed, with an alert) but
        // never deliver it to the recipient.
        props.updateMyMessage(tempId, { pending: false, held: true });
        return;
      }
      props.updateMyMessage(tempId, { pending: false });
      setTimeout(() => {
        sendNotifyUnreadMessage(activeMessageId);
      }, 1000);
    });
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
      /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gi;
    return String(text || "").replace(
      urlPattern,
      '<a href="$1" target="_blank">$1</a>'
    );
  };

  const HtmlContent = ({ content }) => {
    const handleDownload = async (id, file_name) => {
      let response = await getLibraryFile(id);
      downloadBlob(response, file_name);
    };
    const downloadFile = (message_body) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(message_body, "text/html");

      // Get the <a> element
      const link = doc.querySelector("a");
      if (link) {
        const altValue = link.getAttribute("alt"); // "Example Link"
        const file_name = link.textContent; // "Click here"

        if (altValue && altValue.includes("download_file_")) {
          let file_id = altValue.replace("download_file_", "");
          handleDownload(file_id, file_name);
        }
      }
    };
    return (
      <div
        onClick={() => downloadFile(content)}
        style={{
          wordBreak: isMobile ? "break-word" : "normal",
          fontSize: "15px",
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
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
      ) : deletedAccount ? (
        <div className="messages-chat-area-header">
          {isMobile && (
            <div
              onClick={showSideBar}
              style={{ cursor: "pointer", width: "20px", fontSize: "16px" }}
            >
              <ArrowLeftOutlined />
            </div>
          )}
          <Avatar size={60} icon={<UserOutlined />} />
          <div className="messages-chat-area-header-info">
            <div className="messages-chat-area-header-name">
              {t("messages.deletedAccount")}
            </div>
          </div>
        </div>
      ) : (
        <div></div>
      )}
      <div
        className="conversation-content"
        ref={conversationRef}
        onScroll={handleScroll}
      >
        <Spin spinning={loading}>
          {loadingOlder && (
            <div style={{ textAlign: "center", padding: "8px" }}>
              <Spin size="small" />
            </div>
          )}
          {(accountData || deletedAccount) &&
            messages.map((block, index) => {
              const senderId = objectId(block?.sender_id);
              const availableSlots = asArray(block?.availabes_in_future);
              return (
                <div
                  key={block?._id?.$oid || index}
                  className={`chatRight__items you-${
                    senderId === profileId ? "sent" : "received"
                  }`}
                  id={block?._id?.$oid || index}
                >
                  <div
                    className={`chatRight__inner  message-area ${
                      senderId !== profileId ? "flex-start" : "flex-end"
                    }`}
                    data-chat="person1"
                  >
                    <div className="flex">
                      {senderId !== profileId && (
                        <span>
                          {accountData ? (
                            <Avatar src={accountData.image?.url} />
                          ) : (
                            <Avatar icon={<UserOutlined />} />
                          )}{" "}
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
                            ${senderId === profileId
                              ? styles.bubbleSent
                              : styles.bubbleReceived}
                            ${block?.held
                              ? "opacity: 0.55;"
                              : block?.pending
                              ? "opacity: 0.7;"
                              : ""}
                          `}
                        >
                          <HtmlContent content={linkify(block?.body)} />
                          {availableSlots.length > 0 &&
                            availableSlots.map((available_item) => {
                              total_index++;
                              return (
                                <React.Fragment key={total_index}>
                                  {senderId === profileId ||
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
                                      mentor_name={accountData?.name}
                                      availability={availableSlots}
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
                                </React.Fragment>
                              );
                            })}
                        </div>
                      </div>
                    </div>

                    <span style={{ opacity: "40%" }}>
                      {block?.time
                        ? block.time
                        : moment
                            .utc(block?.created_at?.$date)
                            .local()
                            .format("LLL")}
                    </span>
                    {block?.held && (
                      <div
                        className={css`
                          margin-top: 4px;
                          max-width: 360px;
                          padding: 6px 10px;
                          border-radius: 6px;
                          background: #fff7e6;
                          border: 1px solid #ffe7ba;
                          font-size: 12px;
                          line-height: 1.35;
                          color: #ad6800;
                        `}
                      >
                        {t("messages.policyBlocked")}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </Spin>
        <div ref={messagesEndRef} />
      </div>
      <div className="conversation-footer">
        {!accountData && deletedAccount && (
          <div style={{ width: "100%", textAlign: "center", opacity: "60%" }}>
            {t("messages.deletedAccountNotice")}
          </div>
        )}
        {accountData && (
          <>
            <TextArea
              className="message-input"
              placeholder={t("messages.sendMessagePlaceholder")}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              autoSize={{ minRows: 1, maxRows: 3 }}
            />
            {!accountData.paused_flag && !user?.paused_flag && (
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
                {t("messages.send")}
              </Button>
            )}
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
