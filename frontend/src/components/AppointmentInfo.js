import React, { useState, useEffect } from "react";
import { Modal } from "antd";
import { useSelector } from "react-redux";
import { fetchMenteeByID } from "utils/api";
import MenteeButton from "./MenteeButton";
import { EnvironmentOutlined, CommentOutlined } from "@ant-design/icons";
import { getTranslatedOptions } from "utils/translations";

import "./css/Appointments.scss";
import { useTranslation } from "react-i18next";

// TODO: Remove this and all of the dependent variables
const Tabs = Object.freeze({
  upcoming: {
    title: "All Upcoming",
    key: "upcoming",
  },
  pending: {
    title: "All Pending",
    key: "pending",
  },
  past: {
    title: "All Past",
    key: "past",
  },
  availability: {
    title: "Availability",
    key: "availability",
  },
});

function AppointmentInfo(props) {
  const { t } = useTranslation();
  const [mentee, setMentee] = useState({});
  const options = useSelector((state) => state.options);

  useEffect(() => {
    async function getMentee() {
      const menteeInfo = await fetchMenteeByID(props.modalAppointment.menteeID);
      if (menteeInfo) {
        setMentee(menteeInfo);
      }
    }
    getMentee();
  }, [props.modalAppointment]);

  const getLanguages = (languages) => {
    return getTranslatedOptions(languages, options.languages).join(" • ");
  };

  const getSubtext = (gender, organization) => {
    var subtextInfo = [gender];
    if (organization !== undefined) {
      subtextInfo.push(organization);
    }
    return subtextInfo.join(" • ");
  };

  const displayButtons = () => {
    if (props.current_tab.key === Tabs.pending.key) {
      return (
        <div style={{ textAlign: "center" }}>
          <MenteeButton
            content={"Accept"}
            border={"1px solid green"}
            onClick={() =>
              props.handleAppointmentClick(props.modalAppointment.id, true)
            }
          />
          <MenteeButton
            content={"Deny"}
            border={"1px solid red"}
            onClick={() =>
              props.handleAppointmentClick(props.modalAppointment.id, false)
            }
          />
        </div>
      );
    } else {
      return (
        <div style={{ textAlign: "center" }}>
          <MenteeButton
            content={t("common.deny")}
            border={"1px solid red"}
            onClick={() =>
              props.handleAppointmentClick(props.modalAppointment.id, false)
            }
          />
        </div>
      );
    }
  };

  const pendingOrUpcoming = () => {
    if (props.current_tab === Tabs.pending) {
      return (
        <div className="ar-status">
          pending<span className="pending-dot"></span>
        </div>
      );
    } else {
      return (
        <div className="ar-status">
          {t("appointmentStatus.accepted")}
          <span className="upcoming-dot"></span>
        </div>
      );
    }
  };

  const allowsContact = (allow_calls, allow_texts, phone_number) => {
    if (!phone_number) {
      return (
        <div>
          <div className="ar-phone">{t("mentorAppointmentPage.noPhone")}</div>
          <div className="ar-email">{mentee.email}</div>
        </div>
      );
    }
    if (allow_calls && allow_texts) {
      return (
        <div>
          <div className="ar-phone">
            {t("mentorAppointmentPage.allowCallText")}
          </div>
          <div className="ar-phone">{phone_number}</div>
          <div className="ar-email">{mentee.email}</div>
        </div>
      );
    } else if (allow_calls) {
      return (
        <div>
          <div className="ar-phone">{t("mentorAppointmentPage.allowCall")}</div>
          <div className="ar-phone">{phone_number}</div>
          <div className="ar-email">{mentee.email}</div>
        </div>
      );
    } else if (allow_texts) {
      return (
        <div>
          <div className="ar-phone">{t("mentorAppointmentPage.allowText")}</div>
          <div className="ar-phone">{phone_number}</div>
          <div className="ar-email">{mentee.email}</div>
        </div>
      );
    }
    return <div className="ar-email-only">{mentee.email}</div>;
  };

  return (
    <Modal
      visible={props.modalVisible}
      title={t("sidebars.appointments")}
      width="449.91px"
      onCancel={() => props.setModalVisible(false)}
      footer={displayButtons()}
    >
      <div className="ar-modal-container">
        {pendingOrUpcoming()}
        <div>
          <div>
            {allowsContact(
              props.modalAppointment.allowCalls,
              props.modalAppointment.allowTexts,
              mentee.phone_number
            )}
          </div>
          <div className="ar-modal-title">
            {mentee.name}, {mentee.age}
          </div>
        </div>
        <div className="personal-info">
          <div className="ar-title-subtext">
            {getSubtext(mentee.gender, mentee.organization)}
          </div>
          <div className="ar-languages">
            <CommentOutlined className="ar-icon"></CommentOutlined>
            {getLanguages(mentee.languages || [])}
          </div>
          <div className="ar-location">
            <EnvironmentOutlined className="ar-icon"></EnvironmentOutlined>
            {mentee.location}
          </div>
        </div>
        <div className="ar-apt-date">{props.modalAppointment.date}</div>
        <div className="ar-apt-time">{props.modalAppointment.time}</div>
        <div className="vl"></div>
        <div className="ar-categories-title">
          {t("mentorAppointmentPage.seekingHelpIn")}:
        </div>
        <div className="ar-categories">
          {getTranslatedOptions(
            props.modalAppointment.topic,
            options.specializations
          )}
        </div>
        <div className="ar-goals-title">{t("mentorAppointmentPage.note")}:</div>
        <div className="ar-goals">{props.modalAppointment.message}</div>
      </div>
    </Modal>
  );
}

export default AppointmentInfo;
