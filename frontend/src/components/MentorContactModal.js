import React, { useState } from "react";
import { Modal, Form, Select, Input, Button } from "antd";
import { sendMenteeMentorEmail } from "../utils/api";
import thankYouImage from "../resources/thankYou.png";

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
  const [form] = Form.useForm();
  const [openModal, setOpenModal] = useState(false);
  const [, setError] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState(false);

  // The mentor's specializations are only suggestions. The field is a
  // free-text tags input, so a mentee can always type her own interest area
  // even when there are no suggestions.
  const suggestedInterestAreas = Array.isArray(mentorSpecializations)
    ? mentorSpecializations.map((area) => ({ label: area, value: area }))
    : [];

  const closeModal = () => {
    setOpenModal(false);
    setError(false);
    form.resetFields();
  };

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
          form={form}
          layout="vertical"
          style={{ padding: "30px" }}
          onFinish={async (values) => {
            const res = await sendMenteeMentorEmail(
              mentorId,
              menteeId,
              values.interestAreas,
              values.message
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
            name="interestAreas"
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
              placeholder={t("mentorContactModal.areaInterestPlaceholder")}
              style={{ minWidth: "100px" }}
              options={suggestedInterestAreas}
            />
          </Form.Item>
          <Form.Item
            label={t("mentorContactModal.introPrompt")}
            name="message"
            style={{ paddingTop: "12px" }}
            rules={[
              {
                required: true,
                message: t("mentorContactModal.introPromptValidate"),
              },
            ]}
          >
            <Input.TextArea
              placeholder={t("mentorContactModal.introExample")}
              style={styles.modalInput}
              autoSize={{ minRows: 3 }}
            />
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
            alt=""
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
