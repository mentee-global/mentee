import React, { useEffect, useState } from "react";
import { withRouter, useHistory } from "react-router-dom";
import firebase from "firebase";
import { Checkbox, Button } from "antd";
import ModalInput from "../ModalInput";
import {
  getRegistrationStage,
  isLoggedIn,
  refreshToken,
  getCurrentUser,
  getUserEmail,
} from "utils/auth.service";
import { createMentorProfile } from "utils/api";
import { PlusCircleFilled, DeleteOutlined } from "@ant-design/icons";
import { LANGUAGES, SPECIALIZATIONS, REGISTRATION_STAGE } from "utils/consts";
import "../css/AntDesign.scss";
import "../css/Modal.scss";
import "../css/RegisterForm.scss";
import "../css/MenteeButton.scss";
import { validateUrl } from "utils/misc";

function RegisterForm(props) {
  const history = useHistory();
  const numInputs = 14;
  const [inputClicked, setInputClicked] = useState(
    new Array(numInputs).fill(false)
  ); // each index represents an input box, respectively
  const [isValid, setIsValid] = useState(new Array(numInputs).fill(true));
  const [validate, setValidate] = useState(false);
  const [error, setError] = useState(false);
  const [name, setName] = useState(null);
  const [title, setTitle] = useState(null);
  const [about, setAbout] = useState(null);
  const [inPersonAvailable, setInPersonAvailable] = useState(false);
  const [groupAvailable, setGroupAvailable] = useState(false);
  const [location, setLocation] = useState(null);
  const [website, setWebsite] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [linkedin, setLinkedin] = useState(null);
  const [specializations, setSpecializations] = useState([]);
  const [educations, setEducations] = useState([]);
  const [saving, setSaving] = useState(false);

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
                title="School *"
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
                title="End Year/Expected *"
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
                title="Major(s) *"
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
                title="Degree *"
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

  function validateNotEmpty(arr, index) {
    let tempValid = isValid;
    tempValid[index] = arr.length > 0;
    setIsValid(tempValid);
  }

  function handleSchoolChange(e, index) {
    const newEducations = [...educations];
    let education = newEducations[index];
    education.school = e.target.value;
    newEducations[index] = education;
    setEducations(newEducations);

    let newValid = [...isValid];
    newValid[10 + index * 4] = !!education.school;
    setIsValid(newValid);
  }

  function handleGraduationDateChange(e, index) {
    const newEducations = [...educations];
    let education = newEducations[index];
    education.graduation_year = e.target.value;
    newEducations[index] = education;
    setEducations(newEducations);

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
    setIsValid([...isValid, true, true, true, true]);
  };

  const handleDeleteEducation = (educationIndex) => {
    const newEducations = [...educations];
    newEducations.splice(educationIndex, 1);
    setEducations(newEducations);

    const newValidArray = [...isValid];
    newValidArray.splice(10 + educationIndex * 4, 4);
    setIsValid(newValidArray);
  };

  function handleNameChange(e) {
    const name = e.target.value;

    if (name.length < 50) {
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

  function handleWebsiteChange(e) {
    const website = e.target.value;

    if (validateUrl(website)) {
      let newValid = [...isValid];

      newValid[3] = true;

      setIsValid(newValid);
    } else {
      let newValid = [...isValid];
      newValid[3] = false;
      setIsValid(newValid);
    }

    setWebsite(website);
  }

  function handleLinkedinChange(e) {
    const linkedin = e.target.value;

    if (validateUrl(linkedin)) {
      let newValid = [...isValid];

      newValid[2] = true;

      setIsValid(newValid);
    } else {
      let newValid = [...isValid];
      newValid[2] = false;
      setIsValid(newValid);
    }

    setLinkedin(linkedin);
  }

  const handleSaveEdits = async () => {
    async function saveEdits(data) {
      const res = await createMentorProfile(data);
      const mentorId =
        res && res.data && res.data.result ? res.data.result.mentorId : false;

      setSaving(false);
      setValidate(false);

      if (mentorId) {
        setError(false);
        setIsValid([...isValid].fill(true));
        await refreshToken();

        const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
          unsubscribe();
          history.push("/profile");
        });
      } else {
        setError(true);
      }
    }

    if (isValid.includes(false)) {
      setValidate(true);
      return;
    }

    const firebase_user = getCurrentUser();
    const email = await getUserEmail();
    const newProfile = {
      firebase_uid: firebase_user ? firebase_user.uid : undefined,
      name: name,
      email: email,
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
    if (isValid.includes(false)) {
      setSaving(true);
      await saveEdits(newProfile);
    }
  };

  return (
    <div className="register-content">
      <div className="register-header">
        <h2>Welcome. Tell us about yourself.</h2>
        {error && (
          <div className="register-error">
            Error or missing fields, try again.
          </div>
        )}
        <div>
          {validate && <b style={styles.alertToast}>Missing Fields</b>}
          <Button
            type="default"
            shape="round"
            className="regular-button"
            onClick={handleSaveEdits}
            loading={saving}
          >
            Save
          </Button>
        </div>
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
          <ModalInput
            style={styles.modalInput}
            type="text"
            title="Professional Title *"
            clicked={inputClicked[1]}
            index={1}
            handleClick={handleClick}
            onChange={(e) => {
              setTitle(e.target.value);
              let newValid = [...isValid];
              newValid[1] = !!e.target.value;
              setIsValid(newValid);
            }}
            value={title}
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
            value={about}
            valid={isValid[8]}
            validate={validate}
            errorPresent={about && about.length > 255}
            errorMessage="About field is too long."
          />
        </div>
        <div className="divider" />
        <div className="modal-availability-checkbox">
          <Checkbox
            className="modal-availability-checkbox-text"
            clicked={inputClicked[3]}
            index={3}
            handleClick={handleClick}
            onChange={(e) => setInPersonAvailable(e.target.checked)}
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
            onChange={(e) => setGroupAvailable(e.target.checked)}
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
            onChange={(e) => setLocation(e.target.value)}
            value={location}
          />
          <ModalInput
            style={styles.modalInput}
            type="text"
            title="Website"
            clicked={inputClicked[6]}
            index={6}
            handleClick={handleClick}
            onChange={handleWebsiteChange}
            value={website}
            valid={isValid[3]}
            validate={validate}
            errorPresent={website && !validateUrl(website)}
            errorMessage="Invalid URL."
          />
        </div>
        <div className="modal-input-container">
          <ModalInput
            style={styles.modalInput}
            type="dropdown-multiple"
            title="Languages *"
            clicked={inputClicked[7]}
            index={7}
            handleClick={handleClick}
            onChange={(e) => {
              setLanguages(e);
              validateNotEmpty(e, 7);
            }}
            placeholder="Ex. English, Spanish"
            options={LANGUAGES}
            value={languages}
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
            value={linkedin}
            valid={isValid[2]}
            validate={validate}
            errorPresent={linkedin && !validateUrl(linkedin)}
            errorMessage="Invalid URL."
          />
        </div>
        <div className="modal-input-container">
          <ModalInput
            style={styles.modalInput}
            type="dropdown-multiple"
            title="Specializations *"
            clicked={inputClicked[9]}
            index={9}
            handleClick={handleClick}
            onChange={(e) => {
              setSpecializations(e);
              validateNotEmpty(e, 9);
            }}
            options={SPECIALIZATIONS}
            value={specializations}
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
  );
}

const styles = {
  modalInput: {
    height: 65,
    margin: 18,
    padding: 4,
    paddingTop: 6,
  },
  alertToast: {
    color: "#FF0000",
    display: "inline-block",
    marginRight: 10,
  },
};

export default withRouter(RegisterForm);
