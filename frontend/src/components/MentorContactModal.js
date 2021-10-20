import React, { useState } from "react";
import { Modal } from "antd";
import { sendMenteeMentorEmail } from "../utils/api";
import MenteeButton from "./MenteeButton";
import ModalInput from "./ModalInput";

import "./css/AntDesign.scss";
import "./css/Modal.scss";
import "./css/MenteeModal.scss";

function MentorContactModal({ mentorId, menteeId, mentorName }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState(false);

  const closeModal = () => {
    setModalVisible(false);
    setMessage(null);
    setError(false);
  };

  return (
    <span>
      <MenteeButton
        content={<b>Contact Me</b>}
        borderOnClick
        onClick={() => {
          setModalVisible(true);
        }}
        width="120px"
        style={{ marginRight: "6px" }}
      />
      <Modal
        forceRender
        title="        " // Uses Unicode spaces to get desired heading
        visible={modalVisible}
        onCancel={() => closeModal()}
        className="contact-me-modal"
        style={{ overflow: "hidden" }}
        footer={null}
      >
        <div className="message-modal-container">
          <h1>Send message to {mentorName}</h1>
          <ModalInput
            style={styles.modalInput}
            type="textarea"
            handleClick={() => {}}
            onChange={(e) => setMessage(e.target.value)}
            value={message}
            large
          />
          <br />
          {error && (
            <>
              <b style={{ color: "red" }}>
                Failed to send message, please try again
              </b>
              <br />
            </>
          )}
          <MenteeButton
            width={120}
            content={"Send Message"}
            onClick={async () => {
              const res = await sendMenteeMentorEmail(
                mentorId,
                menteeId,
                message
              );
              if (!res) {
                console.log("Failed to send message");
                setError(true);
              } else {
                closeModal();
                setConfirmationModal(true);
              }
            }}
          />
        </div>
      </Modal>
      <Modal
        forceRender
        visible={confirmationModal}
        onCancel={() => closeModal()}
        className="contact-me-modal"
        style={{ overflow: "hidden" }}
        footer={null}
      >
        <div style={{height:"400px", width:"550px"}}>Thank you!</div>
      </Modal>
    </span>
  );
}

const styles = {
  modalInput: {
    marginTop: 20,
    width: "95%",
    overflow: "hidden",
  },
};

export default MentorContactModal;
