import React, { useState } from "react";
import { Button, Modal, Calendar, Checkbox, Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import ModalInput from "./ModalInput";
import MenteeButton from "./MenteeButton";
import {
  LANGUAGES,
  SPECIALIZATIONS,
  GENDERS,
  ETHNICITIES,
  AGES,
} from "../utils/consts";
import "./css/AntDesign.scss";
import "./css/Modal.scss";
import "./css/MenteeModal.scss";

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
  const [numInputs, setNumInputs] = useState(14);
  const [inputClicked, setInputClicked] = useState(
    new Array(numInputs).fill(false)
  ); // each index represents an input box, respectively
  const [name, setName] = useState(null);
  const [title, setTitle] = useState(null);
  const [about, setAbout] = useState(null);
  const [inPersonAvailable, setInPersonAvailable] = useState(null);
  const [groupAvailable, setGroupAvailable] = useState(null);
  const [location, setLocation] = useState(null);
  const [website, setWebsite] = useState(null);
  const [languages, setLanguages] = useState(null);
  const [linkedin, setLinkedin] = useState(null);
  const [specializations, setSpecializations] = useState(null);
  const [school, setSchool] = useState(null);
  const [graduation, setGraduation] = useState(null);
  const [majors, setMajors] = useState(null);
  const [degree, setDegree] = useState(null);

  function handleClick(index) {
    // Sets only the clicked input box to true to change color, else false
    let newClickedInput = new Array(numInputs).fill(false);
    newClickedInput[index] = true;
    setInputClicked(newClickedInput);
  }

  function handleLanguageChange(e) {
    let languagesSelected = [];
    e.forEach((value) => languagesSelected.push(LANGUAGES[value]));
    setLanguages(languagesSelected);
  }

  function handleLinkedinChange(e) {
    setLinkedin(e.target.value);
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
              <Calendar fullscreen={false} onPanelChange={null} />
              <div className="modal-mentee-appointment-datetime-header">
                <div className="modal-mentee-appointment-datetime-text">
                  Select Time
                </div>
                <div className="modal-mentee-appointment-datetime-timezone">
                  CST
                </div>
              </div>
              <div className="modal-mentee-appointment-timeslots-container">
                {sampleTimes.map((time) => (
                  <div className="modal-mentee-appointment-timeslot">
                    {" "}
                    <MenteeButton
                      width={100}
                      content={time}
                      theme="light"
                    />{" "}
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
        onCancel={() => closeModals()}
        width="60%"
        style={{ overflow: "hidden" }}
        footer={
          <MenteeButton
            content="Book Appontment"
            onClick={() => setAppModalVisible2(false)}
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
                  clicked={inputClicked[5]}
                  index={5}
                  handleClick={handleClick}
                  onChange={handleLinkedinChange}
                />
                <ModalInput
                  style={styles.modalInput}
                  type="dropdown"
                  title="Age Range*"
                  clicked={inputClicked[7]}
                  index={7}
                  handleClick={handleClick}
                  onChange={handleLanguageChange}
                  options={AGES}
                />
                <ModalInput
                  style={styles.modalInput}
                  type="dropdown"
                  title="Gender*"
                  clicked={inputClicked[7]}
                  index={7}
                  handleClick={handleClick}
                  onChange={handleLanguageChange}
                  options={GENDERS}
                />
                <ModalInput
                  style={styles.modalInput}
                  type="dropdown"
                  title="Ethnicity*"
                  clicked={inputClicked[7]}
                  index={7}
                  handleClick={handleClick}
                  onChange={handleLanguageChange}
                  options={ETHNICITIES}
                />
                <ModalInput
                  style={styles.modalInput}
                  type="dropdown"
                  title="Language(s)*"
                  clicked={inputClicked[7]}
                  index={7}
                  handleClick={handleClick}
                  onChange={handleLanguageChange}
                  placeholder="Ex. English, Spanish"
                  options={LANGUAGES}
                />
                <ModalInput
                  style={styles.modalInput}
                  type="dropdown"
                  title="Specialization Needs*"
                  clicked={inputClicked[9]}
                  index={9}
                  handleClick={handleClick}
                  onChange={handleSpecializationsChange}
                  options={SPECIALIZATIONS}
                />
                <ModalInput
                  style={styles.modalInput}
                  type="text"
                  title="Current Location"
                  clicked={inputClicked[5]}
                  index={5}
                  handleClick={handleClick}
                  onChange={handleLinkedinChange}
                />
                <ModalInput
                  style={styles.modalInput}
                  type="dropdown"
                  title="Organization Affiliation"
                  clicked={inputClicked[7]}
                  index={7}
                  handleClick={handleClick}
                  onChange={handleLanguageChange}
                  options={LANGUAGES}
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
                    clicked={inputClicked[5]}
                    index={5}
                    handleClick={handleClick}
                    onChange={handleLinkedinChange}
                  />
                </div>
                <div className="modal-mentee-appointment-contact-container">
                  <ModalInput
                    style={styles.contactInput}
                    type="text"
                    title="Phone Number*"
                    clicked={inputClicked[5]}
                    index={5}
                    handleClick={handleClick}
                    onChange={handleLinkedinChange}
                  />
                </div>
                <div className="modal-mentee-availability-checkbox">
                  <Checkbox
                    className="modal-mentee-availability-checkbox-text"
                    clicked={inputClicked[3]}
                    index={3}
                    handleClick={handleClick}
                    onChange={handleLanguageChange}
                  >
                    Allow calls
                  </Checkbox>
                  <div></div>
                  <Checkbox
                    className="modal-mentee-availability-checkbox-text"
                    clicked={inputClicked[3]}
                    index={3}
                    handleClick={handleClick}
                    onChange={handleLanguageChange}
                  >
                    Allow texting
                  </Checkbox>
                </div>
                <div className="modal-mentee-message-container">
                  <div className="modal-mentee-appointment-header-text">
                    Message to Mentor
                  </div>
                  <ModalInput
                    style={styles.modalInput}
                    type="textarea"
                    clicked={inputClicked[2]}
                    index={2}
                    handleClick={handleClick}
                    onChange={handleLinkedinChange}
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
  },
  contactInput: {
    maxHeight: 60,
    marginTop: 16,
    width: "95%",
  },
};

export default MenteeAppointmentModal;
