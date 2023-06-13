import React, { useState, useEffect } from "react";
import { Form, Modal, message } from "antd";
import moment from "moment";
import ModalInput from "./ModalInput";
import MenteeButton from "./MenteeButton";
import { MESSAGE_FORM_KEYS } from "../utils/consts";
import { useSelector } from "react-redux";
import { sendMessage } from "../utils/api";
import "./css/AntDesign.scss";
import "./css/Modal.scss";
import "./css/MenteeModal.scss";
import { useTranslation } from "react-i18next";

const antdMessage = message;

function PublicMessageModal(props) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [formModalVisible, setFormModalVisible] = useState(false);
  const numInputs = 4;
  const [inputClicked, setInputClicked] = useState(
    new Array(numInputs).fill(false)
  ); // each index represents an input box, respectively
  const user = useSelector((state) => state.user.user);
  const [message, setMessage] = useState();
  const mentorID = props.mentorID;
  const menteeID = props.menteeID;

  // useState values
  const values = [
    message,
    user?.name,
    mentorID,
    props.menteeName,
    menteeID,
    user?.email,
    user?.website ?? user?.linkedin ?? "",
  ];

  // Resets form fields on close
  useEffect(() => {
    if (formModalVisible) {
      form.resetFields();
    }
  }, [formModalVisible, form]);

  function handleClick(index) {
    // Sets only the clicked input box to true to change color, else false
    let newClickedInput = new Array(numInputs).fill(false);
    newClickedInput[index] = true;
    setInputClicked(newClickedInput);
  }

  function closeModals() {
    setFormModalVisible(false);
  }

  async function handleBookAppointment() {
    const data = {};

    // Match keys to useState value
    for (let i = 0; i < values.length; i++) {
      if (values[i] !== undefined) {
        data[MESSAGE_FORM_KEYS[i]] = values[i];
      }
    }

    data["time"] = moment().format("YYYY-MM-DD, HH:mm:ssZZ");
    if (!(await sendMessage(data))) {
      antdMessage.error("failed to send message", 4);
      return;
    }
    setFormModalVisible(false);
    antdMessage.success("successfully sent message", 4);
  }

  return (
    <span>
      <MenteeButton
        style={{ fontWeight: "bold" }}
        content={t("commonProfile.sendMessage")}
        onClick={() => {
          setFormModalVisible(true);
        }}
      />
      <Modal
        forceRender
        title={t("common.message")}
        visible={formModalVisible}
        onCancel={closeModals}
        className="appointment-info-modal"
        style={{ overflow: "hidden" }}
        footer={
          <MenteeButton
            width="8em"
            content={t("common.submit")}
            htmlType="submit"
            form="message-form"
            style={{ justifySelf: "flex-end" }}
          />
        }
      >
        <Form
          id="message-form"
          form={form}
          onFinish={() => handleBookAppointment()}
          scrollToFirstError
        >
          <div className="modal-container" style={{ height: "fit-content" }}>
            <div className="modal-mentee-inner-container">
              <div className="flex flex-row">
                <div className="modal-mentee-appointment-col-container">
                  <Form.Item
                    name="message"
                    rules={[
                      {
                        required: true,
                      },
                    ]}
                  >
                    <ModalInput
                      style={{ ...styles.modalInput, ...styles.messageInput }}
                      type="textarea"
                      maxRows={11}
                      clicked={inputClicked[2]}
                      index={2}
                      handleClick={handleClick}
                      onChange={(e) => setMessage(e.target.value)}
                      value={message}
                    />
                  </Form.Item>
                </div>
              </div>
            </div>
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
  alertToast: {
    color: "#FF0000",
    display: "inline-block",
    marginRight: 10,
  },
  messageInput: {
    height: "30vh",
  },
};

export default PublicMessageModal;
