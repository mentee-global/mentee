import React, { useState } from "react";
import { Button, Modal, Radio } from "antd";
import MentorProfileModal from "../MentorProfileModal";
import ModalInput from "../ModalInput";
import "../css/Profile.scss";

const LANGUAGES = ["English", "Spanish", "German", "Chinese", "Vietnamese"]
const SPECIALIZATIONS = ["Marketing", "Business", "English", "Computer Science"]

function Profile() {
  const [modalVisible, setModalVisible] = useState(false);
  const [numInputs, setNumInputs] = useState(14);
  const [inputClicked, setInputClicked] = useState(new Array(numInputs).fill(false)) // each index represents an input box, respectively
  const [name, setName] = useState(null)
  const [title, setTitle] = useState(null)
  const [about, setAbout] = useState(null)
  const [onlineAvailable, setOnlineAvailable] = useState(null)
  const [groupAvailable, setGroupAvailable] = useState(null)
  const [location, setLocation] = useState(null)
  const [website, setWebsite] = useState(null)
  const [languages, setLanguages] = useState(null)
  const [linkedin, setLinkedin] = useState(null)
  const [specializations, setSpecializations] = useState(null)
  const [school, setSchool] = useState(null)
  const [graduation, setGraduation] = useState(null)
  const [majors, setMajors] = useState(null)
  const [degree, setDegree] = useState(null)



  function handleClick(index) {
    let newClickedInput = new Array(numInputs).fill(false)
    newClickedInput[index] = true
    setInputClicked(newClickedInput)
  }

  function handleNameChange(e) {
    setName(e.target.value)
  }

  function handleTitleChange(e) {
    setTitle(e.target.value)
  }

  function handleAboutChange(e) {
    setAbout(e.target.value)
  }

  function handleOnlineAvailableChange(e) {
    setOnlineAvailable(e.target.checked)
  }

  function handleGroupAvailableChange(e) {
    setGroupAvailable(e.target.checked)
  }

  function handleLocationChange(e) {
    setLocation(e.target.value)
  }

  function handleWebsiteChange(e) {
    setWebsite(e.target.value)
  }

  function handleLanguageChange(e) {
    // setLanguages(e.target.value)
  }

  function handleLinkedinChange(e) {
    setLinkedin(e.target.value)
  }

  function handleSpecializationsChange(e) {
    // setSpecializations(e.target.value)
  }

  function handleSchoolChange(e) {
    setSchool(e.target.value)
  }

  function handleGraduationDateChange(e) {
    setGraduation(e.target.value)
  }

  function handleMajorsChange(e) {
    setMajors(e.target.value)
  }

  function handleDegreeChange(e) {
    setDegree(e.target.value)
  }

  return (
    <div>
      <Button type="primary" onClick={() => setModalVisible(true)}>
        Open Modal
        </Button>
      <Modal
        title="Edit Profile"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        style={{ overflow: "hidden" }}
        footer={<Button
          type="default"
          shape="round"
          style={{
            borderRadius: 13,
            marginRight: 15,
            backgroundColor: "#E4BB4F"
          }}
          onClick={() => setModalVisible(false)}
        >
          Save</Button>}
      >
        <div className="modal-container">
          <div className="modal-inner-container">
            <div className="modal-input-container">
              <ModalInput height={60} type="text" title="Name *" clicked={inputClicked[0]} index={0} handleClick={handleClick} onChange={handleNameChange}></ModalInput>
              <ModalInput height={60} type="text" title="Professional Title *" clicked={inputClicked[1]} index={1} handleClick={handleClick} onChange={handleTitleChange}></ModalInput>
            </div>
            <div className="modal-input-container">
              <ModalInput type="textarea" title="About" clicked={inputClicked[2]} index={2} handleClick={handleClick} onChange={handleAboutChange}></ModalInput>
            </div>
            <div className="modal-availability-radios">
              <Radio className="modal-availability-radio-text" clicked={inputClicked[3]} index={3} handleClick={handleClick} onChange={handleOnlineAvailableChange}> Available online? </Radio>
              <Radio className="modal-availability-radio-text" clicked={inputClicked[4]} index={4} handleClick={handleClick} onChange={handleGroupAvailableChange}> Available for group appointments? </Radio>
            </div>
            <div className="modal-input-container">
              <ModalInput height={60} type="text" title="Location" clicked={inputClicked[5]} index={5} handleClick={handleClick} onChange={handleLocationChange}></ModalInput>
              <ModalInput height={60} type="text" title="Website" clicked={inputClicked[6]} index={6} handleClick={handleClick} onChange={handleWebsiteChange}></ModalInput>
            </div>
            <div className="modal-input-container">
              <ModalInput height={60} type="dropdown" title="Languages" clicked={inputClicked[7]} index={7} handleClick={handleClick} onChange={handleLanguageChange} placeholder="Ex. English, Spanish" options={LANGUAGES}></ModalInput>
              <ModalInput height={60} type="text" title="LinkedIn" clicked={inputClicked[8]} index={8} handleClick={handleClick} onChange={handleLinkedinChange}></ModalInput>
            </div>
            <div className="modal-input-container">
              <ModalInput height={60} type="dropdown" title="Specializations" clicked={inputClicked[9]} index={9} handleClick={handleClick} onChange={handleSpecializationsChange} options={SPECIALIZATIONS}></ModalInput>
              <div style={{ flex: 0.8 }} />
            </div>
            <div className="modal-education-header">
              Education
            </div>
            <div className="modal-education-container">
              <div className="modal-education-sidebar"></div>
              <div>
                <div className="modal-input-container">
                  <ModalInput height={60} type="text" title="School" clicked={inputClicked[10]} index={10} handleClick={handleClick} onChange={handleSchoolChange}></ModalInput>
                  <ModalInput height={60} type="text" title="End Year/Expected" clicked={inputClicked[11]} index={11} handleClick={handleClick} onChange={handleGraduationDateChange} placeholder="Ex. Computer Science, Biology"></ModalInput>
                </div>
                <div className="modal-input-container">
                  <ModalInput height={60} type="text" title="Major(s)" clicked={inputClicked[12]} index={12} handleClick={handleClick} onChange={handleMajorsChange}></ModalInput>
                  <ModalInput height={60} type="text" title="Degree" clicked={inputClicked[13]} index={13} handleClick={handleClick} onChange={handleDegreeChange} placeholder="Ex. Bachelor's"></ModalInput>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>

  );
}

export default Profile;
