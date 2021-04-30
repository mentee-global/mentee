import React, { useState, useEffect } from "react";
import { Modal } from "antd";
import { fetchMenteeByID } from "utils/api";
import MenteeButton from "./MenteeButton";
import { EnvironmentOutlined, CommentOutlined } from "@ant-design/icons";

import "./css/Appointments.scss";

function AppointmentInfo(props) {
  const [mentee, setMentee] = useState({});

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
    return languages.join(" • ");
  };

  const getSubtext = (gender, organization) => {
    var subtextInfo = [gender];
    if (organization !== undefined) {
      subtextInfo.push(organization);
    }
    return subtextInfo.join(" • ");
  };

  const displayButtons = () => {
    if (props.needButtons) {
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
      return null;
    }
  };

  const pendingOrUpcoming = () => {
    if (props.needButtons) {
      return (
        <div className="ar-status">
          pending<span className="pending-dot"></span>
        </div>
      );
    } else {
      return (
        <div className="ar-status">
          upcoming<span className="upcoming-dot"></span>
        </div>
      );
    }
  };

  const allowsContact = (allow_calls, allow_texts, phone_number) => {
    if (!phone_number) {
      return <div className="ar-phone">No Phone Number</div>;
    }
    if (allow_calls && allow_texts) {
      return (
        <div>
          <div className="ar-phone">Allows calls/texts</div>
          <div className="ar-phone">Call/text: {phone_number}</div>
          <div className="ar-email">{mentee.email}</div>
        </div>
      );
    } else if (allow_calls) {
      return (
        <div>
          <div className="ar-phone">Allows calls</div>
          <div className="ar-phone">Call: {phone_number}</div>
          <div className="ar-email">{mentee.email}</div>
        </div>
      );
    } else if (allow_texts === true) {
      return (
        <div>
          <div className="ar-phone">Allows texts</div>
          <div className="ar-phone">Text: {phone_number}</div>
          <div className="ar-email">{mentee.email}</div>
        </div>
      );
    }
    return <div className="ar-email-only">{mentee.email}</div>;
  };

  return (
    <Modal
      visible={props.modalVisible}
      title="Appointment Details"
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
        <div className="ar-categories-title">Seeking help in:</div>
        <div className="ar-categories">{props.modalAppointment.topic}</div>
        <div className="ar-goals-title">Note:</div>
        <div className="ar-goals">{props.modalAppointment.message}</div>
      </div>
    </Modal>
  );
}

export default AppointmentInfo;
