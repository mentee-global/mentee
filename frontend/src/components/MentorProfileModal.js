import React, { useState } from "react";
import { Button, Modal, Checkbox, Avatar } from "antd";
import ModalInput from "./ModalInput";
import MenteeButton from "./MenteeButton";
import { UserOutlined, EditFilled, PlusCircleFilled } from "@ant-design/icons";
import { LANGUAGES, SPECIALIZATIONS } from "../utils/consts";
import "./css/AntDesign.scss";
import "./css/Modal.scss";

function MentorProfileModal() {
  const [modalVisible, setModalVisible] = useState(false);
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

  function renderEducationInputs() {
    let numDegrees = (numInputs - 10) / 4; // All boxes after first 10 are education-related
    let degrees = [...Array(numDegrees).keys()];
    return degrees.map((key, i) => (
      <div className="modal-education-container">
        <div className="modal-education-sidebar"></div>
        <div className="modal-inner-education-container">
          <div className="modal-input-container">
            <ModalInput
              height={65}
              type="text"
              title="School"
              clicked={inputClicked[10 + i * 4]} // Each education degree has four inputs, i.e. i * 4
              index={10 + i * 4}
              handleClick={handleClick}
              onChange={handleSchoolChange}
            ></ModalInput>
            <ModalInput
              height={65}
              type="text"
              title="End Year/Expected"
              clicked={inputClicked[10 + i * 4 + 1]}
              index={10 + i * 4 + 1}
              handleClick={handleClick}
              onChange={handleGraduationDateChange}
            ></ModalInput>
          </div>
          <div className="modal-input-container">
            <ModalInput
              height={65}
              type="text"
              title="Major(s)"
              clicked={inputClicked[10 + i * 4 + 2]}
              index={10 + i * 4 + 2}
              handleClick={handleClick}
              onChange={handleMajorsChange}
              placeholder="Ex. Computer Science, Biology"
            ></ModalInput>
            <ModalInput
              height={65}
              type="text"
              title="Degree"
              clicked={inputClicked[10 + i * 4 + 3]}
              index={10 + i * 4 + 3}
              handleClick={handleClick}
              onChange={handleDegreeChange}
              placeholder="Ex. Bachelor's"
            ></ModalInput>
          </div>
        </div>
      </div>
    ));
  }

  function handleClick(index) {
    // Sets only the clicked input box to true to change color, else false
    let newClickedInput = new Array(numInputs).fill(false);
    newClickedInput[index] = true;
    setInputClicked(newClickedInput);
  }

  function handleNameChange(e) {
    setName(e.target.value);
  }

  function handleTitleChange(e) {
    setTitle(e.target.value);
  }

  function handleAboutChange(e) {
    setAbout(e.target.value);
  }

  function handleInPersonAvailableChange(e) {
    setInPersonAvailable(e.target.checked);
  }

  function handleGroupAvailableChange(e) {
    setGroupAvailable(e.target.checked);
  }

  function handleLocationChange(e) {
    setLocation(e.target.value);
  }

  function handleWebsiteChange(e) {
    setWebsite(e.target.value);
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

  function handleSchoolChange(e) {
    setSchool(e.target.value);
  }

  function handleGraduationDateChange(e) {
    setGraduation(e.target.value);
  }

  function handleMajorsChange(e) {
    setMajors(e.target.value);
  }

  function handleDegreeChange(e) {
    setDegree(e.target.value);
  }

  return (
    <span>
      <span className="mentor-profile-button">
        <MenteeButton
          content={<b>Edit Profile</b>}
          onClick={() => setModalVisible(true)}
        />
      </span>
      <Modal
        title="Edit Profile"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        width="50%"
        style={{ overflow: "hidden" }}
        footer={
          <Button
            type="default"
            shape="round"
            style={styles.footer}
            onClick={() => setModalVisible(false)}
          >
            Save
          </Button>
        }
      >
        <div className="modal-container">
          <div className="modal-profile-container">
            <Avatar
              size={120}
              icon={<UserOutlined />}
              className="modal-profile-icon"
            />
            <Button
              shape="circle"
              icon={<EditFilled />}
              className="modal-profile-icon-edit"
            />
          </div>
          <div className="modal-inner-container">
            <div className="modal-input-container">
              <ModalInput
                height={65}
                type="text"
                title="Name *"
                clicked={inputClicked[0]}
                index={0}
                handleClick={handleClick}
                onChange={handleNameChange}
              ></ModalInput>
              <ModalInput
                height={65}
                type="text"
                title="Professional Title *"
                clicked={inputClicked[1]}
                index={1}
                handleClick={handleClick}
                onChange={handleTitleChange}
              ></ModalInput>
            </div>
            <div className="modal-input-container">
              <ModalInput
                type="textarea"
                title="About"
                clicked={inputClicked[2]}
                index={2}
                handleClick={handleClick}
                onChange={handleAboutChange}
              ></ModalInput>
            </div>
            <div className="modal-availability-checkbox">
              <Checkbox
                className="modal-availability-checkbox-text"
                clicked={inputClicked[3]}
                index={3}
                handleClick={handleClick}
                onChange={handleInPersonAvailableChange}
              >
                Available online?
              </Checkbox>
              <div></div>
              <Checkbox
                className="modal-availability-checkbox-text"
                clicked={inputClicked[4]}
                index={4}
                handleClick={handleClick}
                onChange={handleGroupAvailableChange}
              >
                Available for group appointments?
              </Checkbox>
            </div>
            <div className="modal-input-container">
              <ModalInput
                height={65}
                type="text"
                title="Location"
                clicked={inputClicked[5]}
                index={5}
                handleClick={handleClick}
                onChange={handleLocationChange}
              ></ModalInput>
              <ModalInput
                height={65}
                type="text"
                title="Website"
                clicked={inputClicked[6]}
                index={6}
                handleClick={handleClick}
                onChange={handleWebsiteChange}
              ></ModalInput>
            </div>
            <div className="modal-input-container">
              <ModalInput
                height={65}
                type="dropdown"
                title="Languages"
                clicked={inputClicked[7]}
                index={7}
                handleClick={handleClick}
                onChange={handleLanguageChange}
                placeholder="Ex. English, Spanish"
                options={LANGUAGES}
              ></ModalInput>
              <ModalInput
                height={65}
                type="text"
                title="LinkedIn"
                clicked={inputClicked[8]}
                index={8}
                handleClick={handleClick}
                onChange={handleLinkedinChange}
              ></ModalInput>
            </div>
            <div className="modal-input-container">
              <ModalInput
                height={65}
                type="dropdown"
                title="Specializations"
                clicked={inputClicked[9]}
                index={9}
                handleClick={handleClick}
                onChange={handleSpecializationsChange}
                options={SPECIALIZATIONS}
              ></ModalInput>
            </div>
            <div className="modal-education-header">Education</div>
            {renderEducationInputs()}
            <div
              className="modal-input-container modal-education-add-container"
              onClick={() => setNumInputs(numInputs + 4)}
            >
              <PlusCircleFilled className="modal-education-add-icon" />
              <div className="modal-education-add-text">Add more</div>
            </div>
          </div>
        </div>
      </Modal>
    </span>
  );
}

const styles = {
  footer: {
    borderRadius: 13,
    marginRight: 15,
    backgroundColor: "#E4BB4F",
  },
};

export default MentorProfileModal;
