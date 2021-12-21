import React, { useState } from "react";
import { Modal, Radio, Space, Form, Select, Input, Button } from "antd";
import { sendMenteeMentorEmail } from "../utils/api";
import { SPECIALIZATIONS } from "../utils/consts.js";
import MenteeButton from "./MenteeButton";
import ModalInput from "./ModalInput";
import thankYouImage from "../resources/thankYou.png";

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
  const [confirmationModal, setConfirmationModal] = useState(false);

  const closeModal = () => {
    setModalVisible(false);
    setMessage(null);
    setError(false);
    setInterestAreas([]);
    setCommunicationMethod(null);
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
        <Form
          layout="vertical"
          style={{ padding: "30px" }}
          onFinish={async () => {
            const res = await sendMenteeMentorEmail(
              mentorId,
              menteeId,
              responseEmail,
              interestAreas,
              communicationMethod,
              message
            );
            if (!res) {
              setError(true);
            } else {
              closeModal();
              setConfirmationModal(true);
            }
          }}
        >
          <Form.Item>
            <h1 className="modal-mentee-appointment-contact-header">
              Reach Out to {mentorName}
            </h1>
          </Form.Item>
          <Form.Item>
            <h3 className="modal-mentee-appointment-contact-description">
              Your name and email will be sent to this mentor
            </h3>
          </Form.Item>
          <Form.Item
            label="Choose Interest Areas"
            name="Choose Interest Areas"
            rules={[
              { required: true, message: "Please select an interest area!" },
            ]}
          >
            <Select
              mode="tags"
              value={interestAreas}
              onChange={addInterestArea}
              style={{ minWidth: "100px" }}
            >
              {filteredOptions.map((item) => (
                <Select.Option key={item} value={item}>
                  {item}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="Preferred communication method"
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
          <Form.Item
            label="Briefly introduce yourself and what you are looking to gain from a Mentor."
            name="Custom Message"
            style={{ paddingTop: "12px" }}
            rules={[
              { required: true, message: "Please write an introduction!" },
            ]}
          >
            <div className="message-modal-container">
              <Input.TextArea
                onChange={(e) => setMessage(e.target.value)}
                value={message}
                handleClick={() => {}}
                style={styles.modalInput}
              />
              <br />
            </div>
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="contact-me-submit-button"
            >
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        forceRender
        visible={confirmationModal}
        onCancel={() => setConfirmationModal(false)}
        className="modal-mentee-confirmation-modal"
        style={{ overflow: "hidden" }}
        footer={null}
      >
        <div className="modal-mentee-confirmation-content">
          <img
            className="modal-mentee-confirmation-modal-art"
            src={thankYouImage}
          />
          <div className="modal-mentee-confirmation-modal-text">
            <div className="modal-mentee-confirmation-modal-title">
              {" "}
              Thank you!{" "}
            </div>
            <div className="modal-mentee-confirmation-modal-body">
              Your mentor will be getting back to you soon! Feel free to browse
              the mentor page and reach out to other mentors.
            </div>
          </div>
        </div>
      </Modal>
    </span>
  );
}

const styles = {
  modalInput: {
    marginTop: -5,
    overflow: "hidden",
  },
};

export default MentorContactModal;
