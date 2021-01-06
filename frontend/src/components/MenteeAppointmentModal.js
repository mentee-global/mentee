import React, { useState, useEffect } from "react";
import moment from "moment";
import { Form, Modal, Calendar, Avatar, Switch } from "antd";
import { UserOutlined } from "@ant-design/icons";
import ModalInput from "./ModalInput";
import MenteeButton from "./MenteeButton";
import { LANGUAGES, SPECIALIZATIONS, GENDERS, AGES } from "../utils/consts";
import { createAppointment } from "../utils/api";
import "./css/AntDesign.scss";
import "./css/Modal.scss";
import "./css/MenteeModal.scss";

// TODO: Temporary constants, fill in later
const sampleTimes = [
  "11-12pm",
  "2-3pm",
  "3-4pm",
  "5-6pm",
  "7-8pm",
  "9-10pm",
  "9-10pm",
  "9-10pm",
  "9-10pm",
  "9-10pm",
  "9-10pm",
  "9-10pm",
];
const validationMessage = {
  required: "Please enter your ${name}",
  types: {
    email: "Not a valid email",
  },
};
function MenteeAppointmentModal(props) {
  const [form] = Form.useForm();
  const [timeSlots, setTimeSlots] = useState([]);
  const [dayTimeSlots, setDayTimeSlots] = useState([]);
  const [appModalVisible1, setAppModalVisible1] = useState(false);
  const [appModalVisible2, setAppModalVisible2] = useState(false);
  const [numInputs, setNumInputs] = useState(11);
  const [inputClicked, setInputClicked] = useState(
    new Array(numInputs).fill(false)
  ); // each index represents an input box, respectively
  const [date, setDate] = useState();
  const [time, setTime] = useState();
  const [name, setName] = useState();
  const [ageRange, setAgeRange] = useState();
  const [gender, setGender] = useState();
  const [languages, setLanguages] = useState();
  const [specializations, setSpecializations] = useState();
  const [location, setLocation] = useState();
  const [organization, setOrganization] = useState();
  const [email, setEmail] = useState();
  const [phone, setPhone] = useState();
  const [canCall, setCanCall] = useState(false);
  const [canText, setCanText] = useState(false);
  const [message, setMessage] = useState();
  const mentorID = props.mentor_id;
  const fields = [
    "mentor_id",
    "name",
    "email",
    "phone_number",
    "languages",
    "age",
    "gender",
    "location",
    "specialist_categories",
    "message",
    "organization",
    "allow_calls",
    "allow_texts",
  ];

  const values = [
    mentorID,
    name,
    email,
    phone,
    languages,
    ageRange,
    gender,
    location,
    specializations,
    message,
    organization,
    canCall,
    canText,
  ];

  useEffect(() => {
    if (props.availability) {
      setTimeSlots(props.availability);
    }
  }, [props]);

  useEffect(() => {
    let daySlots = [];
    timeSlots.forEach((element) => {
      if (moment(element.start_time.$date).format("YYYY-MM-DD") === date) {
        daySlots.push(element);
      }
    });
    setDayTimeSlots(daySlots);
  }, [date]);

  function handleClick(index) {
    // Sets only the clicked input box to true to change color, else false
    let newClickedInput = new Array(numInputs).fill(false);
    newClickedInput[index] = true;
    setInputClicked(newClickedInput);
  }

  function handleDateChange(e) {
    setDate(moment(e._d).format("YYYY-MM-DD"));
  }

  function handleTimeChange(time) {
    setTime(time);
  }

  function closeModals() {
    setAppModalVisible1(false);
    setAppModalVisible2(false);
  }

  async function handleBookAppointment() {
    setAppModalVisible2(false);
    const appointment = {};
    for (let i = 0; i < values.length; i++) {
      if (values[i] !== undefined) {
        appointment[fields[i]] = values[i];
      }
    }
    appointment["accepted"] = false;
    appointment["timeslot"] = {
      start_time: moment(time.start_time.$date).format(),
      end_time: moment(time.end_time.$date).format(),
    };
    await createAppointment(appointment);
  }

  return (
    <div>
      <MenteeButton
        content="Book Appointment"
        onClick={() => setAppModalVisible1(true)}
      />
      <Modal
        forceRender
        title="        " // Uses Unicode spaces to get desired heading
        visible={appModalVisible1}
        onCancel={() => closeModals()}
        width="60%"
        style={{ overflow: "hidden" }}
        footer={null}
      >
        <div className="modal-container-row">
          <div className="modal-mentee-appointment-info-container">
            <Avatar
              className="modal-mentee-appointment-profile-icon"
              size={80}
              icon={<UserOutlined />}
            />
            <h3 className="bold">Mentoring Session with Bernie Sanders</h3>
            <h2 className="bold">Select a Date & Time</h2>
          </div>
          <div className="modal-mentee-appointment-datetime-container">
            <div className="modal-mentee-appointment-datetime-container-header">
              <Calendar fullscreen={false} onSelect={handleDateChange} />
              <div className="modal-mentee-appointment-datetime-header">
                <div className="modal-mentee-appointment-datetime-text">
                  Select Time
                </div>
                <div className="modal-mentee-appointment-datetime-timezone">
                  CST
                </div>
              </div>
              <div className="modal-mentee-appointment-timeslots-container">
                {dayTimeSlots.map((time, index) => (
                  <div
                    key={index}
                    className="modal-mentee-appointment-timeslot"
                  >
                    <MenteeButton
                      key={index}
                      width={100}
                      content={
                        moment(time.start_time.$date).format("HH:mm") +
                        "-" +
                        moment(time.end_time.$date).format("HH:mm")
                      }
                      theme="light"
                      onClick={() => handleTimeChange(time)}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-mentee-appointment-datetime-container-footer">
              <MenteeButton
                width={120}
                content={"continue"}
                onClick={() => {
                  setAppModalVisible1(false);
                  setAppModalVisible2(true);
                }}
              />
            </div>
          </div>
        </div>
      </Modal>
      <Modal
        forceRender
        title="Your Information"
        visible={appModalVisible2}
        onCancel={closeModals}
        width="60%"
        style={{ overflow: "hidden" }}
        footer={
          <MenteeButton
            content="Book Appointment"
            htmlType="submit"
            form="appointment-form"
          />
        }
      >
        <Form
          id="appointment-form"
          form={form}
          onFinish={handleBookAppointment}
          validateMessages={validationMessage}
          scrollToFirstError
        >
          <div className="modal-container">
            <div className="modal-mentee-appointment-heading-container">
              <div className="modal-mentee-appointment-heading-text">
                Mentoring Session with Bernie Sanders
              </div>
              <div className="modal-mentee-appointment-heading-divider" />
              <div className="modal-mentee-appointment-heading-date-container">
                <div className="modal-mentee-appointment-heading-date">
                  10/6
                </div>
                <div className="modal-mentee-appointment-heading-day">
                  Tuesday
                </div>
              </div>
            </div>
            <div className="modal-mentee-inner-container">
              <div className="flex flex-row">
                <div className="modal-mentee-appointment-col-container">
                  <div className="modal-mentee-appointment-header-text">
                    About You
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
                      type="text"
                      title="Name*"
                      clicked={inputClicked[0]}
                      index={0}
                      handleClick={handleClick}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </Form.Item>
                  <Form.Item
                    name="age"
                    rules={[
                      {
                        required: true,
                      },
                    ]}
                  >
                    <ModalInput
                      style={styles.modalInput}
                      type="dropdown-single"
                      title="Age Range*"
                      clicked={inputClicked[1]}
                      index={1}
                      handleClick={handleClick}
                      onChange={(e) => setAgeRange(e)}
                      options={AGES}
                    />
                  </Form.Item>
                  <Form.Item
                    name="gender"
                    rules={[
                      {
                        required: true,
                      },
                    ]}
                  >
                    <ModalInput
                      style={styles.modalInput}
                      type="dropdown-single"
                      title="Gender*"
                      clicked={inputClicked[2]}
                      index={2}
                      handleClick={handleClick}
                      onChange={(e) => setGender(e)}
                      options={GENDERS}
                    />
                  </Form.Item>
                  <Form.Item
                    name="languages"
                    rules={[
                      {
                        required: true,
                      },
                    ]}
                  >
                    <ModalInput
                      style={styles.modalInput}
                      type="dropdown-multiple"
                      title="Language(s)*"
                      clicked={inputClicked[4]}
                      index={4}
                      handleClick={handleClick}
                      onChange={(e) => setLanguages(e)}
                      placeholder="Ex. English, Spanish"
                      options={LANGUAGES}
                    />
                  </Form.Item>
                  <Form.Item
                    name="specialization needs"
                    rules={[
                      {
                        required: true,
                      },
                    ]}
                  >
                    <ModalInput
                      style={styles.modalInput}
                      type="dropdown-multiple"
                      title="Specialization Needs*"
                      clicked={inputClicked[5]}
                      index={5}
                      handleClick={handleClick}
                      onChange={(e) => setSpecializations(e)}
                      options={SPECIALIZATIONS}
                    />
                  </Form.Item>
                  <ModalInput
                    style={styles.modalInput}
                    type="text"
                    title="Current Location"
                    clicked={inputClicked[6]}
                    index={6}
                    handleClick={handleClick}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                  <Form.Item
                    name="languages"
                    rules={[
                      {
                        required: true,
                      },
                    ]}
                  >
                    <ModalInput
                      style={styles.modalInput}
                      type="text"
                      title="Organization Affiliation*"
                      clicked={inputClicked[7]}
                      index={7}
                      handleClick={handleClick}
                      onChange={(e) => setOrganization(e.target.value)}
                    />
                  </Form.Item>
                </div>
                <div className="modal-mentee-appointment-col-container">
                  <div className="modal-mentee-appointment-header-text">
                    Contact Information
                  </div>
                  <Form.Item
                    name="email"
                    rules={[
                      {
                        required: true,
                        type: "email",
                      },
                    ]}
                  >
                    <div className="modal-mentee-appointment-contact-container">
                      <ModalInput
                        style={styles.contactInput}
                        type="text"
                        title="Email*"
                        clicked={inputClicked[8]}
                        index={8}
                        handleClick={handleClick}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </Form.Item>
                  <Form.Item
                    name="phone number"
                    rules={[
                      {
                        required: true,
                      },
                    ]}
                  >
                    <div className="modal-mentee-appointment-contact-container">
                      <ModalInput
                        style={styles.contactInput}
                        type="text"
                        title="Phone Number*"
                        clicked={inputClicked[9]}
                        index={9}
                        handleClick={handleClick}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </Form.Item>
                  <div className="modal-mentee-availability-switches">
                    <div className="modal-mentee-availability-switch">
                      <div className="modal-mentee-availability-switch-text">
                        Allow calls
                      </div>
                      <Switch
                        size="small"
                        checked={canCall}
                        handleClick={handleClick}
                        onChange={(e) => setCanCall(e)}
                      />
                    </div>
                    <div className="modal-mentee-availability-switch">
                      <div className="modal-mentee-availability-switch-text">
                        Allow texting
                      </div>
                      <Switch
                        size="small"
                        checked={canText}
                        handleClick={handleClick}
                        onChange={(e) => setCanText(e)}
                      />
                    </div>
                  </div>
                  <div className="modal-mentee-appointment-message-container">
                    <div className="modal-mentee-appointment-header-text">
                      Message to Mentor
                    </div>
                    <ModalInput
                      style={styles.modalInput}
                      type="textarea"
                      maxRows={11}
                      clicked={inputClicked[10]}
                      index={10}
                      handleClick={handleClick}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

const styles = {
  modalInput: {
    height: 65,
    marginTop: 20,
    width: "95%",
    overflow: "hidden",
  },
  contactInput: {
    maxHeight: 60,
    marginTop: 16,
    width: "95%",
  },
};

export default MenteeAppointmentModal;
