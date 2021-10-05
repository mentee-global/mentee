import React, { useState, useEffect } from "react";
import { Button, Modal, Checkbox, Avatar, Upload } from "antd";
import ModalInput from "./ModalInput";
import MenteeButton from "./MenteeButton";
import {
  UserOutlined,
  EditFilled,
  PlusCircleFilled,
  DeleteOutlined,
} from "@ant-design/icons";
import { LANGUAGES, MENTEE_DEFAULT_VIDEO_NAME } from "../utils/consts";
import { editMenteeProfile, uploadMenteeImage } from "../utils/api";
import { getMenteeID } from "../utils/auth.service";
import moment from "moment";
import "./css/AntDesign.scss";
import "./css/Modal.scss";

const INITIAL_NUM_INPUTS = 14;

function MenteeProfileModal(props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [numInputs, setNumInputs] = useState(INITIAL_NUM_INPUTS);
  const [inputClicked, setInputClicked] = useState(
    new Array(numInputs).fill(false)
  ); // each index represents an input box, respectively
  const [isValid, setIsValid] = useState(new Array(numInputs).fill(true));
  const [validate, setValidate] = useState(false);
  const [name, setName] = useState(null);
  const [about, setAbout] = useState(null);
  const [location, setLocation] = useState(null);
  const [gender, setGender] = useState(null);
  const [age, setAge] = useState(null);
  const [phone, setPhone] = useState(null);
  const [email, setEmail] = useState(null);
  const [languages, setLanguages] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [educations, setEducations] = useState([]);
  const [videoUrl, setVideoUrl] = useState();
  const [image, setImage] = useState(null);
  const [changedImage, setChangedImage] = useState(false);
  const [edited, setEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [privacy, setPrivacy] = useState(true);

  useEffect(() => {
    if (props.mentee) {
      setName(props.mentee.name);
      setAbout(props.mentee.biography);
      setLocation(props.mentee.location);
      setAge(props.mentee.age);
      setGender(props.mentee.gender);
      setPhone(props.mentee.phone);
      setEmail(props.mentee.email);
      setImage(props.mentee.image);
      setLanguages(props.mentee.languages);
      setOrganization(props.mentee.organization);
      // Deep copy of array of objects
      const newEducation = props.mentee.education
        ? JSON.parse(JSON.stringify(props.mentee.education))
        : [];
      setEducations(newEducation);
      setVideoUrl(props.mentee.video && props.mentee.video.url);
      setPrivacy(props.mentee.is_private);

      if (props.mentee.education) {
        let newInputs = (props.mentee.education.length - 1) * 4;
        setNumInputs(INITIAL_NUM_INPUTS + newInputs);

        let newValid = [...isValid];
        for (let i = 0; i < newInputs; i++) {
          newValid.push(true);
        }
        setIsValid(newValid);
      }
    }
  }, [props.mentee, modalVisible]);

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
                value={education.school}
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
                value={education.graduation_year}
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
                value={education.majors}
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
                value={education.education_level}
                valid={isValid[10 + i * 4 + 3]}
                validate={validate}
              />
            </div>
            <div
              className="modal-input-container modal-education-delete-container"
              onClick={() => handleDeleteEducation(i)}
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
    const name = e.target.value;

    if (name.length < 50) {
      setEdited(true);
      let newValid = [...isValid];

      newValid[0] = true;

      setIsValid(newValid);
    } else {
      let newValid = [...isValid];
      newValid[0] = false;
      setIsValid(newValid);
    }

    setName(name);
    
  }

  function handleAboutChange(e) {
    const about = e.target.value;

    if (about.length < 255) {
      setEdited(true);
      let newValid = [...isValid];

      newValid[8] = true;

      setIsValid(newValid);
    } else {
      let newValid = [...isValid];
      newValid[8] = false;
      setIsValid(newValid);
    }

    setAbout(about);
  }

  function handleLocationChange(e) {
    setLocation(e.target.value);
    setEdited(true);
  }

  function handleAgeChange(e) {
    setAge(e.target.value);
    setEdited(true);
  }

  function handleGenderChange(e) {
    setGender(e.target.value);
    setEdited(true);
  }

  function handlePhoneChange(e) {
    setPhone(e.target.value);
    setEdited(true);
  }

  function handleEmailChange(e) {
    setEmail(e.target.value);
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

  function handleOrganizationChange(e) {
    setOrganization(e.target.value);
    setEdited(true);
  }

  function handleVideoChange(e) {
    setVideoUrl(e.target.value);
    setEdited(true);
  }

  function handlePrivacyChange(e) {
    setPrivacy(e.target.checked);
    setEdited(true);
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
    newValidArray.push(true, true, true, true);
    setIsValid(newValidArray);
  };

  const handleDeleteEducation = (educationIndex) => {
    const newEducations = [...educations];
    newEducations.splice(educationIndex, 1);
    setEducations(newEducations);
    setEdited(true);

    const newValidArray = [...isValid];
    newValidArray.splice(10 + educationIndex * 4, 4);
    setIsValid(newValidArray);
  };
  console.log(isValid);
  console.log(validate);

  const handleSaveEdits = () => {

    async function saveEdits(data) {
      const menteeID = await getMenteeID();
      await editMenteeProfile(data, menteeID);

      if (changedImage) {
        await uploadMenteeImage(image, await getMenteeID());
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
      age: age,
      gender: gender,
      phone: phone,
      email: email,
      education: educations,
      languages: languages,
      organization: organization,
      biography: about,
      location: location,
      is_private: privacy,
      video: videoUrl && {
        title: MENTEE_DEFAULT_VIDEO_NAME,
        url: videoUrl,
        tag: MENTEE_DEFAULT_VIDEO_NAME,
        date_uploaded: moment().format(),
      },
    };

    if (!isValid.includes(false)) {
      setSaving(true);
      saveEdits(updatedProfile);
    }
    
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
        style={{ overflow: "hidden" }}
        footer={
          <div>
            {validate && <b style={styles.alertToast}>Missing or Error Fields</b>}
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
        className="modal-window"
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
                value={name}
                valid={isValid[0]}
                validate={validate}
                errorPresent={name && name.length > 50}
                errorMessage="Name field is too long."
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
                value={about}
                errorPresent={about && about.length > 255}
                errorMessage="About field is too long."
              />
            </div>
          </div>
          <div className="modal-inner-container">
            <div className="modal-input-container">
              <ModalInput
                style={styles.modalInput}
                type="text"
                title="Location"
                clicked={inputClicked[5]}
                index={5}
                handleClick={handleClick}
                onChange={handleLocationChange}
                value={location}
              />
              <ModalInput
                style={styles.modalInput}
                type="text"
                title="Gender"
                clicked={inputClicked[6]}
                index={6}
                handleClick={handleClick}
                onChange={handleGenderChange}
                value={gender}
              />
            </div>
            <div className="modal-input-container">
              <ModalInput
                style={styles.modalInput}
                type="text"
                title="Age"
                clicked={inputClicked[6]}
                index={6}
                handleClick={handleClick}
                onChange={handleAgeChange}
                value={age}
              />
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
                value={languages}
                valid={isValid[7]}
                validate={validate}
              />
            </div>
            <div className="modal-input-container">
              <ModalInput
                style={styles.modalInput}
                type="text"
                title="Email"
                clicked={inputClicked[6]}
                index={6}
                handleClick={handleClick}
                onChange={handleEmailChange}
                value={email}
              />
              <ModalInput
                style={styles.modalInput}
                type="text"
                title="Phone"
                clicked={inputClicked[6]}
                index={6}
                handleClick={handleClick}
                onChange={handlePhoneChange}
                value={phone}
              />
            </div>
            <div className="modal-input-container">
              <ModalInput
                style={styles.modalInput}
                type="text"
                title="Organizaton"
                clicked={inputClicked[6]}
                index={6}
                handleClick={handleClick}
                onChange={handleOrganizationChange}
                value={organization}
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
            <div className="modal-education-header">Add Videos</div>
            <div>Introduce yourself via YouTube video!</div>
            <div className="modal-input-container">
              <ModalInput
                style={styles.modalInput}
                type="text"
                clicked={inputClicked[6]}
                index={6}
                handleClick={handleClick}
                onChange={handleVideoChange}
                placeholder="Paste Link"
              />
            </div>
            <div className="modal-education-header">Account Privacy</div>
            <Checkbox
              onChange={handlePrivacyChange}
              value={privacy}
              checked={privacy}
            >
              Private Account
            </Checkbox>
            <div>
              You'll be able to see your information, but your account will not
              show up when people are browsing accounts.
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

export default MenteeProfileModal;
