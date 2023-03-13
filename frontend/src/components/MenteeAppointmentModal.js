import React, { useState, useEffect } from "react";
import moment from "moment";
import {
  Form,
  Modal,
  Calendar,
  Avatar,
  Switch,
  Space,
  notification,
} from "antd";
import { UserOutlined } from "@ant-design/icons";
import ModalInput from "./ModalInput";
import MenteeButton from "./MenteeButton";
import {
  SPECIALIZATIONS,
  APPOINTMENT_FORM_KEYS,
  APPOINTMENT_STATUS,
} from "../utils/consts";
import { createAppointment, editAvailability } from "../utils/api";
import "./css/AntDesign.scss";
import "./css/Modal.scss";
import "./css/MenteeModal.scss";
import MenteeVerificationModal from "./MenteeVerificationModal";

const DAY = 24 * 60 * 60 * 1000;
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
const SUCCESS = "success";
const ERROR = "error";

// Form validateMessages sends values here
const validationMessage = {
  required: "Please enter your ${name}",
  types: {
    email: "Not a valid email",
  },
};

function MenteeAppointmentModal(props) {
  const [form] = Form.useForm();
  const [content, setContent] = useState("");
  const [timeSlots, setTimeSlots] = useState([]);
  const [dayTimeSlots, setDayTimeSlots] = useState([]);
  const [daySlots, setDaySlots] = useState([]);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const numInputs = 2;
  const [inputClicked, setInputClicked] = useState(
    new Array(numInputs).fill(false)
  ); // each index represents an input box, respectively
  const [date, setDate] = useState();
  const [dateHeading, setDateHeading] = useState();
  const [time, setTime] = useState();
  const [topic, setTopic] = useState();
  const [canCall, setCanCall] = useState(false);
  const [canText, setCanText] = useState(false);
  const [message, setMessage] = useState();
  const [validate, setValidate] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [specMasters, setSpecMasters] = useState([]);
  const mentorID = props.mentor_id;
  const menteeID = props.mentee_id;

  // notification
  const mentorName = props.mentor_name;
  const [notifDate, setNotifDate] = useState();

  // useState values
  const values = [mentorID, menteeID, topic, message, canCall, canText];

  useEffect(() => {
    async function getMasters(){
      setSpecMasters(await SPECIALIZATIONS());
    }
    getMasters();
  }, []);
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

  useEffect(() => {
    let dayList = [];
    timeSlots.forEach((timeSlot) => {
      let day = moment(timeSlot.start_time.$date).format("YYYY-MM-DD");
      let dayTimeObject = moment(timeSlot.start_time.$date);
      let currentDate = moment();

      if (!dayList.includes(day)) {
        dayList.push(day);
      }
      if (dayTimeObject.isAfter(currentDate)) {
        setIsAvailable(true);
      }
    });
    setDaySlots(dayList);
  }, [timeSlots]);

  // Update Buttons available
  useEffect(() => {
    let daySlots = [];
    timeSlots.forEach((timeSlot) => {
      if (moment(timeSlot.start_time.$date).format("YYYY-MM-DD") === date) {
        daySlots.push(timeSlot);
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

    // date for notif
    setNotifDate(moment(e._d).format("MM-DD"));
    setDateHeading(moment(e._d));
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
    appointment["status"] = APPOINTMENT_STATUS.PENDING;
    appointment["timeslot"] = {
      start_time: moment(time.start_time.$date).format(),
      end_time: moment(time.end_time.$date).format(),
    };

    let timeInterval =
      moment(time.start_time.$date).format("hh:mm A") +
      " - " +
      moment(time.end_time.$date).format("hh:mm A");

    const res = await createAppointment(appointment);
    // condition with success
    if (res) {
      openNotificationWithIcon(SUCCESS, timeInterval);
    } else {
      openNotificationWithIcon(ERROR, timeInterval);
    }

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
    props.handleUpdateMentor();
  }

  function disabledDate(date) {
    // disable/return true if date is in the past or not in availability
    let dateInPast = date && date.valueOf() < Date.now() - DAY;
    return dateInPast || !daySlots.includes(moment(date).format("YYYY-MM-DD"));
  }

  // notification component for when mentee succesfully books an appointment
  // type change if we want to add
  function openNotificationWithIcon(type, timeInterval) {
    if (type === SUCCESS) {
      props.handleSuccessBooking(
        "You Have Successfully Booked an Appointment with " +
          mentorName +
          " on " +
          notifDate +
          " from " +
          timeInterval
      );
      notification[type]({
        message: "You Have Successfully Booked an Appointment!",
        description: `Appointment with ${mentorName} on ${notifDate} from ${timeInterval}`,
      });
    } else if (type === ERROR) {
      props.handleSuccessBooking("Error in booking appointment!");
      notification[type]({
        message: "Error in booking appointment!",
      });
    }
  }

  return (
    <span>
      <MenteeVerificationModal
        content={<b>Book Appointment</b>}
        style={{ width: "180px" }}
        onVerified={() => setCalendarModalVisible(true)}
      />
      <Modal
        forceRender
        title="        " // Uses Unicode spaces to get desired heading
        visible={calendarModalVisible}
        onCancel={() => closeModals()}
        className="appointment-date-modal"
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
            <h3 className="bold">Mentoring Session with {props.mentor_name}</h3>
            <h2 className="bold">Select a Date & Time</h2>
          </div>
          <div className="modal-mentee-appointment-datetime-container">
            <div className="modal-mentee-appointment-datetime-container-header">
              <Calendar
                fullscreen={false}
                onSelect={handleDateChange}
                disabledDate={disabledDate}
              />
              <div className="modal-mentee-appointment-datetime-header">
                <div className="modal-mentee-appointment-datetime-text">
                  Select Time
                </div>
                <div className="modal-mentee-appointment-datetime-timezone">
                  {tz}
                </div>
              </div>
              <div className="modal-mentee-appointment-timeslots-container">
                {!isAvailable ? (
                  <h1>There are no appointments available</h1>
                ) : (
                  dayTimeSlots.map((timeSlot, index) => (
                    <div
                      key={index}
                      className="modal-mentee-appointment-timeslot"
                    >
                      <MenteeButton
                        key={index}
                        width={170}
                        content={
                          moment(timeSlot.start_time.$date).format("hh:mm A") +
                          "-" +
                          moment(timeSlot.end_time.$date).format("hh:mm A")
                        }
                        theme="light"
                        borderOnClick={true}
                        onClick={() => setTime(timeSlot)}
                      />
                    </div>
                  ))
                )}
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
        title="Meeting Information"
        visible={formModalVisible}
        onCancel={closeModals}
        className="appointment-info-modal"
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
                Mentoring Session with {props.mentor_name}
              </div>
              <div className="modal-mentee-appointment-heading-divider" />
              <div className="modal-mentee-appointment-heading-date-container">
                <div className="modal-mentee-appointment-heading-date">
                  {dateHeading && dateHeading.format("MM/DD")}
                </div>
                <div className="modal-mentee-appointment-heading-day">
                  {dateHeading && dateHeading.format("dddd")}
                </div>
              </div>
            </div>
            <div className="modal-mentee-inner-container">
              <div className="flex flex-row">
                <div className="modal-mentee-appointment-col-container">
                  <div className="modal-mentee-appointment-header-text">
                    Meeting Topic*
                  </div>
                  <Form.Item
                    name="topic"
                    rules={[
                      {
                        required: true,
                      },
                    ]}
                  >
                    <ModalInput
                      style={styles.modalInput}
                      value={topic}
                      type="dropdown-single"
                      options={specMasters}
                      clicked={inputClicked[0]}
                      index={0}
                      handleClick={handleClick}
                      onChange={(e) => setTopic(e)}
                    />
                  </Form.Item>
                  <div className="modal-mentee-appointment-message-container">
                    <div className="modal-mentee-appointment-header-text">
                      Message to Mentor*
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
                        style={styles.modalInput}
                        type="textarea"
                        maxRows={11}
                        clicked={inputClicked[1]}
                        index={1}
                        handleClick={handleClick}
                        onChange={(e) => setMessage(e.target.value)}
                        value={message}
                        large
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
};

export default MenteeAppointmentModal;
