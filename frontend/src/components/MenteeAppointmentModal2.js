import React, { useState } from "react";
import { Button, Modal, Checkbox, Avatar } from "antd";
import ModalInput from "./ModalInput";
import { UserOutlined, EditFilled, PlusCircleFilled } from "@ant-design/icons";
import {
  LANGUAGES,
  SPECIALIZATIONS,
  GENDERS,
  ETHNICITIES,
  AGES,
} from "../utils/consts";
import "./css/AntDesign.scss";
import "./css/Modal.scss";
import "./css/MenteeModal.scss";

function MenteeAppointmentModal2() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <div>
      <Button
        style={{ background: "#E4BB4F", color: "white" }}
        className="mentor-profile-edit-button"
        onClick={() => setModalVisible(true)}
      >
        Book Appointment
      </Button>
      <Modal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        width="50%"
        style={{ overflow: "hidden" }}
        footer={null}
      >
        <div className="modal-container-row">
          <div className="modal-mentee-appointment-info-container">

          </div>
          <div className="modal-mentee-appointment-calendar-container">

          </div>
        </div>
      </Modal>
    </div>
  );
}

const styles = {
  modalInput: {
    height: 65,
    marginTop: 20,
    width: "95%",
  },
  contactInput: {
    maxHeight: 60,
    marginTop: 16,
    width: "95%",
  },
  footer: {
    borderRadius: 13,
    marginRight: 15,
    backgroundColor: "#E4BB4F",
  },
};

export default MenteeAppointmentModal2;
