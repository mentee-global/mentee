import React, { useState, useEffect } from "react";
import moment from "moment";
import { Form, Modal, Calendar, Avatar, Switch } from "antd";
import { UserOutlined } from "@ant-design/icons";
import ModalInput from "./ModalInput";
import MenteeButton from "./MenteeButton";
import {
  LANGUAGES,
  SPECIALIZATIONS,
  GENDERS,
  AGES,
  APPOINTMENT_FORM_KEYS,
} from "../utils/consts";
import { createAppointment, editAvailability } from "../utils/api";
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

// Form validateMessages sends values here
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
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const numInputs = 11;
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
  const [validate, setValidate] = useState(false);

  // useState values
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

  // Updates availability
  useEffect(() => {
    if (props.availability) {
      setTimeSlots(props.availability);
    }
  }, [props]);

  // Resets form fields on close
  useEffect(() => {
    if (formModalVisible) {
      form.resetFields();
    }
  }, [formModalVisible, form]);

  // Update Buttons available
  useEffect(() => {
    let daySlots = [];
    timeSlots.forEach((element) => {
      if (moment(element.start_time.$date).format("YYYY-MM-DD") === date) {
        daySlots.push(element);
      }
    });
    setDayTimeSlots(daySlots);
  }, [date, timeSlots]);

  function handleClick(index) {
    // Sets only the clicked input box to true to change color, else false
    let newClickedInput = new Array(numInputs).fill(false);
    newClickedInput[index] = true;
    setInputClicked(newClickedInput);
  }

  function handleDateChange(e) {
    setDate(moment(e._d).format("YYYY-MM-DD"));
  }

  function closeModals() {
    setTime(null);
    setCalendarModalVisible(false);
    setFormModalVisible(false);
  }

  function updateModal() {
    if (time) {
      setCalendarModalVisible(false);
      setFormModalVisible(true);
      setValidate(false);
    } else {
      setValidate(true);
    }
  }

  async function handleBookAppointment() {
    setFormModalVisible(false);

    const appointment = {};

    // Match keys to useState value
    for (let i = 0; i < values.length; i++) {
      if (values[i] !== undefined) {
        appointment[APPOINTMENT_FORM_KEYS[i]] = values[i];
      }
    }

    // Manually set keys to values for accepted and timeslot
    appointment["accepted"] = false;
    appointment["timeslot"] = {
      start_time: moment(time.start_time.$date).format(),
      end_time: moment(time.end_time.$date).format(),
    };

    await createAppointment(appointment);

    // Find matching appointment and PUT request for mentor availability
    const changeTime = [...timeSlots];
    let index = 0;

    // Change date format and find index of object that matches selected
    changeTime.forEach((element) => {
      element.end_time.$date = moment(element.end_time.$date).format();
      element.start_time.$date = moment(element.start_time.$date).format();
      if (
        element.end_time.$date === time.end_time.$date &&
        time.start_time.$date === element.start_time.$date
      ) {
        index = changeTime.indexOf(element);
      }
    });

    // Remove date object from timeslots and update availability
    changeTime.splice(index, 1);
    await editAvailability(changeTime, mentorID);
  }

  return (
    <div>
      <MenteeButton
        content="Book Appointment"
        onClick={() => setCalendarModalVisible(true)}
      />
      <Modal
        forceRender
        title="        " // Uses Unicode spaces to get desired heading
        visible={calendarModalVisible}
        onCancel={() => closeModals()}
        className="appointment-modal"
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
            {/* TODO: Replace Bernie Sanders with Mentor Name */}
            <h3 className="bold">
              Mentoring Session with <br /> Bernie Sanders
            </h3>
            <h2 className="bold">Select a Date & Time</h2>
          </div>
          <div className="modal-mentee-appointment-datetime-container">
            <div className="modal-mentee-appointment-datetime-container-header">
              <Calendar fullscreen={false} onSelect={handleDateChange} />
              <div className="modal-mentee-appointment-datetime-header">
                <div className="modal-mentee-appointment-datetime-text">
                  Select Time
                </div>
                {/* TODO: Change CST to timezone value */}
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
                      width={170}
                      content={
                        moment(time.start_time.$date).format("hh:mm A") +
                        "-" +
                        moment(time.end_time.$date).format("hh:mm A")
                      }
                      theme="light"
                      onClick={() => setTime(time)}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-mentee-appointment-datetime-container-footer">
              {validate && (
                <b style={styles.alertToast}>Appointment Time Not Chosen</b>
              )}
              <MenteeButton
                width={120}
                content={"continue"}
                onClick={() => {
                  updateModal();
                }}
              />
            </div>
          </div>
        </div>
      </Modal>
      <Modal
        forceRender
        title="Your Information"
        visible={formModalVisible}
        onCancel={closeModals}
        className="appointment-modal"
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
                      value={name}
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
                      value={ageRange}
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
                      value={gender}
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
                      value={languages}
                    />
                  </Form.Item>
                  <Form.Item
                    name="specialization"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your specialization needs",
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
                      value={specializations}
                    />
                  </Form.Item>
                  <Form.Item name="location">
                    <ModalInput
                      style={styles.modalInput}
                      type="text"
                      title="Current Location"
                      clicked={inputClicked[6]}
                      index={6}
                      handleClick={handleClick}
                      onChange={(e) => setLocation(e.target.value)}
                      value={location}
                    />
                  </Form.Item>
                  <Form.Item
                    name="organization"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your organization affiliation",
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
                      value={organization}
                    />
                  </Form.Item>
                </div>
                <div className="modal-mentee-appointment-col-container">
                  <div className="modal-mentee-appointment-header-text">
                    Contact Information
                  </div>
                  <div className="modal-mentee-appointment-contact-container">
                    <Form.Item
                      name="email"
                      rules={[
                        {
                          required: true,
                          type: "email",
                        },
                      ]}
                    >
                      <ModalInput
                        style={styles.contactInput}
                        type="text"
                        title="Email*"
                        clicked={inputClicked[8]}
                        index={8}
                        handleClick={handleClick}
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                      />
                    </Form.Item>
                  </div>
                  <div className="modal-mentee-appointment-contact-container">
                    <Form.Item
                      name="phone"
                      rules={[
                        {
                          required: true,
                          message: "Please enter your phone number",
                        },
                      ]}
                    >
                      <ModalInput
                        style={styles.contactInput}
                        type="text"
                        title="Phone Number*"
                        clicked={inputClicked[9]}
                        index={9}
                        handleClick={handleClick}
                        onChange={(e) => setPhone(e.target.value)}
                        value={phone}
                      />
                    </Form.Item>
                  </div>
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
                      value={message}
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
};

export default MenteeAppointmentModal;
