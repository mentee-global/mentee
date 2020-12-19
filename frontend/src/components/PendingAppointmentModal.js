import React, { useState, useEffect } from "react";
import { Modal } from "antd";
import MenteeButton from "./MenteeButton";
import "./css/Appointments.scss";
import "./css/AntDesign.scss";
import "./css/Modal.scss";
import { acceptAppointment, deleteAppointment } from "../utils/api";

function PendingAppointmentModal(props) {
  const [modalVisible, setModalVisible] = useState(false);

  async function handleAppointmentClick(id, didAccept) {
    if (didAccept) {
      await acceptAppointment(id);
    } else {
      await deleteAppointment(id);
    }
    props.setAppointmentClick(!props.appointmentClick);
  }

  return (
    <span>
      <MenteeButton
        content={<b>Review</b>}
        onClick={() => setModalVisible(true)}
      >
        Review
      </MenteeButton>
      <Modal
        title="Appointment Details"
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
        }}
        width="50%"
        style={{ overflow: "hidden" }}
        footer={
          <div style={{ textAlign: "center" }}>
            <MenteeButton
              content={"Accept"}
              border={"1px solid green"}
              onClick={() => handleAppointmentClick(props.id, true)}
            />
            <MenteeButton
              content={"Deny"}
              border={"1px solid red"}
              onClick={() => handleAppointmentClick(props.id, false)}
            />
          </div>
        }
      >
        Appointment details go here...
      </Modal>
    </span>
  );
}

export default PendingAppointmentModal;
