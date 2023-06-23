import React, { useEffect, useState } from "react";
import { withRouter, useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Checkbox, Button, message, Upload, Avatar } from "antd";
import ModalInput from "../ModalInput";
import { sendVerificationEmail } from "utils/auth.service";
import { useSelector } from "react-redux";
import {
  createMentorProfile,
  getAppState,
  isHaveAccount,
  uploadMentorImage,
} from "utils/api";
import { PlusCircleFilled, DeleteOutlined } from "@ant-design/icons";
import { MENTEE_DEFAULT_VIDEO_NAME } from "utils/consts";

import "../css/AntDesign.scss";
import "../css/Modal.scss";
import "../css/RegisterForm.scss";
import "../css/MenteeButton.scss";
import { validateUrl } from "utils/misc";
import moment from "moment";
import ImgCrop from "antd-img-crop";
import { UserOutlined, EditFilled } from "@ant-design/icons";

function RegisterForm(props) {
  const history = useHistory();
  const { t } = useTranslation();
  const options = useSelector((state) => state.options);
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
  const [password, setPassword] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState(null);
  const [video, setVideo] = useState(null);
  const [err, setErr] = useState(false);
  const [localProfile, setLocalProfile] = useState({});
  const [image, setImage] = useState(null);
  const [changedImage, setChangedImage] = useState(false);
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
                title={t("commonProfile.school")}
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
                title={t("commonProfile.graduationYear")}
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
                title={t("commonProfile.majors")}
                clicked={inputClicked[10 + i * 4 + 2]}
                index={10 + i * 4 + 2}
                handleClick={handleClick}
                onEducationChange={handleMajorsChange}
                educationIndex={i}
                options={[]}
                placeholder={t("commonProfile.majorsExamples")}
                value={education.majors}
                valid={isValid[10 + i * 4 + 2]}
                validate={validate}
              />
              <ModalInput
                style={styles.modalInput}
                height={65}
                type="text"
                title={t("commonProfile.degree")}
                clicked={inputClicked[10 + i * 4 + 3]}
                index={10 + i * 4 + 3}
                handleClick={handleClick}
                educationIndex={i}
                onEducationChange={handleDegreeChange}
                placeholder={t("commonProfile.degreeExample")}
                value={education.education_level}
                valid={isValid[10 + i * 4 + 3]}
                validate={validate}
              />
            </div>
            <div
              className="modal-input-container modal-education-delete-container"
              onClick={() => handleDeleteEducation(i)}
            >
              <div className="modal-education-delete-text">
                {t("commonProfile.delete")}
              </div>
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

  function handleNameChange(e) {
    const name = e.target.value;

    if (name.length <= 50) {
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

  function handleTitleChange(e) {
    const title = e.target.value;

    if (title.length <= 80) {
      let newValid = [...isValid];

      newValid[1] = true;

      setIsValid(newValid);
    } else {
      let newValid = [...isValid];
      newValid[1] = false;
      setIsValid(newValid);
    }
    setTitle(title);
    let newLocalProfile = { ...localProfile, professional_title: title };
    updateLocalStorage(newLocalProfile);
  }

  function handleAboutChange(e) {
    const about = e.target.value;

    if (about.length <= 1002) {
      let newValid = [...isValid];

      newValid[8] = true;

      setIsValid(newValid);
    } else {
      let newValid = [...isValid];
      newValid[8] = false;
      setIsValid(newValid);
    }

    setAbout(about);
    let newLocalProfile = { ...localProfile, biography: about };
    updateLocalStorage(newLocalProfile);
  }

  function handleWebsiteChange(e) {
    const website = e.target.value;
    if (website != "" && website != null) {
      if (validateUrl(website)) {
        let newValid = [...isValid];

        newValid[3] = true;

        setIsValid(newValid);
      } else {
        let newValid = [...isValid];
        newValid[3] = false;
        setIsValid(newValid);
      }
    }
    setWebsite(website);
    let newLocalProfile = { ...localProfile, website: website };
    updateLocalStorage(newLocalProfile);
  }

  function handleLinkedinChange(e) {
    const linkedin = e.target.value;
    if (linkedin != "" && linkedin != null) {
      if (validateUrl(linkedin)) {
        let newValid = [...isValid];

        newValid[2] = true;

        setIsValid(newValid);
      } else {
        let newValid = [...isValid];
        newValid[2] = false;
        setIsValid(newValid);
      }
    }
    setLinkedin(linkedin);
    let newLocalProfile = { ...localProfile, linkedin: linkedin };
    updateLocalStorage(newLocalProfile);
  }

  function handleLocationChange(e) {
    const location = e.target.value;
    setLocation(location);
    let newLocalProfile = { ...localProfile, location: location };
    updateLocalStorage(newLocalProfile);
  }

  function handleGroupAvailChange(e) {
    setGroupAvailable(e.target.checked);
    let newLocalProfile = {
      ...localProfile,
      offers_group_appointments: e.target.checked,
    };
    updateLocalStorage(newLocalProfile);
  }

  function handleInPersonChange(e) {
    setInPersonAvailable(e.target.checked);
    let newLocalProfile = {
      ...localProfile,
      offers_in_person: e.target.checked,
    };
    updateLocalStorage(newLocalProfile);
  }
  function handleVideoChange(e) {
    setVideo(e.target.value);
    let newLocalProfile = { ...localProfile, video: e.target.value };
    updateLocalStorage(newLocalProfile);
  }

  function updateLocalStorage(newLocalProfile) {
    setLocalProfile(newLocalProfile);
    localStorage.setItem("mentor", JSON.stringify(newLocalProfile));
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

      const res = await createMentorProfile(data, isHave);
      const mentorId =
        res && res.data && res.data.result ? res.data.result.mentorId : false;

      setSaving(false);
      setValidate(false);

      setError(false);
      setIsValid([...isValid].fill(true));
      info("Your account has been created now you can login to Mentee");
      await sendVerificationEmail(props.headEmail);
      if (mentorId) {
        if (changedImage) {
          await uploadMentorImage(image, mentorId);
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
      name: name,
      email: props.headEmail,
      professional_title: title,
      linkedin: linkedin,
      website: website,
      education: educations,
      languages: languages,
      specializations: specializations,
      biography: about,
      offers_in_person: inPersonAvailable,
      offers_group_appointments: groupAvailable,
      password: password,
      video: video
        ? {
            title: MENTEE_DEFAULT_VIDEO_NAME,
            url: video,
            tag: MENTEE_DEFAULT_VIDEO_NAME,
            date_uploaded: moment().format(),
          }
        : undefined,
    };
    if (!isValid.includes(false)) {
      setSaving(true);
      await saveEdits(newProfile);
    }
  };

  return (
    <div className="register-content">
      <div className="register-header">
        <h2>{t("commonProfile.welcome")}</h2>
        {error && (
          <div className="register-error">
            {t("commonProfile.missingFields")}
          </div>
        )}
        {err && <p>{t("commonProfile.errorTrainingSteps")}</p>}
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
            title={t("commonProfile.fullName")}
            clicked={inputClicked[0]}
            index={0}
            handleClick={handleClick}
            onChange={handleNameChange}
            value={name}
            valid={isValid[0]}
            validate={validate}
            errorPresent={name && name.length > 50}
            errorMessage={t("commonProfile.fieldTooLong")}
          />

          <ModalInput
            style={styles.modalInput}
            type="text"
            title={t("mentorProfile.professionalTitle")}
            clicked={inputClicked[1]}
            index={1}
            handleClick={handleClick}
            onChange={handleTitleChange}
            errorPresent={title && title.length > 80}
            errorMessage={t("commonProfile.fieldTooLong")}
            value={title}
            valid={isValid[1]}
            validate={validate}
          />
        </div>
        {!props.isHave ? (
          <div className="modal-input-container">
            <ModalInput
              style={styles.modalInput}
              type="password"
              title={t("common.password")}
              clicked={inputClicked[30]}
              index={30}
              handleClick={handleClick}
              onChange={handlePassChange}
              value={password}
              valid={isValid[30]}
              validate={validate}
              errorPresent={password && password.length > 50}
              errorMessage={t("commonProfile.fieldTooLong")}
            />
            <ModalInput
              style={styles.modalInput}
              type="password"
              title={t("commonProfile.confirmPassword")}
              clicked={inputClicked[31]}
              index={31}
              handleClick={handleClick}
              onChange={handlePassConfirmChange}
              value={confirmPassword}
              valid={isValid[31]}
              validate={validate}
              errorPresent={password != confirmPassword}
              errorMessage={t("commonProfile.passwordMismatch")}
            />
          </div>
        ) : (
          ""
        )}

        <div className="modal-input-container Bio">
          <ModalInput
            style={styles.modalInput}
            type="textarea"
            maxRows={3}
            hasBorder={false}
            title={t("commonProfile.biography")}
            clicked={inputClicked[2]}
            index={2}
            handleClick={handleClick}
            onChange={handleAboutChange}
            value={about}
            valid={isValid[8]}
            validate={validate}
            errorPresent={about && about.length > 1002}
            errorMessage={t("commonProfile.fieldTooLong")}
          />
        </div>
        <div className="divider" />
        <div className="modal-availability-checkbox">
          <Checkbox
            className="modal-availability-checkbox-text"
            clicked={inputClicked[3]}
            index={3}
            handleClick={handleClick}
            onChange={handleInPersonChange}
            checked={inPersonAvailable}
          >
            {t("mentorProfile.availableInPerson")}
          </Checkbox>
          <div></div>
          <Checkbox
            className="modal-availability-checkbox-text"
            clicked={inputClicked[4]}
            index={4}
            handleClick={handleClick}
            onChange={handleGroupAvailChange}
            checked={groupAvailable}
          >
            {t("mentorProfile.availableGroupAppointments")}
          </Checkbox>
        </div>
        <div className="modal-input-container">
          <ModalInput
            style={styles.modalInput}
            type="text"
            title={t("commonProfile.location")}
            clicked={inputClicked[5]}
            index={5}
            handleClick={handleClick}
            onChange={handleLocationChange}
            value={location}
          />
          <ModalInput
            style={styles.modalInput}
            type="text"
            title={t("commonProfile.website")}
            clicked={inputClicked[6]}
            index={6}
            handleClick={handleClick}
            onChange={handleWebsiteChange}
            value={website}
            errorPresent={website && !validateUrl(website)}
            errorMessage={t("commonProfile.invalidUrl")}
            valid={isValid[3]}
            validate={validate}
          />
        </div>
        <div className="modal-input-container">
          <ModalInput
            style={styles.modalInput}
            type="dropdown-multiple"
            title={t("commonProfile.languages")}
            clicked={inputClicked[7]}
            index={7}
            handleClick={handleClick}
            onChange={(e) => {
              setLanguages(e);
              validateNotEmpty(e, 7);
              let newLocalProfile = { ...localProfile, languages: e };
              updateLocalStorage(newLocalProfile);
            }}
            placeholder={t("commonProfile.languagesExample")}
            options={options.languages}
            value={languages}
            valid={isValid[7]}
            validate={validate}
          />
          <ModalInput
            style={styles.modalInput}
            type="text"
            title={t("commonProfile.linkedin")}
            clicked={inputClicked[8]}
            index={8}
            handleClick={handleClick}
            onChange={handleLinkedinChange}
            value={linkedin}
            errorPresent={linkedin && !validateUrl(linkedin)}
            errorMessage={t("commonProfile.invalidUrl")}
            valid={isValid[2]}
            validate={validate}
          />
        </div>
        <div className="modal-input-container">
          <ModalInput
            style={styles.modalInput}
            type="dropdown-multiple"
            title={t("mentorProfile.specializations")}
            clicked={inputClicked[9]}
            index={9}
            handleClick={handleClick}
            onChange={(e) => {
              setSpecializations(e);
              validateNotEmpty(e, 9);

              let newLocalProfile = { ...localProfile, specializations: e };
              updateLocalStorage(newLocalProfile);
            }}
            options={options.specializations}
            value={specializations}
            valid={isValid[9]}
            validate={validate}
          />
        </div>
        <div className="modal-education-header">
          {t("commonProfile.education")}
        </div>
        {renderEducationInputs()}
        <div
          className="modal-input-container modal-education-add-container"
          onClick={handleAddEducation}
        >
          <PlusCircleFilled className="modal-education-add-icon" />
          <div className="modal-education-add-text">
            {t("commonProfile.addMoreEducation")}
          </div>
        </div>
        <div className="modal-education-header">
          {t("commonProfile.addVideos")}
        </div>
        <div className="modal-education-body">
          <div>{t("commonProfile.introductionVideo")}</div>
        </div>
        <div className="modal-input-container">
          <ModalInput
            style={styles.modalInput}
            type="text"
            clicked={inputClicked[6]}
            index={6}
            handleClick={handleClick}
            onChange={handleVideoChange}
            placeholder={t("commonProfile.pasteLink")}
            value={video}
          />
        </div>
      </div>
      <div className="btn-r2">
        {validate && (
          <b style={styles.alertToast}>{t("commonProfile.missingFields")}</b>
        )}
        <Button
          type="default"
          shape="round"
          className="regular-button"
          onClick={handleSaveEdits}
          loading={saving}
        >
          {t("common.save")}
        </Button>
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
    marginBottom: "40px",
  },
  alertToast: {
    color: "#FF0000",
    display: "inline-block",
    marginRight: 10,
  },
  saveButton: {
    position: "relative",
    top: "60em",
  },
};

export default withRouter(RegisterForm);
