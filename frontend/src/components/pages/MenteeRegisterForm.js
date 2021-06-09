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

function MenteeRegisterForm(props) {
  const history = useHistory();
  const numInputs = 14;
  const [inputClicked, setInputClicked] = useState(
    new Array(numInputs).fill(false)
  ); // each index represents an input box, respectively
  const [isValid, setIsValid] = useState(new Array(numInputs).fill(true));
  const [validate, setValidate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [name, setName] = useState(null);
  const [location, setLocation] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [educations, setEducations] = useState([]);
  const [biography, setBiography] = useState();
  const [gender, setGender] = useState();
  const [age, setAge] = useState();
  const [email, setEmail] = useState();
  const [phone, setPhone] = useState();
  const [organization, setOrganization] = useState();

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
      name,
      gender,
      location,
      age,
      email,
      phone_number: phone,
      education: educations,
      languages: languages,
      biography,
      organization,
    };

    setSaving(true);
    await saveEdits(newProfile);
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
            onChange={(e) => {
              setName(e.target.value);
              let newValid = [...isValid];
              newValid[0] = !!e.target.value;
              setIsValid(newValid);
            }}
            value={name}
            valid={isValid[0]}
            validate={validate}
          />
        </div>
        <div className="modal-input-container">
          <ModalInput
            style={styles.modalInput}
            type="textarea"
            maxRows={3}
            hasBorder={false}
            title="Biography *"
            clicked={inputClicked[1]}
            index={1}
            handleClick={handleClick}
            onChange={(e) => setBiography(e.target.value)}
            value={biography}
          />
        </div>
        <div className="modal-input-container">
          <ModalInput
            style={styles.modalInput}
            type="text"
            title="Location"
            clicked={inputClicked[2]}
            index={2}
            handleClick={handleClick}
            onChange={(e) => setLocation(e.target.value)}
            value={location}
          />
          <ModalInput
            style={styles.modalInput}
            type="text"
            title="Gender *"
            clicked={inputClicked[3]}
            index={3}
            handleClick={handleClick}
            onChange={(e) => setGender(e.target.value)}
            value={gender}
          />
        </div>
        <div className="modal-input-container">
          <ModalInput
            style={styles.modalInput}
            type="dropdown-multiple"
            title="Age *"
            clicked={inputClicked[4]}
            index={4}
            handleClick={handleClick}
            onChange={(e) => {
              setAge(e);
              validateNotEmpty(e, 4);
            }}
            options={LANGUAGES}
            value={languages}
            valid={isValid[4]}
            validate={validate}
          />
          <ModalInput
            style={styles.modalInput}
            type="dropdown-multiple"
            title="Language(s)*"
            placeholder="Ex. English, Spanish"
            clicked={inputClicked[5]}
            index={5}
            options={LANGUAGES}
            handleClick={handleClick}
            onChange={(e) => {
              setLanguages(e);
              validateNotEmpty(e, 5);
            }}
            validate={validate}
            value={languages}
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
            onChange={(e) => setEmail(e.target.value)}
            options={LANGUAGES}
            value={languages}
            valid={isValid[7]}
            validate={validate}
          />
          <ModalInput
            style={styles.modalInput}
            type="text"
            title="Phone"
            clicked={inputClicked[7]}
            index={7}
            handleClick={handleClick}
            onChange={(e) => setPhone(e.target.value)}
            value={phone}
          />
        </div>
        <div className="modal-input-container" style={{width: "50%"}}>
          <ModalInput
            style={styles.modalInput}
            type="text"
            title="Organization Affliation"
            clicked={inputClicked[8]}
            index={8}
            handleClick={handleClick}
            onChange={(e) => setOrganization(e.target.value)}
            value={organization}
            valid={isValid[8]}
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

export default withRouter(MenteeRegisterForm);
