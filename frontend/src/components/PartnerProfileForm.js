import React, { useState } from "react";
import { withRouter, useHistory } from "react-router-dom";
import { Checkbox, Button, message, Upload, Avatar } from "antd";
import { useTranslation } from "react-i18next";
import ModalInput from "./ModalInput";
import { createPartnerProfile, uploadPartnerImage } from "../utils/api";
import { REGIONS, SDGS } from "../utils/consts";
import { sendVerificationEmail } from "utils/auth.service";

import "./css/AntDesign.scss";
import "./css/Modal.scss";
import "./css/RegisterForm.scss";
import "./css/MenteeButton.scss";
import { validateUrl } from "../utils/misc";
import ImgCrop from "antd-img-crop";
import { UserOutlined, EditFilled } from "@ant-design/icons";

function RegisterForm(props) {
  const history = useHistory();
  const { t } = useTranslation();
  const numInputs = 14;
  const [inputClicked, setInputClicked] = useState(
    new Array(numInputs).fill(false)
  ); // each index represents an input box, respectively
  const [isValid, setIsValid] = useState(new Array(numInputs).fill(true));
  const [validate, setValidate] = useState(false);
  const [error, setError] = useState(false);
  const [organization, setOrganizaton] = useState(null);
  const [location, setLocation] = useState(null);
  const [person_name, setrPersonName] = useState(null);
  const [regions, setRegions] = useState([]);
  const [intro, setIntro] = useState(null);
  const [website, setWebsite] = useState(null);
  const [linkedin, setLinkedin] = useState(null);
  const [sdgs, setSdgs] = useState([]);
  const [topics, setTopics] = useState(null);
  const [open_grants, setOpenGrants] = useState(false);
  const [open_projects, setOpenProjects] = useState(false);
  const [image, setImage] = useState(null);
  const [changedImage, setChangedImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState(null);
  const [sdgErr, setSdgErr] = useState(false);
  const [localProfile, setLocalProfile] = useState({});

  const info = (msg) => {
    message.success(msg);
  };

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

  function handleOrganizationChange(e) {
    const organization = e.target.value;

    if (organization.length <= 50) {
      let newValid = [...isValid];

      newValid[0] = true;

      setIsValid(newValid);
    } else {
      let newValid = [...isValid];
      newValid[0] = false;
      setIsValid(newValid);
    }
    setOrganizaton(organization);
    let newLocalProfile = { ...localProfile, organization: organization };
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

  function handlepersonNameChange(e) {
    const person_name = e.target.value;

    if (person_name.length <= 80) {
      let newValid = [...isValid];

      newValid[1] = true;

      setIsValid(newValid);
    } else {
      let newValid = [...isValid];
      newValid[1] = false;
      setIsValid(newValid);
    }
    setrPersonName(person_name);
    let newLocalProfile = { ...localProfile, person_name: person_name };
    updateLocalStorage(newLocalProfile);
  }

  function handleIntroChange(e) {
    const intro = e.target.value;

    if (intro.length <= 1002) {
      let newValid = [...isValid];

      newValid[8] = true;

      setIsValid(newValid);
    } else {
      let newValid = [...isValid];
      newValid[8] = false;
      setIsValid(newValid);
    }

    setIntro(intro);
    let newLocalProfile = { ...localProfile, intro: intro };
    updateLocalStorage(newLocalProfile);
  }
  function handleTopicsChange(e) {
    const topics = e.target.value;

    if (topics.length <= 1002) {
      let newValid = [...isValid];

      newValid[8] = true;

      setIsValid(newValid);
    } else {
      let newValid = [...isValid];
      newValid[8] = false;
      setIsValid(newValid);
    }

    setTopics(topics);
    let newLocalProfile = { ...localProfile, topics: topics };
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
    } else {
      let newValid = [...isValid];
      newValid[2] = true;
      setIsValid(newValid);
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
    } else {
      let newValid = [...isValid];
      newValid[2] = true;
      setIsValid(newValid);
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

  function handleOpenProjects(e) {
    setOpenProjects(e.target.checked);
    let newLocalProfile = {
      ...localProfile,
      open_projects: e.target.checked,
    };
    updateLocalStorage(newLocalProfile);
  }

  function handleOpenGrants(e) {
    setOpenGrants(e.target.checked);
    let newLocalProfile = {
      ...localProfile,
      open_grants: e.target.checked,
    };
    updateLocalStorage(newLocalProfile);
  }

  function updateLocalStorage(newLocalProfile) {
    setLocalProfile(newLocalProfile);
    localStorage.setItem("partner", JSON.stringify(newLocalProfile));
  }

  const handleSaveEdits = async () => {
    async function saveEdits(data) {
      const res = await createPartnerProfile(data, props.isHave);
      const mentorId =
        res && res.data && res.data.result ? res.data.result.mentorId : false;

      setSaving(false);
      setValidate(false);
      if (mentorId) {
        if (changedImage) {
          await uploadPartnerImage(image, mentorId);
        }

        setError(false);
        setIsValid([...isValid].fill(true));
        info(t("commonProfile.accountCreated"));
        await sendVerificationEmail(props.headEmail);
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
      email: props.headEmail,
      password: password,
      organization: organization,
      location: location,
      person_name: person_name,
      regions: regions,
      intro: intro,
      linkedin: linkedin,
      website: website,
      sdgs: sdgs,
      topics: topics,
      open_grants: open_grants,
      open_projects: open_projects,
    };
    if (sdgs.length == 0) {
      setSdgErr(true);
      return;
    } else {
      setSdgErr(false);
    }
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
      </div>
      <div className="modal-profile-container2">
        <Avatar
          size={120}
          icon={<UserOutlined />}
          className="modal-profile-icon"
          src={
            changedImage
              ? image && URL.createObjectURL(image)
              : image && image.urls
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
            title={t("partnerProfile.organizationName")}
            clicked={inputClicked[0]}
            index={0}
            handleClick={handleClick}
            onChange={handleOrganizationChange}
            value={organization}
            valid={isValid[0]}
            validate={validate}
            errorPresent={organization && organization.length > 50}
            errorMessage={t("commonProlfile.fieldTooLong")}
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
        <div className="modal-input-container">
          <ModalInput
            style={styles.modalInput}
            type="text"
            title={t("partnerProfile.location")}
            clicked={inputClicked[5]}
            index={5}
            handleClick={handleClick}
            onChange={handleLocationChange}
            value={location}
          />
        </div>
        <div className="modal-input-container">
          <ModalInput
            style={styles.modalInput}
            type="text"
            title={t("partnerProfile.contactFullName")}
            clicked={inputClicked[1]}
            index={1}
            handleClick={handleClick}
            onChange={handlepersonNameChange}
            errorPresent={person_name && person_name.length > 80}
            errorMessage={t("commonProfile.fieldTooLong")}
            value={person_name}
            valid={isValid[1]}
            validate={validate}
          />
        </div>

        <div className="modal-input-container">
          <ModalInput
            style={styles.modalInput}
            type="dropdown-multiple"
            title={t("partnerProfile.regionsWork")}
            clicked={inputClicked[9]}
            index={9}
            handleClick={handleClick}
            onChange={(e) => {
              setRegions(e);
              validateNotEmpty(e, 9);

              let newLocalProfile = { ...localProfile, regions: e };
              updateLocalStorage(newLocalProfile);
            }}
            options={REGIONS}
            value={regions}
            valid={isValid[9]}
            validate={validate}
          />
        </div>

        <div className="modal-input-container Bio">
          <ModalInput
            style={styles.modalInput}
            type="textarea"
            maxRows={3}
            hasBorder={false}
            title={t("partnerProfile.briefIntro")}
            clicked={inputClicked[2]}
            index={2}
            handleClick={handleClick}
            onChange={handleIntroChange}
            value={intro}
            valid={isValid[8]}
            validate={validate}
            errorPresent={intro && intro.length > 1002}
            errorMessage={t("commonProfile.fieldTooLong")}
          />
        </div>
        <div className="modal-input-container">
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
            errorMessage={t("common.invalidURL")}
            valid={isValid[3]}
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
            errorMessage={t("common.invalidUrl")}
            valid={isValid[2]}
            validate={validate}
          />
        </div>
        <div className="modal-input-container sdgs">
          <p className="sdgtext">{t("partnerProfile.developmentGoals")}</p>
          {sdgErr && <p>{t("common.inputPrompt")}</p>}
          <Checkbox.Group
            options={SDGS}
            value={sdgs}
            onChange={(checkedValues) => {
              let optionsSelected = [];
              checkedValues.forEach((value) => {
                optionsSelected.push(value);
              });
              setSdgs(optionsSelected);
              let newLocalProfile = { ...localProfile, sdgs: optionsSelected };
              updateLocalStorage(newLocalProfile);
            }}
          />
        </div>
      </div>
      <div className="modal-input-container Bio">
        <ModalInput
          style={styles.modalInput}
          type="textarea"
          maxRows={3}
          hasBorder={false}
          title={t("partnerProfile.projectNames")}
          clicked={inputClicked[88]}
          index={88}
          handleClick={handleClick}
          onChange={handleTopicsChange}
          value={topics}
          valid={isValid[88]}
          validate={validate}
          errorPresent={topics && topics.length > 1002}
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
          onChange={handleOpenGrants}
          checked={open_grants}
        >
          {t("partnerProfile.collaborationGrants")}
        </Checkbox>
        <Checkbox
          className="modal-availability-checkbox-text"
          clicked={inputClicked[4]}
          index={4}
          handleClick={handleClick}
          onChange={handleOpenProjects}
          checked={open_projects}
        >
          {t("partnerProfile.collaborationProjects")}
        </Checkbox>
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
