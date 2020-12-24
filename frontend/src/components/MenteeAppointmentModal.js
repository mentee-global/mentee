import React, { useState } from "react";
import { Modal, Calendar, Avatar, Switch } from "antd";
import { UserOutlined } from "@ant-design/icons";
import ModalInput from "./ModalInput";
import MenteeButton from "./MenteeButton";
import { LANGUAGES, SPECIALIZATIONS, GENDERS, AGES } from "../utils/consts";
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

function MenteeAppointmentModal() {
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

  function handleClick(index) {
    // Sets only the clicked input box to true to change color, else false
    let newClickedInput = new Array(numInputs).fill(false);
    newClickedInput[index] = true;
    setInputClicked(newClickedInput);
  }

  function handleDateChange(e) {
    setDate(e._d);
  }

  function handleTimeChange(time) {
    setTime(time);
  }

  function handleLanguageChange(e) {
    let languagesSelected = [];
    e.forEach((value) => languagesSelected.push(LANGUAGES[value]));
    setLanguages(languagesSelected);
  }

  function handleSpecializationsChange(e) {
    let specializationsSelected = [];
    e.forEach((value) => specializationsSelected.push(SPECIALIZATIONS[value]));
    setLanguages(specializationsSelected);
  }

  function closeModals() {
    setAppModalVisible1(false);
    setAppModalVisible2(false);
  }

  function handleBookAppointment() {
    setAppModalVisible2(false);
  }

  return (
    <div>
      <MenteeButton
        content="Book Appointment"
        onClick={() => setAppModalVisible1(true)}
      />
      <Modal
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
                {sampleTimes.map((time, index) => (
                  <div className="modal-mentee-appointment-timeslot">
                    <MenteeButton
                      key={index}
                      width={100}
                      content={time}
                      theme="light"
                      onClick={handleTimeChange}
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
        title="Your Information"
        visible={appModalVisible2}
        onCancel={closeModals}
        width="60%"
        style={{ overflow: "hidden" }}
        footer={
          <MenteeButton
            content="Book Appointment"
            onClick={handleBookAppointment}
          />
        }
      >
        <div className="modal-container">
          <div className="modal-mentee-appointment-heading-container">
            <div className="modal-mentee-appointment-heading-text">
              Mentoring Session with Bernie Sanders
            </div>
            <div className="modal-mentee-appointment-heading-divider" />
            <div className="modal-mentee-appointment-heading-date-container">
              <div className="modal-mentee-appointment-heading-date">10/6</div>
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
                <ModalInput
                  style={styles.modalInput}
                  type="text"
                  title="Name"
                  clicked={inputClicked[0]}
                  index={0}
                  handleClick={handleClick}
                  onChange={(e) => setName(e.target.value)}
                />
                <ModalInput
                  style={styles.modalInput}
                  type="dropdown-single"
                  title="Age Range*"
                  clicked={inputClicked[1]}
                  index={1}
                  handleClick={handleClick}
                  onChange={(e) => setAgeRange(AGES[e])}
                  options={AGES}
                />
                <ModalInput
                  style={styles.modalInput}
                  type="dropdown-single"
                  title="Gender*"
                  clicked={inputClicked[2]}
                  index={2}
                  handleClick={handleClick}
                  onChange={(e) => setGender(GENDERS[e])}
                  options={GENDERS}
                />
                <ModalInput
                  style={styles.modalInput}
                  type="dropdown-multiple"
                  title="Language(s)*"
                  clicked={inputClicked[4]}
                  index={4}
                  handleClick={handleClick}
                  onChange={handleLanguageChange}
                  placeholder="Ex. English, Spanish"
                  options={LANGUAGES}
                />
                <ModalInput
                  style={styles.modalInput}
                  type="dropdown-multiple"
                  title="Specialization Needs*"
                  clicked={inputClicked[5]}
                  index={5}
                  handleClick={handleClick}
                  onChange={handleSpecializationsChange}
                  options={SPECIALIZATIONS}
                />
                <ModalInput
                  style={styles.modalInput}
                  type="text"
                  title="Current Location"
                  clicked={inputClicked[6]}
                  index={6}
                  handleClick={handleClick}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <ModalInput
                  style={styles.modalInput}
                  type="text"
                  title="Organization Affiliation"
                  clicked={inputClicked[7]}
                  index={7}
                  handleClick={handleClick}
                  onChange={(e) => setOrganization(e.target.value)}
                />
              </div>
              <div className="modal-mentee-appointment-col-container">
                <div className="modal-mentee-appointment-header-text">
                  Contact Information
                </div>
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
