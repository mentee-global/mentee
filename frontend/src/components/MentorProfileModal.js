import React, { useState, useEffect } from "react";
import { Button, Modal, Checkbox, Avatar, Upload } from "antd";
import ModalInput from "./ModalInput";
import MenteeButton from "./MenteeButton";
import { UserOutlined, EditFilled, PlusCircleFilled, DeleteOutlined } from "@ant-design/icons";
import { LANGUAGES, SPECIALIZATIONS } from "../utils/consts";
import { editMentorProfile, uploadMentorImage } from "../utils/api";
import { getMentorID } from "../utils/auth.service";
import "./css/AntDesign.scss";
import "./css/Modal.scss";

const INITIAL_NUM_INPUTS = 14;

function MentorProfileModal(props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [numInputs, setNumInputs] = useState(INITIAL_NUM_INPUTS);
  const [inputClicked, setInputClicked] = useState(
    new Array(numInputs).fill(false)
  ); // each index represents an input box, respectively
  const [isValid, setIsValid] = useState(new Array(numInputs).fill(true));
  const [validate, setValidate] = useState(false);
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
  const [educations, setEducations] = useState([]);
  const [image, setImage] = useState(null);
  const [changedImage, setChangedImage] = useState(false);
  const [edited, setEdited] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (props.mentor) {
      setName(props.mentor.name);
      setTitle(props.mentor.professional_title);
      setAbout(props.mentor.biography);
      setInPersonAvailable(props.mentor.offers_in_person);
      setGroupAvailable(props.mentor.offers_group_appointments);
      setLocation(props.mentor.location);
      setWebsite(props.mentor.website);
      setLinkedin(props.mentor.linkedin);
      setImage(props.mentor.image);
      setSpecializations(props.mentor.specializations);
      setLanguages(props.mentor.languages);
      // Deep copy of array of objects
      const newEducation = props.mentor.education
        ? JSON.parse(JSON.stringify(props.mentor.education))
        : [];
      setEducations(newEducation);

      if (props.mentor.education) {
        let newInputs = (props.mentor.education.length - 1) * 4;
        setNumInputs(INITIAL_NUM_INPUTS + newInputs);

        let newValid = [...isValid];
        for (let i = 0; i < newInputs; i++) {
          newValid.push(true);
        }
        setIsValid(newValid);
      }
    }
  }, [props.mentor, modalVisible]);

  function renderEducationInputs() {
    return (
      educations &&
      educations.map((education, i) => (
        <div className="modal-education-container">
          <div className="modal-education-sidebar"></div>
          <div className="modal-inner-education-container">
            <div className="modal-input-container">
              <ModalInput
                style={styles.modalInput}
                height={65}
                type="text"
                title="School"
                clicked={inputClicked[10 + i * 4]} // Each education degree has four inputs, i.e. i * 4
                index={10 + i * 4}
                handleClick={handleClick}
                onEducationChange={handleSchoolChange}
                educationIndex={i}
                defaultValue={education.school}
                valid={isValid[10 + i * 4]}
                validate={validate}
              />
              <ModalInput
                style={styles.modalInput}
                height={65}
                type="text"
                title="End Year/Expected"
                clicked={inputClicked[10 + i * 4 + 1]}
                index={10 + i * 4 + 1}
                handleClick={handleClick}
                onEducationChange={handleGraduationDateChange}
                educationIndex={i}
                defaultValue={education.graduation_year}
                valid={isValid[10 + i * 4 + 1]}
                validate={validate}
              />
            </div>
            <div className="modal-input-container">
              <ModalInput
                style={styles.modalInput}
                height={65}
                type="dropdown-multiple"
                title="Major(s)"
                clicked={inputClicked[10 + i * 4 + 2]}
                index={10 + i * 4 + 2}
                handleClick={handleClick}
                onEducationChange={handleMajorsChange}
                educationIndex={i}
                options={[]}
                placeholder="Ex. Computer Science, Biology"
                defaultValue={education.majors}
                valid={isValid[10 + i * 4 + 2]}
                validate={validate}
              />
              <ModalInput
                style={styles.modalInput}
                height={65}
                type="text"
                title="Degree"
                clicked={inputClicked[10 + i * 4 + 3]}
                index={10 + i * 4 + 3}
                handleClick={handleClick}
                educationIndex={i}
                onEducationChange={handleDegreeChange}
                placeholder="Ex. Bachelor's"
                defaultValue={education.education_level}
                valid={isValid[10 + i * 4 + 3]}
                validate={validate}
              />
            </div>
            <div
              className="modal-input-container modal-education-delete-container"
              onClick={handleDeleteEducation}
            >
              <div className="modal-education-delete-text">delete</div>
              <DeleteOutlined className="modal-education-delete-icon" />
            </div>
          </div>
        </div>
      ))
    );
  }

  function handleClick(index) {
    // Sets only the clicked input box to true to change color, else false
    let newClickedInput = new Array(numInputs).fill(false);
    newClickedInput[index] = true;
    setInputClicked(newClickedInput);
  }

  function handleNameChange(e) {
    setName(e.target.value);
    setEdited(true);
    let newValid = [...isValid];

    newValid[0] = !!e.target.value;

    setIsValid(newValid);
  }

  function handleTitleChange(e) {
    setTitle(e.target.value);
    setEdited(true);
    let newValid = [...isValid];
    newValid[1] = !!e.target.value;
    setIsValid(newValid);
  }

  function handleAboutChange(e) {
    setAbout(e.target.value);
    setEdited(true);
  }

  function handleInPersonAvailableChange(e) {
    setInPersonAvailable(e.target.checked);
    setEdited(true);
  }

  function handleGroupAvailableChange(e) {
    setGroupAvailable(e.target.checked);
    setEdited(true);
  }

  function handleLocationChange(e) {
    setLocation(e.target.value);
    setEdited(true);
  }

  function handleWebsiteChange(e) {
    setWebsite(e.target.value);
    setEdited(true);
  }

  function handleLanguageChange(e) {
    let languagesSelected = [];
    e.forEach((value) => {
      languagesSelected.push(value);
    });
    setLanguages(languagesSelected);
    setEdited(true);

    let newValid = [...isValid];
    newValid[7] = !!languagesSelected.length;
    setIsValid(newValid);
  }

  function handleLinkedinChange(e) {
    setLinkedin(e.target.value);
    setEdited(true);
  }

  function handleSpecializationsChange(e) {
    let specializationsSelected = [];
    e.forEach((value) => specializationsSelected.push(value));
    setSpecializations(specializationsSelected);
    setEdited(true);

    let newValid = [...isValid];
    newValid[9] = !!specializationsSelected.length;
    setIsValid(newValid);
  }

  function handleSchoolChange(e, index) {
    const newEducations = [...educations];
    let education = newEducations[index];
    education.school = e.target.value;
    newEducations[index] = education;
    setEducations(newEducations);
    setEdited(true);

    let newValid = [...isValid];
    newValid[10 + index * 4] = !!education.school;
    setIsValid(newValid);
  }

  function handleGraduationDateChange(e, index) {
    const year = e.target.value;
    if (isNaN(year) || year.includes(".") || year.includes(" ")) {
      return;
    }

    const newEducations = [...educations];
    let education = newEducations[index];
    education.graduation_year = e.target.value;
    newEducations[index] = education;
    setEducations(newEducations);
    setEdited(true);

    let newValid = [...isValid];
    newValid[10 + index * 4 + 1] = !!education.graduation_year;
    setIsValid(newValid);
  }

  function handleMajorsChange(e, index) {
    const newEducations = [...educations];
    let education = newEducations[index];
    const majors = [];
    e.forEach((value) => majors.push(value));
    education.majors = majors;
    newEducations[index] = education;
    setEducations(newEducations);
    setEdited(true);

    let newValid = [...isValid];
    newValid[10 + index * 4 + 2] = !!education.majors.length;
    setIsValid(newValid);
  }

  function handleDegreeChange(e, index) {
    const newEducations = [...educations];
    let education = newEducations[index];
    education.education_level = e.target.value;
    newEducations[index] = education;
    setEducations(newEducations);
    setEdited(true);

    let newValid = [...isValid];
    newValid[10 + index * 4 + 3] = !!education.education_level;
    setIsValid(newValid);
  }

  const handleAddEducation = () => {
    const newEducations = [...educations];
    newEducations.push({
      education_level: "",
      majors: [],
      school: "",
      graduation_year: "",
    });
    setEducations(newEducations);
    setEdited(true);

    const newValidArray = [...isValid];
    newValidArray.push(false, false, false, false);
    setIsValid(newValidArray);
  };

  const handleDeleteEducation = () => {
    const newEducations = [...educations];
    newEducations.pop();
    setEducations(newEducations);
    setEdited(true);
    const newValidArray = [...isValid];
    newValidArray.push(false, false, false, false);
    setIsValid(newValidArray);
  }

  const handleSaveEdits = () => {
    async function saveEdits(data) {
      await editMentorProfile(data, getMentorID());
      if (changedImage) {
        await uploadMentorImage(image, getMentorID());
      }
      setSaving(false);
      setChangedImage(false);
      props.onSave();
      setModalVisible(false);
      setIsValid([...isValid].fill(true));
      setValidate(false);
    }
    if (!edited && !changedImage) {
      setModalVisible(false);
      setIsValid([...isValid].fill(true));
      setValidate(false);
      return;
    }

    if (isValid.includes(false)) {
      setValidate(true);
      return;
    }

    const updatedProfile = {
      name: name,
      professional_title: title,
      linkedin: linkedin,
      website: website,
      education: educations,
      languages: languages,
      specializations: specializations,
      biography: about,
      offers_in_person: inPersonAvailable,
      offers_group_appointments: groupAvailable,
    };

    setSaving(true);
    saveEdits(updatedProfile);
  };

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
        onCancel={() => {
          setModalVisible(false);
          setValidate(false);
          setChangedImage(false);
          setIsValid([...isValid].fill(true));
        }}
        width="50%"
        style={{ overflow: "hidden" }}
        footer={
          <div>
            {validate && <b style={styles.alertToast}>Missing Fields</b>}
            <Button
              type="default"
              shape="round"
              style={styles.footer}
              onClick={handleSaveEdits}
              loading={saving}
            >
              Save
            </Button>
          </div>
        }
      >
        <div className="modal-container">
          <div className="modal-profile-container">
            <Avatar
              size={120}
              icon={<UserOutlined />}
              className="modal-profile-icon"
              src={
                changedImage
                  ? image && URL.createObjectURL(image)
                  : image && image.url
              }
            />
            <Upload
              action={(file) => {
                setImage(file);
                setChangedImage(true);
              }}
              accept=".png,.jpg,.jpeg"
              showUploadList={false}
            >
              <Button
                shape="circle"
                icon={<EditFilled />}
                className="modal-profile-icon-edit"
              />
            </Upload>
          </div>
          <div className="modal-inner-container">
            <div className="modal-input-container">
              <ModalInput
                style={styles.modalInput}
                type="text"
                title="Name *"
                clicked={inputClicked[0]}
                index={0}
                handleClick={handleClick}
                onChange={handleNameChange}
                defaultValue={name}
                valid={isValid[0]}
                validate={validate}
              />
              <ModalInput
                style={styles.modalInput}
                type="text"
                title="Professional Title *"
                clicked={inputClicked[1]}
                index={1}
                handleClick={handleClick}
                onChange={handleTitleChange}
                defaultValue={title}
                valid={isValid[1]}
                validate={validate}
              />
            </div>
            <div className="modal-input-container">
              <ModalInput
                style={styles.modalInput}
                type="textarea"
                maxRows={3}
                hasBorder={false}
                title="About"
                clicked={inputClicked[2]}
                index={2}
                handleClick={handleClick}
                onChange={handleAboutChange}
                defaultValue={about}
              />
            </div>
            <div className="divider"/>
            <div className="modal-availability-checkbox">
              <Checkbox
                className="modal-availability-checkbox-text"
                clicked={inputClicked[3]}
                index={3}
                handleClick={handleClick}
                onChange={handleInPersonAvailableChange}
                checked={inPersonAvailable}
              >
                Available in-person?
              </Checkbox>
              <div></div>
              <Checkbox
                className="modal-availability-checkbox-text"
                clicked={inputClicked[4]}
                index={4}
                handleClick={handleClick}
                onChange={handleGroupAvailableChange}
                checked={groupAvailable}
              >
                Available for group appointments?
              </Checkbox>
            </div>
            <div className="modal-input-container">
              <ModalInput
                style={styles.modalInput}
                type="text"
                title="Location"
                clicked={inputClicked[5]}
                index={5}
                handleClick={handleClick}
                onChange={handleLocationChange}
                defaultValue={location}
              />
              <ModalInput
                style={styles.modalInput}
                type="text"
                title="Website"
                clicked={inputClicked[6]}
                index={6}
                handleClick={handleClick}
                onChange={handleWebsiteChange}
                defaultValue={website}
              />
            </div>
            <div className="modal-input-container">
              <ModalInput
                style={styles.modalInput}
                type="dropdown-multiple"
                title="Languages"
                clicked={inputClicked[7]}
                index={7}
                handleClick={handleClick}
                onChange={handleLanguageChange}
                placeholder="Ex. English, Spanish"
                options={LANGUAGES}
                defaultValue={languages}
                valid={isValid[7]}
                validate={validate}
              />
              <ModalInput
                style={styles.modalInput}
                type="text"
                title="LinkedIn"
                clicked={inputClicked[8]}
                index={8}
                handleClick={handleClick}
                onChange={handleLinkedinChange}
                defaultValue={linkedin}
              />
            </div>
            <div className="modal-input-container">
              <ModalInput
                style={styles.modalInput}
                type="dropdown-multiple"
                title="Specializations"
                clicked={inputClicked[9]}
                index={9}
                handleClick={handleClick}
                onChange={handleSpecializationsChange}
                options={SPECIALIZATIONS}
                defaultValue={specializations}
                valid={isValid[9]}
                validate={validate}
              />
            </div>
            <div className="modal-education-header">Education</div>
            {renderEducationInputs()}
            <div
              className="modal-input-container modal-education-add-container"
              onClick={handleAddEducation}
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
  modalInput: {
    height: 65,
    margin: 18,
    padding: 4,
    paddingTop: 6,
  },
  footer: {
    borderRadius: 13,
    marginRight: 15,
    backgroundColor: "#E4BB4F",
  },
  alertToast: {
    color: "#FF0000",
    display: "inline-block",
    marginRight: 10,
  },
};

export default MentorProfileModal;
