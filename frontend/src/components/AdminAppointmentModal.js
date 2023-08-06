import React from "react";
import { Modal } from "antd";
import {
  StarOutlined,
  EnvironmentOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import "./css/AdminAppointments.scss";

const getTopics = (data) => {
  if (data.topic) {
    return data.topic;
  } else {
    return data.specialist_categories.join(", ");
  }
};

function AdminAppointmentModal({ data, visible, dateFormat, status, onClose }) {
  const getContactPermissions = () => {
    if (!data) {
      return;
    }

    const allowTexts = data.appointment.allow_texts;
    const allowCalls = data.appointment.allow_calls;

    if (allowCalls && allowTexts) {
      return "Allows calls and texts";
    } else if (allowCalls) {
      return "Allows calls";
    } else if (allowTexts) {
      return "Allows texts";
    } else {
      return "Not allowed to call or text";
    }
  };

  return (
    <div>
      <Modal
        open={visible}
        title="Appointment Details"
        footer={null}
        width="40%"
        onCancel={onClose}
      >
        <div className="modal-body">
          <div className="modal-header">
            <div className="modal-date">
              <div className="modal-date-text">
                {dateFormat && dateFormat.date}
              </div>
              <div className="modal-date-text">
                {dateFormat && dateFormat.time}
              </div>
            </div>
            <div>
              <div className="modal-status">
                {status && `${status.text} `}
                {status && status.icon}
              </div>
              <div className="modal-contact">
                {data ? getContactPermissions() : ""} <br />
                {data && data.appointment.phone_number}
                <br />
                <a>{data?.appointment.email}</a>
                <br />
              </div>
            </div>
          </div>
          <div className="modal-info-body">
            <div className="modal-info">
              <div className="modal-info-header" style={{ fontSize: ".9em" }}>
                Mentor
              </div>
              <div style={{ fontSize: "1.5em", fontWeight: "bold" }}>
                {data?.mentor}
              </div>
              <div className="modal-info-header" style={{ fontSize: ".9em" }}>
                Mentee
              </div>
              <div style={{ fontSize: "1.5em", fontWeight: "bold" }}>
                {data?.appointment.name}
              </div>
              <div className="modal-info-text">
                {`${data?.appointment.age} \u00b7 `}
                {`${data?.appointment.gender} `}
                {`\u00b7 ${data?.appointment.organization}`}
              </div>
              <div className="modal-info-text">
                <MessageOutlined />{" "}
                {data && data.appointment.languages.join(" \u00b7 ") /*Middot*/}
              </div>
              <div className="modal-info-text">
                <EnvironmentOutlined /> {data && data.appointment.location}
              </div>
              <div className="modal-topic">
                <div>
                  <StarOutlined /> Meeting Topic:
                </div>
                <div>{data && getTopics(data.appointment)}</div>
              </div>
            </div>
            <div className="modal-note">
              <div style={{ color: "#a58123", fontWeight: "bold" }}>
                Note from mentee:
              </div>
              <div>{data && data.appointment.message}</div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AdminAppointmentModal;
