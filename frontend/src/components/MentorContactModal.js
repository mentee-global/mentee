import React, { useState } from "react";
import { Modal, Radio, Space, Form, Select } from "antd";
import { sendMenteeMentorEmail } from "../utils/api";
import { SPECIALIZATIONS } from "../utils/consts.js";
import MenteeButton from "./MenteeButton";
import ModalInput from "./ModalInput";

import "./css/AntDesign.scss";
import "./css/Modal.scss";
import "./css/MenteeModal.scss";

function MentorContactModal({ mentorId, menteeId, mentorName }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [responseEmail, setResponseEmail] = useState("");
  const [interestAreas, setInterestAreas] = useState([]);
  const [communicationMethod, setCommunicationMethod] = useState("");
  const [error, setError] = useState(false);

  const closeModal = () => {
    setModalVisible(false);
    setMessage(null);
    setError(false);
  };

  const addInterestArea = (e) => {
    setInterestAreas(e);
  };
  const filteredOptions = SPECIALIZATIONS.filter(
    (o) => !interestAreas.includes(o)
  );
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
        <h1>Reach Out to {mentorName}</h1>
        <h2>your name and email will be sent to this mentor</h2>
        <Form>
          <Form.Item
            label="select"
            name="Choose Interest Areas"
            rules={[
              { required: true, message: "Please select an interest area!" },
            ]}
          >
            <Select
              mode="tags"
              value={interestAreas}
              onChange={addInterestArea}
            >
              {filteredOptions.map((item) => (
                <Select.Option key={item} value={item}>
                  {item}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="radio"
            name="What is your preferred communication method?"
            rules={[
              {
                required: true,
                message: "Please select communication method!",
              },
            ]}
          >
            <Radio.Group
              onChange={(e) => setCommunicationMethod(e.target.value)}
            >
              <Space direction="vertical">
                <Radio value={"Email"}>Email</Radio>
                <Radio value={"Phone"}>Phone</Radio>
                <Radio value={"WhatsApp"}>WhatsApp</Radio>
                <Radio value={"Other"}>Other</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
          <div className="message-modal-container">
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
                  responseEmail,
                  interestAreas,
                  communicationMethod,
                  message
                );
                if (!res) {
                  console.log("Failed to send message");
                  setError(true);
                } else {
                  closeModal();
                }
              }}
            />
          </div>
        </Form>
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
