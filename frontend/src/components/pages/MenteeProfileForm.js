import React, { useEffect, useState } from "react";
import { withRouter, useHistory } from "react-router-dom";
import { Checkbox, Button, message, Upload, Avatar } from "antd";
import ModalInput from "../ModalInput";
import { refreshToken, getCurrentUser, getUserEmail } from "utils/auth.service";
import {
  createMenteeProfile,
  getAppState,
  isHaveAccount,
  uploadMenteeImage,
  getDisplaySpecializations,
  getDisplayLanguages,
} from "utils/api";
import { PlusCircleFilled, DeleteOutlined } from "@ant-design/icons";
import {
  MENTEE_DEFAULT_VIDEO_NAME,
  AGE_RANGES,
} from "utils/consts";
import { useMediaQuery } from "react-responsive";
import moment from "moment";
import "../css/AntDesign.scss";
import "../css/Modal.scss";
import "../css/RegisterForm.scss";
import "../css/MenteeButton.scss";
import { sendVerificationEmail } from "utils/auth.service";
import ImgCrop from "antd-img-crop";
import { UserOutlined, EditFilled } from "@ant-design/icons";
function MenteeRegisterForm(props) {
  const history = useHistory();
  const isMobile = useMediaQuery({ query: `(max-width: 500px)` });
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
  const [phone, setPhone] = useState();
  const [organization, setOrganization] = useState();
  const [privacy, setPrivacy] = useState(false);
  const [video, setVideo] = useState();
  const [password, setPassword] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState(null);
  const [localProfile, setLocalProfile] = useState({});
  const [specializations, setSpecializations] = useState([]);
  const [err, setErr] = useState(false);
  const [image, setImage] = useState(null);
  const [changedImage, setChangedImage] = useState(false);
  const [langMasters, setLangMasters] = useState([]);
  const [specMasters, setSpecMasters] = useState([]);

  useEffect(() => {
    const mentee = JSON.parse(localStorage.getItem("mentee"));

    async function getMasters() {
      setLangMasters(await getDisplayLanguages());
      setSpecMasters(await getDisplaySpecializations());
    }
    getMasters();
  }, []);
  const info = (msg) => {
    message.success(msg);
  };
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

  function updateLocalStorage(newLocalProfile) {
    setLocalProfile(newLocalProfile);
    localStorage.setItem("mentee", JSON.stringify(newLocalProfile));
  }

  function handleSchoolChange(e, index) {
    const newEducations = [...educations];
    let education = newEducations[index];
    education.school = e.target.value;
    newEducations[index] = education;
    setEducations(newEducations);
    let newLocalProfile = { ...localProfile, education: newEducations };
    updateLocalStorage(newLocalProfile);

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
    let newLocalProfile = { ...localProfile, education: newEducations };
    updateLocalStorage(newLocalProfile);

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
    let newLocalProfile = { ...localProfile, education: newEducations };
    updateLocalStorage(newLocalProfile);

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
    let newLocalProfile = { ...localProfile, education: newEducations };
    updateLocalStorage(newLocalProfile);

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
    let newLocalProfile = { ...localProfile, education: newEducations };
    updateLocalStorage(newLocalProfile);

    setIsValid([...isValid, true, true, true, true]);
  };

  const handleDeleteEducation = (educationIndex) => {
    const newEducations = [...educations];
    newEducations.splice(educationIndex, 1);
    setEducations(newEducations);
    let newLocalProfile = { ...localProfile, education: newEducations };
    updateLocalStorage(newLocalProfile);

    const newValidArray = [...isValid];
    newValidArray.splice(10 + educationIndex * 4, 4);
    setIsValid(newValidArray);
  };

  function handleVideoChange(e) {
    setVideo(e.target.value);
    let newLocalProfile = { ...localProfile, video: e.target.value };
    updateLocalStorage(newLocalProfile);
  }

  function handlePrivacyChange(e) {
    setPrivacy(e.target.checked);
    let newLocalProfile = { ...localProfile, is_private: e.target.checked };
    updateLocalStorage(newLocalProfile);
  }

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
    let newLocalProfile = { ...localProfile, name: name };
    updateLocalStorage(newLocalProfile);
  }
  function handlePassChange(e) {
    const pass = e.target.value;

    if (pass.length >= 8) {
      let newValid = [...isValid];

      newValid[30] = true;

      setIsValid(newValid);
    } else {
      let newValid = [...isValid];
      newValid[30] = false;
      setIsValid(newValid);
    }
    setPassword(pass);
  }
  function handlePassConfirmChange(e) {
    const pass = e.target.value;

    if (pass === password) {
      let newValid = [...isValid];

      newValid[31] = true;

      setIsValid(newValid);
    } else {
      let newValid = [...isValid];
      newValid[31] = false;
      setIsValid(newValid);
    }
    setConfirmPassword(pass);
    let newLocalProfile = { ...localProfile, password: pass };
    updateLocalStorage(newLocalProfile);
  }
  function handleBiographyChange(e) {
    const biography = e.target.value;

    if (biography.length < 1002) {
      let newValid = [...isValid];

      newValid[8] = true;

      setIsValid(newValid);
    } else {
      let newValid = [...isValid];
      newValid[8] = false;
      setIsValid(newValid);
    }

    setBiography(biography);
    let newLocalProfile = { ...localProfile, biography: biography };
    updateLocalStorage(newLocalProfile);
  }

  function handleLocationChange(e) {
    const location = e.target.value;

    if (location.length < 70) {
      let newValid = [...isValid];

      newValid[9] = true;

      setIsValid(newValid);
    } else {
      let newValid = [...isValid];
      newValid[9] = false;
      setIsValid(newValid);
    }

    setLocation(location);
    let newLocalProfile = { ...localProfile, location: location };
    updateLocalStorage(newLocalProfile);
  }

  function handleGenderChange(e) {
    const gender = e.target.value;
    setGender(gender);
    let newLocalProfile = { ...localProfile, gender: gender };
    updateLocalStorage(newLocalProfile);
  }

  function handleAgeChange(e) {
    setAge(e);
    let newLocalProfile = { ...localProfile, age: e };
    updateLocalStorage(newLocalProfile);
    validateNotEmpty(e, 4);
  }

  function handleLanguageChange(e) {
    setLanguages(e);
    validateNotEmpty(e, 5);
    let newLocalProfile = { ...localProfile, languages: e };
    updateLocalStorage(newLocalProfile);
  }

  function handlePhoneChange(e) {
    setPhone(e.target.value);
    let newLocalProfile = { ...localProfile, phone_number: e.target.value };
    updateLocalStorage(newLocalProfile);
  }

  function handleOrganizationChange(e) {
    setOrganization(e.target.value);
    let newLocalProfile = { ...localProfile, organization: e.target.value };
    updateLocalStorage(newLocalProfile);
  }

  const handleSaveEdits = async () => {
    async function saveEdits(data) {
      const { isHave, isHaveProfile, isVerified } = await isHaveAccount(
        props.headEmail,
        props.role
      );
      if (isHave == false) {
        const state = await getAppState(props.headEmail, props.role);
        if (state != "BuildProfile" && !isVerified) {
          setErr(true);
          return;
        }
      }
      const res = await createMenteeProfile(data, props.isHave);
      const menteeId =
        res && res.data && res.data.result ? res.data.result.mentorId : false;

      setSaving(false);
      setValidate(false);

      if (menteeId) {
        setError(false);
        setIsValid([...isValid].fill(true));
        info("Your account has been created now you can login to Mentee");
        await sendVerificationEmail(props.headEmail);
        if (changedImage) {
          await uploadMenteeImage(image, menteeId);
        }

        history.push("/login");
      } else {
        setError(true);
      }
    }

    if (isValid.includes(false)) {
      setValidate(true);
      return;
    }

    const newProfile = {
      name,
      password: password,
      gender,
      location,
      age,
      email: props.headEmail,
      phone_number: phone,
      education: educations,
      languages: languages,
      biography,
      organization,
      specializations: specializations,
      video: video
        ? {
            title: MENTEE_DEFAULT_VIDEO_NAME,
            url: video,
            tag: MENTEE_DEFAULT_VIDEO_NAME,
            date_uploaded: moment().format(),
          }
        : undefined,
      is_private: privacy,
    };

    if (!isValid.includes(false)) {
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
        <div>{validate && <b style={styles.alertToast}>Missing Fields</b>}</div>
      </div>
      <div className="modal-profile-container2">
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
        <ImgCrop rotate aspect={5 / 3}>
          <Upload
            onChange={async (file) => {
              setImage(file.file.originFileObj);
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
        </ImgCrop>
      </div>
      <div className="modal-inner-container">
        <div className="modal-input-container">
          <ModalInput
            style={styles.modalInput}
            type="text"
            title="Full Name *"
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
        {!props.isHave ? (
          <div className="modal-input-container">
            <ModalInput
              style={styles.modalInput}
              type="password"
              title="Password *"
              clicked={inputClicked[30]}
              index={30}
              handleClick={handleClick}
              onChange={handlePassChange}
              value={password}
              valid={isValid[30]}
              validate={validate}
              errorPresent={password && password.length > 50}
              errorMessage="password field is too long."
            />
            <ModalInput
              style={styles.modalInput}
              type="password"
              title="Confirm Password *"
              clicked={inputClicked[31]}
              index={31}
              handleClick={handleClick}
              onChange={handlePassConfirmChange}
              value={confirmPassword}
              valid={isValid[31]}
              validate={validate}
              errorPresent={password != confirmPassword}
              errorMessage="password not match."
            />
          </div>
        ) : (
          ""
        )}
        <div className="modal-input-container Bio">
          <ModalInput
            style={styles.textareaInput}
            type="textarea"
            maxRows={3}
            hasBorder={false}
            title="Biography *"
            clicked={inputClicked[1]}
            index={1}
            handleClick={handleClick}
            onChange={handleBiographyChange}
            value={biography}
            valid={isValid[8]}
            validate={validate}
            errorPresent={biography && biography.length > 1002}
            errorMessage="Biography field is too long."
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
            onChange={handleLocationChange}
            value={location}
            valid={isValid[9]}
            validate={validate}
            errorPresent={location && location.length > 70}
            errorMessage="Location field is too long."
          />
          <ModalInput
            style={styles.modalInput}
            type="text"
            title="Gender *"
            clicked={inputClicked[3]}
            index={3}
            handleClick={handleClick}
            onChange={handleGenderChange}
            value={gender}
          />
        </div>
        <div className="modal-input-container">
          <ModalInput
            style={styles.modalInput}
            type="dropdown-single"
            title="Age *"
            clicked={inputClicked[4]}
            index={4}
            handleClick={handleClick}
            onChange={handleAgeChange}
            options={AGE_RANGES}
            value={age}
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
            options={langMasters}
            handleClick={handleClick}
            onChange={handleLanguageChange}
            validate={validate}
            valid={isValid[5]}
            value={languages}
          />
        </div>
        <div className="modal-input-container">
          <ModalInput
            style={styles.modalInput}
            type="text"
            title="Phone"
            clicked={inputClicked[7]}
            index={7}
            handleClick={handleClick}
            onChange={handlePhoneChange}
            value={phone}
          />
          <ModalInput
            style={styles.modalInput}
            type="text"
            title="Organization Affliation *"
            clicked={inputClicked[8]}
            index={8}
            handleClick={handleClick}
            onChange={handleOrganizationChange}
            value={organization}
            valid={isValid[8]}
            validate={validate}
          />
        </div>
        <ModalInput
          style={styles.modalInput}
          type="dropdown-multiple"
          title="Areas of interest "
          clicked={inputClicked[99]}
          index={99}
          handleClick={handleClick}
          onChange={(e) => {
            setSpecializations(e);
            let newLocalProfile = { ...localProfile, specializations: e };
            updateLocalStorage(newLocalProfile);
          }}
          options={specMasters}
          value={specializations}
          valid={isValid[99]}
          validate={validate}
        />
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
        <div className="modal-education-body">
          <div>Introduce yourself via YouTube video!</div>
        </div>
        <div className="modal-input-container">
          <ModalInput
            style={styles.modalInput}
            type="text"
            clicked={inputClicked[6]}
            index={6}
            handleClick={handleClick}
            onChange={handleVideoChange}
            placeholder="Paste Link"
            value={video}
          />
        </div>
        <div className="modal-education-header">Account Privacy</div>
        <div className="modal-education-body">
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
          {err && <p>Please complete apply and training steps first</p>}
          <Button
            type="default"
            shape="round"
            className="regular-button"
            style={styles.saveButton}
            onClick={handleSaveEdits}
            loading={saving}
          >
            Save
          </Button>
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
  textareaInput: {
    height: 65,
    margin: 18,
    padding: 4,
    paddingTop: 6,
    marginBottom: "80px",
  },
  alertToast: {
    color: "#FF0000",
    display: "inline-block",
    marginRight: 10,
  },

  saveButton: {
    position: "relative",
    top: "2em",
  },
};

export default withRouter(MenteeRegisterForm);
