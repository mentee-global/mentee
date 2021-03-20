import React from "react";
import { Modal } from "antd";
import {
  StarOutlined,
  EnvironmentOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import "./css/AdminAppointments.scss";

function AdminAppointmentModal({ data, visible, dateFormat, status }) {
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
        visible={visible}
        title="Appointment Details"
        footer={null}
        width="40%"
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
                <a>{data.appointment.email}</a>
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
                {data.mentor}
              </div>
              <div className="modal-info-header" style={{ fontSize: ".9em" }}>
                Mentee
              </div>
              <div style={{ fontSize: "1.5em", fontWeight: "bold" }}>
                {data.appointment.name}
              </div>
              <div className="modal-info-text">
                {`${data.appointment.age} • `}
                {`${data.appointment.gender} `}
                {`• ${data.appointment.organization}`}
              </div>
              <div className="modal-info-text">
                <MessageOutlined />{" "}
                {data &&
                  data.appointment.languages.map((value, i) => {
                    return i < data.appointment.languages.length - 1
                      ? `${value} • `
                      : `${value}`;
                  })}
              </div>
              <div className="modal-info-text">
                <EnvironmentOutlined /> {data && data.appointment.location}
              </div>
              <div className="modal-topic">
                <div>
                  <StarOutlined /> Meeting Topic:
                </div>
                <div>
                  {data &&
                    data.appointment.specialist_categories.map(
                      (category, i) => {
                        return i <
                          data.appointment.specialist_categories.length - 1
                          ? `${category}, `
                          : category;
                      }
                    )}
                </div>
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
