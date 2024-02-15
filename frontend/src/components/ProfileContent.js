import React, { useEffect, useState } from "react";
import {
  EnvironmentOutlined,
  CommentOutlined,
  LinkOutlined,
  LinkedinOutlined,
  LockFilled,
  StarFilled,
  UserOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { formatLinkForHref } from "utils/misc";
import PublicMessageModal from "components/PublicMessageModal";
import { ACCOUNT_TYPE, getRegions } from "utils/consts";
import { fetchMenteeByID, editFavMentorById } from "utils/api";
import { Rate, Tooltip, Avatar } from "antd";
import { useSelector } from "react-redux";
import MentorContactModal from "components/MentorContactModal";

import "./css/Profile.scss";
import { getTranslatedOptions } from "utils/translations";
import EditProfileModal from "components/EditProfileModal";
import { getProfileId, getRole } from "utils/auth.service";

function ProfileContent(props) {
  const { t } = useTranslation();
  const options = useSelector((state) => state.options);
  const { accountType, account } = props;
  const profileId = getProfileId();
  const role = getRole();
  const isMentee = role == ACCOUNT_TYPE.MENTEE;
  const isGuest = role == ACCOUNT_TYPE.GUEST;
  const [mentee, setMentee] = useState();
  const [favorite, setFavorite] = useState(false);
  const [favoriteMentorIds, setFavoriteMentorIds] = useState(new Set());

  useEffect(() => {
    async function getMentee() {
      const menteeId = profileId;
      const menteeData = await fetchMenteeByID(menteeId);
      if (menteeData) {
        setMentee(menteeData);
      }
    }
    if (isMentee) {
      getMentee();
    }
  }, [isMentee]);

  useEffect(() => {
    function initializeFavorites() {
      let fav_set = new Set();
      mentee.favorite_mentors_ids.forEach((id) => {
        fav_set.add(id);
      });
      setFavoriteMentorIds(fav_set);
      setFavorite(fav_set.has(props.id));
    }
    if (isMentee && mentee) {
      initializeFavorites();
    }
  }, [mentee]);

  function onEditFav(mentor_id, favorite) {
    editFavMentorById(profileId, mentor_id, favorite);
  }

  function onFavoriteClick(fav) {
    setFavorite(!fav);
    onEditFav(props.id, fav);
  }

  const getTitle = (name, age) => {
    if (accountType === ACCOUNT_TYPE.MENTOR && name) {
      return name;
    } else if (name && age) {
      return name + ", " + age;
    } else if (accountType === ACCOUNT_TYPE.PARTNER) {
      return account.organization;
    }
  };

  const getPrivacy = (privacy) => {
    if (privacy) {
      return <LockFilled className="mentor-lock-symbol" />;
    }
  };
  const getLanguages = (languages) => {
    return getTranslatedOptions(languages, options.languages).join(" • ");
  };

  const getTags = (tags) => {
    if (accountType === ACCOUNT_TYPE.PARTNER) {
      tags = getTranslatedOptions(
        tags,
        accountType === ACCOUNT_TYPE.PARTNER
          ? getRegions(t)
          : options.specializations
      );
    }
    return tags.map((tag, idx) => (
      <div className="mentor-specialization-tag" key={idx}>
        {tag}
      </div>
    ));
  };

  const displayTags = () => {
    let tags = account?.specializations ?? account?.regions ?? [];
    return (
      <div>
        <div className="mentor-profile-heading">
          <b>
            {ACCOUNT_TYPE.MENTOR === accountType
              ? t("common.specializations")
              : ACCOUNT_TYPE.MENTEE === accountType
              ? t("menteeProfile.areasOfInterest")
              : t("partnerProfile.regionsWork")}
          </b>
        </div>
        <div>{getTags(tags)}</div>
      </div>
    );
  };

  const getEducations = (educations) => {
    if (!educations || !educations[0]) {
      return;
    }
    return educations.map((education) => (
      <>
        {education.majors.map((major) => (
          <div className="mentor-profile-education">
            <b>{education.school}</b>
            <br />
            {education.education_level}, {major}
            <br />
            <p className="mentor-profile-heading">
              {education.graduation_year}
            </p>
          </div>
        ))}
      </>
    ));
  };

  return (
    <div>
      <div className="mentor-profile-name">
        <div className="mentor-profile-decorations">
          {getTitle(props.mentor.name, props.mentor.age)}
          <div>{getPrivacy(props.mentor.is_private)}</div>
          {isMentee &&
          favoriteMentorIds.size &&
          accountType === ACCOUNT_TYPE.MENTOR ? (
            <div className="favorite-button-profile">
              <Rate
                character={<StarFilled />}
                count={1}
                defaultValue={favorite ? 1 : 0}
                onChange={(number) => onFavoriteClick(number)}
              />
            </div>
          ) : null}
        </div>
        <div className="mentor-profile-actions">
          <div className="mentor-profile-book-appt-btn">
            {isMentee &&
              (props.isMentor || accountType === ACCOUNT_TYPE.MENTOR) && (
                <>
                  <MentorContactModal
                    mentorName={props.mentor?.name}
                    mentorId={props.mentor?._id?.$oid}
                    menteeId={profileId}
                    mentorSpecializations={getTranslatedOptions(
                      props.mentor?.specializations,
                      options.specializations
                    )}
                  />
                </>
              )}
          </div>
          <div className="mentor-profile-send-msg-btn">
            {!props.isMentor &&
              !isGuest &&
              parseInt(accountType, 10) !== ACCOUNT_TYPE.MENTOR &&
              props.mentor &&
              props.mentor._id &&
              props.mentor._id["$oid"] !== profileId &&
              profileId && (
                <PublicMessageModal
                  menteeName={props.mentor.name}
                  menteeId={
                    props.mentor && props.mentor._id && props.mentor._id["$oid"]
                  }
                  mentorId={profileId}
                />
              )}
          </div>
        </div>
        {props.showEditBtn ? (
          <div className="mentor-profile-button">
            <EditProfileModal
              profileData={props.mentor}
              onSave={props.handleSaveEdits}
              role={accountType}
            />
          </div>
        ) : null}
      </div>
      <br />

      <div className="mentor-profile-tags-container">
        {props.mentor.location && (
          <span className="mentor-profile-tag">
            <EnvironmentOutlined className="mentor-profile-tag-icon" />
            <Tooltip title={props.mentor.location} placement="topLeft">
              {" "}
              {props.mentor.location}{" "}
            </Tooltip>
          </span>
        )}
        {props.mentor.languages && props.mentor.languages.length > 0 && (
          <span className="mentor-profile-tag">
            <CommentOutlined className="mentor-profile-tag-icon" />
            <Tooltip
              title={getLanguages(props.mentor.languages || [])}
              placement="topLeft"
            >
              {" "}
              {getLanguages(props.mentor.languages || [])}{" "}
            </Tooltip>
          </span>
        )}
        {props.mentor.website && (
          <span className="mentor-profile-tag">
            <LinkOutlined className="mentor-profile-tag-icon" />
            <Tooltip
              title={
                <a
                  href={formatLinkForHref(props.mentor.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {props.mentor.website}
                </a>
              }
              placement="topLeft"
            >
              <a
                href={formatLinkForHref(props.mentor.website)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {props.mentor.website}
              </a>
            </Tooltip>
          </span>
        )}
        {props.mentor.linkedin && (
          <span className="mentor-profile-tag">
            <LinkedinOutlined className="mentor-profile-tag-icon" />
            <Tooltip
              title={
                <a
                  href={formatLinkForHref(props.mentor.linkedin)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {props.mentor.linkedin}
                </a>
              }
              placement="topLeft"
            >
              <a
                href={formatLinkForHref(props.mentor.linkedin)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {props.mentor.linkedin}
              </a>
            </Tooltip>
          </span>
        )}
      </div>
      <br />
      {accountType === ACCOUNT_TYPE.PARTNER ? (
        <>
          {" "}
          <div className="mentor-profile-heading">
            <b>{t("partnerProfile.briefIntro")}</b>
          </div>
          <div className="mentor-profile-about">{account.intro}</div>
        </>
      ) : (
        <>
          <div className="mentor-profile-heading">
            <b>{t("commonProfile.biography")}</b>
          </div>
          <div className="mentor-profile-about">{props.mentor.biography}</div>
        </>
      )}

      <br />
      {displayTags()}
      <br />
      {accountType !== ACCOUNT_TYPE.PARTNER && (
        <>
          <div className="mentor-profile-heading">
            <b>{t("commonProfile.education")}</b>
          </div>
          <div>{getEducations(props.mentor.education)}</div>
          {accountType == ACCOUNT_TYPE.MENTEE && (
            <>
              <div>
                {props.mentor.education_level &&
                  t("common." + props.mentor.education_level)}
              </div>
            </>
          )}
        </>
      )}
      <br />
      {accountType === ACCOUNT_TYPE.PARTNER && (
        <>
          <div className="mentor-profile-heading">
            <b>{t("partnerProfile.contactFullName")}</b>
          </div>
          <div className="mentor-profile-about">{account.person_name}</div>
          <br /> <br />
          <div className="mentor-profile-heading">
            <b>{t("partnerProfile.projectNames")} </b>
          </div>
          <div className="mentor-profile-about">{account.topics}</div>
          <br /> <br />
          <div className="mentor-profile-heading">
            <b>{t("partnerProfile.developmentGoals")} </b>
          </div>
          <div className="mentor-profile-about">{account.sdgs}</div>
          <br /> <br />
          <div className="mentor-profile-heading">
            <b>{t("partnerProfile.collaborationGrants")}</b>
          </div>
          <div className="mentor-profile-about">
            {account.open_grants ? "Yes" : "No"}
          </div>
          <br /> <br />
          <div className="mentor-profile-heading">
            <b>{t("partnerProfile.collaborationProjects")}</b>
          </div>
          <div className="mentor-profile-about">
            {account.open_projects ? "Yes" : "No"}
          </div>
        </>
      )}

      {props.mentor.video && (
        <div className="mentor-profile-heading">
          <div className="mentor-profile-heading">
            <b>{t("commonProfile.video")}</b>
          </div>
          <LinkOutlined className="mentor-profile-tag-icon" />
          <Tooltip
            title={
              <a
                href={formatLinkForHref(props.mentor.video.url)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {props.mentor.video.url}
              </a>
            }
            placement="topLeft"
          >
            <a
              href={formatLinkForHref(props.mentor.video.url)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {props.mentor.video.url}
            </a>
          </Tooltip>
        </div>
      )}
      {props.mentor.pair_partner && props.mentor.pair_partner.email && (
        <>
          <div style={{ marginTop: "10px" }} className="mentor-profile-heading">
            <b>{t("common.partner")}</b>
          </div>
          <Avatar
            size={45}
            src={
              props.mentor.pair_partner.image &&
              props.mentor.pair_partner.image.url
            }
            icon={<UserOutlined />}
          />
          <label style={{ marginLeft: "10px" }}>
            {props.mentor.pair_partner.organization}
          </label>
        </>
      )}
    </div>
  );
}

export default ProfileContent;
