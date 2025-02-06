import React, { useState, useEffect } from "react";
import { Button, Modal, Checkbox, Avatar, Upload } from "antd";
import ImgCrop from "antd-img-crop";
import ModalInput from "./ModalInput";
import MenteeButton from "./MenteeButton";
import { UserOutlined, EditFilled } from "@ant-design/icons";
import { getRegions, getSDGs } from "../utils/consts";
import { editPartnerProfile, uploadPartnerImage } from "../utils/api";
import { useAuth } from "utils/hooks/useAuth";
import "./css/AntDesign.scss";
import "./css/Modal.scss";
import { validateUrl } from "utils/misc";
import { useTranslation } from "react-i18next";

const INITIAL_NUM_INPUTS = 30;

function PartnerProfileModal(props) {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [numInputs, setNumInputs] = useState(INITIAL_NUM_INPUTS);
  const [inputClicked, setInputClicked] = useState(
    new Array(numInputs).fill(false)
  ); // each index represents an input box, respectively
  const [isValid, setIsValid] = useState(new Array(numInputs).fill(true));
  const [validate, setValidate] = useState(false);
  const [topics, setTopics] = useState(null);
  const [person_name, setPersonName] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [intro, setIntro] = useState(null);
  const [open_grants, setOpenGrants] = useState(false);
  const [open_projects, setOpenProjects] = useState(false);
  const [location, setLocation] = useState(null);
  const [website, setWebsite] = useState(null);
  const [linkedin, setLinkedin] = useState(null);
  const [sdgs, setSdgs] = useState([]);
  const [regions, setRegions] = useState([]);
  const [image, setImage] = useState(null);
  const [changedImage, setChangedImage] = useState(false);
  const [edited, setEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const { profileId } = useAuth();

  useEffect(() => {
    if (props.mentor) {
      setOrganization(props.mentor.organization);
      setPersonName(props.mentor.person_name);
      setTopics(props.mentor.topics);
      setIntro(props.mentor.biography);
      setOpenGrants(props.mentor.open_grants);
      setOpenProjects(props.mentor.open_projects);
      setLocation(props.mentor.location);
      setWebsite(props.mentor.website);
      setLinkedin(props.mentor.linkedin);
      setImage(props.mentor.image);
      setSdgs(props.mentor.sdgs);
      setRegions(props.mentor.regions);
      // Deep copy of array of objects

      let newValid = [...isValid];
      for (let i = 0; i < numInputs; i++) {
        newValid.push(true);
      }
      setIsValid(newValid);
    }
  }, [props.mentor, modalVisible]);

  function handleClick(index) {
    // Sets only the clicked input box to true to change color, else false
    let newClickedInput = new Array(numInputs).fill(false);
    newClickedInput[index] = true;
    setInputClicked(newClickedInput);
  }

  function handleNameChange(e) {
    const organization = e.target.value;

    if (organization.length <= 50) {
      setEdited(true);
      let newValid = [...isValid];

      newValid[0] = true;

      setIsValid(newValid);
    } else {
      let newValid = [...isValid];
      newValid[0] = false;
      setIsValid(newValid);
    }

    setOrganization(organization);
  }
  function handleTopicsChange(e) {
    const topics = e.target.value;

    if (topics.length <= 250) {
      setEdited(true);
      let newValid = [...isValid];

      newValid[22] = true;

      setIsValid(newValid);
    } else {
      let newValid = [...isValid];
      newValid[23] = false;
      setIsValid(newValid);
    }

    setTopics(topics);
  }
  function handlePersonNameChange(e) {
    const person_name = e.target.value;

    if (person_name.length <= 50) {
      setEdited(true);
      let newValid = [...isValid];

      newValid[23] = true;

      setIsValid(newValid);
    } else {
      let newValid = [...isValid];
      newValid[23] = false;
      setIsValid(newValid);
    }

    setPersonName(person_name);
  }

  function handleAboutChange(e) {
    const intro = e.target.value;

    if (intro.length <= 1002) {
      setEdited(true);
      let newValid = [...isValid];

      newValid[7] = true;

      setIsValid(newValid);
    } else {
      let newValid = [...isValid];
      newValid[7] = false;
      setIsValid(newValid);
    }

    setIntro(intro);
  }

  function handleOpenGrants(e) {
    setOpenGrants(e.target.checked);
    setEdited(true);
  }

  function handleopenprojects(e) {
    setOpenProjects(e.target.checked);
    setEdited(true);
  }

  function handleLocationChange(e) {
    const location = e.target.value;

    if (location.length <= 70) {
      setEdited(true);
      let newValid = [...isValid];

      newValid[10] = true;

      setIsValid(newValid);
    } else {
      let newValid = [...isValid];
      newValid[10] = false;
      setIsValid(newValid);
    }

    setLocation(location);
  }

  function handleWebsiteChange(e) {
    const website = e.target.value;

    if (validateUrl(website)) {
      setEdited(true);
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

  function handleRegions(e) {
    let regionsSelected = [];
    e.forEach((value) => {
      regionsSelected.push(value);
    });
    setRegions(regionsSelected);
    setEdited(true);

    let newValid = [...isValid];
    newValid[7] = !!regionsSelected.length;
    setIsValid(newValid);
  }

  function handleLinkedinChange(e) {
    const linkedin = e.target.value;

    if (validateUrl(linkedin)) {
      setEdited(true);
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

  function handleSdgs(e) {
    let SdgSelected = [];
    e.forEach((value) => SdgSelected.push(value));
    setSdgs(SdgSelected);
    setEdited(true);

    let newValid = [...isValid];
    newValid[9] = !!SdgSelected.length;
    setIsValid(newValid);
  }

  const handleSaveEdits = () => {
    async function saveEdits(data) {
      const partnerID = profileId;
      await editPartnerProfile(data, partnerID);

      if (changedImage) {
        await uploadPartnerImage(image, partnerID);
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
      organization: organization,
      person_name: person_name,
      topics: topics,
      linkedin: linkedin,
      website: website,
      regions: regions,
      sdgs: sdgs,
      intro: intro,
      open_grants: open_grants,
      open_projects: open_projects,
      location: location,
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
          content={<b>{t("commonProfile.editProfile")}</b>}
          onClick={() => setModalVisible(true)}
        />
      </span>
      <Modal
        title={t("commonProfile.editProfile")}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setValidate(false);
          setChangedImage(false);
          setIsValid([...isValid].fill(true));
        }}
        style={{ overflow: "hidden" }}
        footer={
          <div>
            {validate && (
              <b style={styles.alertToast}>
                {t("commonProfile.missingFields")}
              </b>
            )}
            <Button
              type="default"
              shape="round"
              style={styles.footer}
              onClick={handleSaveEdits}
              loading={saving}
            >
              {t("common.save")}
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
            <ImgCrop rotate aspect={5 / 3} minZoom={0.2}>
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
                onChange={handleNameChange}
                value={organization}
                valid={isValid[0]}
                validate={validate}
                errorPresent={organization && organization.length > 50}
                errorMessage={t("commonProfile.fieldTooLong")}
              />
            </div>
            <div className="modal-input-container">
              <ModalInput
                style={styles.modalInput}
                type="text"
                title={t("partnerProfile.projectNames")}
                clicked={inputClicked[22]}
                index={22}
                handleClick={handleClick}
                onChange={handleTopicsChange}
                value={topics}
                valid={isValid[22]}
                validate={validate}
                errorPresent={topics && topics.length > 50}
                errorMessage={t("commonProfile.fieldTooLong")}
              />
            </div>
            <div className="modal-input-container">
              <ModalInput
                style={styles.modalInput}
                type="text"
                title={t("partnerProfile.contactFullName")}
                clicked={inputClicked[23]}
                index={1}
                handleClick={handleClick}
                onChange={handlePersonNameChange}
                value={person_name}
                valid={isValid[23]}
                validate={validate}
              />
            </div>
            <div className="modal-input-container">
              <ModalInput
                style={styles.textAreaInput}
                type="textarea"
                maxRows={3}
                hasBorder={false}
                title={t("partnerProfile.briefIntro")}
                clicked={inputClicked[2]}
                index={2}
                handleClick={handleClick}
                onChange={handleAboutChange}
                value={intro}
                valid={isValid[7]}
                validate={validate}
                errorPresent={intro && intro.length > 1002}
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
              <div></div>
              <Checkbox
                className="modal-availability-checkbox-text"
                clicked={inputClicked[4]}
                index={4}
                handleClick={handleClick}
                onChange={handleopenprojects}
                checked={open_projects}
              >
                {t("partnerProfile.collaborationProjects")}
              </Checkbox>
            </div>
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
                valid={isValid[10]}
                validate={validate}
                errorPresent={location && location.length > 70}
                errorMessage={t("commonProfile.fieldTooLong")}
              />
            </div>
            <div className="modal-input-container">
              <ModalInput
                style={styles.modalInput}
                type="dropdown-multiple"
                title={t("partnerProfile.regionsWork")}
                clicked={inputClicked[7]}
                index={7}
                handleClick={handleClick}
                onChange={handleRegions}
                placeholder=""
                options={getRegions(t)}
                value={regions}
                valid={isValid[7]}
                validate={validate}
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
                valid={isValid[3]}
                validate={validate}
                errorPresent={website && !validateUrl(website)}
                errorMessage={t("common.invalidUrl")}
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
                valid={isValid[2]}
                validate={validate}
                errorPresent={linkedin && !validateUrl(linkedin)}
                errorMessage={t("common.invalidUrl")}
              />
            </div>
            <div className="modal-input-container">
              <ModalInput
                style={styles.modalInput}
                type="dropdown-multiple"
                title={t("partnerProfile.developmentGoals")}
                clicked={inputClicked[9]}
                index={9}
                handleClick={handleClick}
                onChange={handleSdgs}
                options={getSDGs(t)}
                value={sdgs}
                valid={isValid[9]}
                validate={validate}
              />
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
  textAreaInput: {
    height: 65,
    margin: 18,
    padding: 4,
    paddingTop: 6,
    marginBottom: "40px",
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

export default PartnerProfileModal;
