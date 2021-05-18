import React, { useState, useEffect } from "react";
import { Form, Modal, Alert, message } from "antd";
import moment from "moment";
import ModalInput from "./ModalInput";
import MenteeButton from "./MenteeButton";
import { MESSAGE_FORM_KEYS } from "../utils/consts";
import { sendMessage } from "../utils/api";
import "./css/AntDesign.scss";
import "./css/Modal.scss";
import "./css/MenteeModal.scss";

// Form validateMessages sends values here
const validationMessage = {
  required: "Please enter your ${name}",
  types: {
    email: "Not a valid email",
  },
};

const antdMessage = message;

function PublicMessageModal(props) {
  const [form] = Form.useForm();
  const [formModalVisible, setFormModalVisible] = useState(false);
  const numInputs = 4;
  const [inputClicked, setInputClicked] = useState(
    new Array(numInputs).fill(false)
  ); // each index represents an input box, respectively
  const [name, setName] = useState();
  const [email, setEmail] = useState();
  const [website, setWebsite] = useState();
  const [message, setMessage] = useState();
  const mentorID = props.mentorID;
  const menteeID = props.menteeID;

  // useState values
  const values = [
    message,
    name,
    mentorID,
    props.menteeName,
    menteeID,
    email,
    website,
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
        content="Send Message"
        onClick={() => {
          setFormModalVisible(true);
        }}
      />
      <Modal
        forceRender
        title="Message"
        visible={formModalVisible}
        onCancel={closeModals}
        className="appointment-info-modal"
        style={{ overflow: "hidden" }}
        footer={
          <MenteeButton
            width="8em"
            content="Send"
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
          validateMessages={validationMessage}
          scrollToFirstError
        >
          <div className="modal-container" style={{ height: "fit-content" }}>
            <div className="modal-mentee-inner-container">
              <div className="flex flex-row">
                <div className="modal-mentee-appointment-col-container">
                  <div className="modal-mentee-appointment-header-text">
                    Your Name*
                  </div>
                  <Form.Item
                    name="name"
                    rules={[
                      {
                        required: true,
                      },
                    ]}
                  >
                    <ModalInput
                      style={styles.modalInput}
                      value={name}
                      type="text"
                      clicked={inputClicked[0]}
                      index={0}
                      handleClick={handleClick}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </Form.Item>
                  <div className="modal-mentee-appointment-header-text">
                    Your Email*
                  </div>
                  <Form.Item
                    name="email"
                    rules={[
                      {
                        type: "email",
                        required: true,
                      },
                    ]}
                  >
                    <ModalInput
                      style={styles.modalInput}
                      value={email}
                      type="text"
                      clicked={inputClicked[1]}
                      index={1}
                      handleClick={handleClick}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Form.Item>

                  <div className="modal-mentee-appointment-header-text">
                    Message*
                  </div>
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
                  <div className="modal-mentee-appointment-header-text">
                    Link your profile or website!{" "}
                    <a style={{ color: "grey" }}>(Optional)</a>
                  </div>
                  <Form.Item name="website">
                    <ModalInput
                      style={styles.modalInput}
                      value={website}
                      type="text"
                      clicked={inputClicked[3]}
                      index={3}
                      handleClick={handleClick}
                      onChange={(e) => setWebsite(e.target.value)}
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
  contactInput: {
    marginTop: 16,
    width: "95%",
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
