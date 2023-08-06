import React, { useState } from "react";
import { Modal, Radio, Space, Form, Select, Input, Button } from "antd";
import { sendMenteeMentorEmail } from "../utils/api";
import MenteeButton from "./MenteeButton";
import thankYouImage from "../resources/thankYou.png";

import "./css/AntDesign.scss";
import "./css/Modal.scss";
import "./css/MenteeModal.scss";
import { useTranslation } from "react-i18next";

function MentorContactModal({
  mentorId,
  menteeId,
  mentorName,
  mentorSpecializations,
}) {
  const { t } = useTranslation();
  const [openModal, setOpenModal] = useState(false);
  const [message, setMessage] = useState("");
  const [responseEmail, setResponseEmail] = useState("");
  const [interestAreas, setInterestAreas] = useState([]);
  const [communicationMethod, setCommunicationMethod] = useState("");
  const [error, setError] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState(false);

  const closeModal = () => {
    setOpenModal(false);
    setMessage(null);
    setError(false);
    setInterestAreas([]);
    setCommunicationMethod(null);
  };

  const addInterestArea = (e) => {
    setInterestAreas(e);
  };
  const filteredOptions = mentorSpecializations
    ? mentorSpecializations.filter((o) => !interestAreas.includes(o))
    : [];

  return (
    <span>
      <Button
        type="primary"
        onClick={() => {
          setOpenModal(true);
        }}
        style={{ width: "120px" }}
      >
        {t("common.contactMe")}
      </Button>
      <Modal
        forceRender
        open={openModal}
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
              {t("mentorContactModal.reachOutTo", { mentorName: mentorName })}
            </h1>
          </Form.Item>
          <Form.Item>
            <h3 className="modal-mentee-appointment-contact-description">
              {t("mentorContactModal.basicInfoNotice")}
            </h3>
          </Form.Item>
          <Form.Item
            name="Choose Interest Areas"
            label={t("mentorContactModal.areaInterest")}
            rules={[
              {
                required: true,
                message: t("mentorContactModal.areaInterstValidate"),
              },
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
            name="Preferred communication method"
            label={t("mentorContactModal.communicationMethod")}
            style={{ paddingTop: "12px" }}
            rules={[
              {
                required: true,
                message: t("mentorContactModal.communicationMethodValidate"),
              },
            ]}
          >
            <Radio.Group
              onChange={(e) => setCommunicationMethod(e.target.value)}
            >
              <Space direction="vertical">
                <Radio value={"Email"}>{t("common.email")}</Radio>
                <Radio value={"Phone"}>{t("common.phone")}</Radio>
                <Radio value={"WhatsApp"}>{t("common.whatsapp")}</Radio>
                <Radio value={"Other"}>{t("common.other")}</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            label={t("mentorContactModal.introPrompt")}
            name="Custom Message"
            style={{ paddingTop: "12px" }}
            rules={[
              {
                required: true,
                message: t("mentorContactModal.introPromptValidate"),
              },
            ]}
          >
            <div className="message-modal-container">
              <Input.TextArea
                placeholder={t("mentorContactModal.introExample")}
                onChange={(e) => setMessage(e.target.value)}
                value={message}
                handleClick={() => {}}
                style={styles.modalInput}
                autoSize={{ minRows: 3 }}
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
              {t("common.submit")}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        forceRender
        open={confirmationModal}
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
              {t("mentorContactModal.thankYou")}{" "}
            </div>
            <div className="modal-mentee-confirmation-modal-body">
              {t("mentorContactModal.confirmationText")}
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
