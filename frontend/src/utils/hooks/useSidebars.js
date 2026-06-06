import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { useAuth } from "utils/hooks/useAuth";
import {
  ClockCircleOutlined,
  CompassOutlined,
  ContainerOutlined,
  DatabaseOutlined,
  MessageOutlined,
  PartitionOutlined,
  SearchOutlined,
  ToolOutlined,
  UserOutlined,
  UsergroupAddOutlined,
  VideoCameraOutlined,
  InfoCircleOutlined,
  LaptopOutlined,
  LinkOutlined,
  FileOutlined,
  AppstoreOutlined,
  SafetyCertificateOutlined,
  ThunderboltFilled,
} from "@ant-design/icons";
import { css, keyframes } from "@emotion/css";
import { ACCOUNT_TYPE } from "utils/consts";
import { getLoginPath } from "utils/auth.service";
import { fetchHasOauthAccess } from "features/oauthAccessSlice";

// Same-origin "launching..." page that shows a spinner before kicking off
// the cross-domain OAuth chain to the Mentee bot. See
// public/launch-bot.html — that page picks the right bot backend host for
// dev vs prod and then 302s into /api/auth/login?redirect_to=/chat. Going
// through this shim instead of linking the bot directly avoids the long
// blank-tab gap that the user sees while the browser ping-pongs through
// the OAuth 302s.
const BOT_CHAT_URL = "/launch-bot.html";

// Sentinel key so NavigationSider can detect this entry and skip its default
// `history.push`; the actual navigation happens via the anchor tag in `label`.
const EXTERNAL_BOT_KEY = "__external_bot_chat";

const sparklePulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.65; transform: scale(0.92); }
`;

const botLinkClass = css`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #800020;
  font-weight: 600;
  &:hover {
    color: #800020;
  }
`;

const sparkleIconClass = css`
  color: #d4af37;
  font-size: 12px;
  animation: ${sparklePulse} 1.8s ease-in-out infinite;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const newBadgeClass = css`
  display: inline-block;
  background: linear-gradient(135deg, #800020 0%, #c41e3a 100%);
  color: #ffffff;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.6px;
  padding: 1px 6px;
  border-radius: 8px;
  line-height: 1.4;
  box-shadow: 0 1px 2px rgba(128, 0, 32, 0.25);
`;

// Style on the Menu <li> wrapper. Subtle gradient + accent border so the
// entry stands out as a featured/new item without clashing with Ant's
// hover/selected states.
const botItemStyle = {
  background:
    "linear-gradient(90deg, rgba(212, 175, 55, 0.12) 0%, rgba(128, 0, 32, 0.06) 100%)",
  borderLeft: "3px solid #800020",
};

function botSidebarItem(t) {
  return {
    label: (
      <a
        href={BOT_CHAT_URL}
        target="_blank"
        rel="noopener noreferrer"
        // Stop the click from bubbling to Ant's Menu onClick so it doesn't
        // also try to history.push("/__external_bot_chat"). The sentinel key
        // is a defense-in-depth guard in NavigationSider.
        onClick={(e) => e.stopPropagation()}
        className={botLinkClass}
      >
        <span>{t("sidebars.bot")}</span>
        <span className={newBadgeClass}>{t("sidebars.bot_new_badge")}</span>
      </a>
    ),
    key: EXTERNAL_BOT_KEY,
    icon: <ThunderboltFilled className={sparkleIconClass} />,
    style: botItemStyle,
  };
}

export { EXTERNAL_BOT_KEY };

const CONNECTED_APPS_ROLES = new Set([
  ACCOUNT_TYPE.ADMIN,
  ACCOUNT_TYPE.MENTOR,
  ACCOUNT_TYPE.MENTEE,
  ACCOUNT_TYPE.PARTNER,
]);

/**
 * @param {ACCOUNT_TYPE} userType constant for user type
 * @param {Function} t translation function
 * @returns Sidebar for user type
 */
export default function useSidebars(userType, user, t) {
  // Connected Apps nav entry is gated per-client whitelist. Dispatch the
  // check through `onAuthStateChanged` so we don't race Firebase's auth
  // hydration on first mount (which would send Authorization: null and
  // permanently poison the cached value with `hasAny=false`). Re-runs on
  // every pathname change so returning from the OAuth consent flow — which
  // creates a consent record off-SPA — unhides the entry.
  const dispatch = useDispatch();
  const location = useLocation();
  const { onAuthStateChanged } = useAuth();
  const userTypeInt = parseInt(userType);
  const connectedAppsRelevant = CONNECTED_APPS_ROLES.has(userTypeInt);
  const hasOAuthAccess = useSelector(
    (state) => state.oauthAccess?.hasAny ?? false
  );

  useEffect(() => {
    if (!connectedAppsRelevant) return undefined;
    const unsubscribe = onAuthStateChanged(() =>
      dispatch(fetchHasOauthAccess())
    );
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [dispatch, onAuthStateChanged, connectedAppsRelevant, location.pathname]);

  const showConnectedApps = connectedAppsRelevant && hasOAuthAccess;
  var url_prefix_hub = "";
  var hub_user_id = null;
  if (parseInt(userType) === ACCOUNT_TYPE.HUB) {
    url_prefix_hub = getLoginPath();
    if (url_prefix_hub && url_prefix_hub.charAt(0) === "/") {
      url_prefix_hub = url_prefix_hub.slice(1);
    }
    if (user) {
      if (user.hub_id) {
        hub_user_id = user.hub_id;
      } else {
        hub_user_id = user._id.$oid;
      }
    }
  }
  const mentorSidebar = [
    {
      label: t("common.messages"),
      key: `messages/${ACCOUNT_TYPE.MENTOR}`,
      icon: <MessageOutlined />,
    },
    {
      label: t("sidebars.meeting"),
      key: `createmeetinglink/${ACCOUNT_TYPE.MENTOR}`,
      icon: <LinkOutlined />,
    },
    {
      label: t("sidebars.training"),
      key: "mentor/training",
      icon: <VideoCameraOutlined />,
    },
    {
      label: t("sidebars.explore"),
      key: "galleries",
      icon: <SearchOutlined />,
      children: [
        {
          label: t("navHeader.findMentee"),
          key: "mentee-gallery",
        },
      ],
    },
    {
      label: t("sidebars.appointments"),
      key: "appointments",
      icon: <ClockCircleOutlined />,
    },
    {
      label: t("sidebars.events"),
      key: "events",
      icon: <InfoCircleOutlined />,
    },
    {
      label: t("sidebars.announcements"),
      key: "announcements",
      icon: <InfoCircleOutlined />,
    },
    {
      label: t("sidebars.videos"),
      key: "videos",
      icon: <VideoCameraOutlined />,
    },
    {
      label: t("sidebars.profile"),
      key: "profile",
      icon: <UserOutlined />,
    },
  ];

  const menteeSidebar = [
    {
      label: t("common.messages"),
      key: `messages/${ACCOUNT_TYPE.MENTEE}`,
      icon: <MessageOutlined />,
    },
    botSidebarItem(t),
    {
      label: t("sidebars.meeting"),
      key: `createmeetinglink/${ACCOUNT_TYPE.MENTEE}`,
      icon: <LinkOutlined />,
    },
    {
      label: t("sidebars.training"),
      key: "mentee/training",
      icon: <VideoCameraOutlined />,
    },
    {
      label: t("sidebars.explore"),
      key: "galleries",
      icon: <SearchOutlined />,
      children: [
        {
          label: t("navHeader.findMentor"),
          key: "gallery",
        },
        {
          label: t("navHeader.findMentee"),
          key: "mentee-gallery",
        },
      ],
    },
    {
      label: t("sidebars.events"),
      key: "events",
      icon: <InfoCircleOutlined />,
    },
    {
      label: t("sidebars.announcements"),
      key: "announcements",
      icon: <InfoCircleOutlined />,
    },
    {
      label: t("sidebars.appointments"),
      key: "mentee-appointments",
      icon: <ClockCircleOutlined />,
    },
    {
      label: t("sidebars.profile"),
      key: "profile",
      icon: <UserOutlined />,
    },
  ];

  const partnerSidebar = [
    {
      label: t("common.messages"),
      key: `messages/${ACCOUNT_TYPE.PARTNER}`,
      icon: <MessageOutlined />,
    },
    {
      label: t("common.group_message"),
      key: `partner_group_messages/${user ? user._id.$oid : ""}`,
      icon: <MessageOutlined />,
    },
    {
      label: t("sidebars.meeting"),
      key: `createmeetinglink/${ACCOUNT_TYPE.PARTNER}`,
      icon: <LinkOutlined />,
    },
    {
      label: t("sidebars.training"),
      key: "partner/training",
      icon: <VideoCameraOutlined />,
    },
    {
      label: t("sidebars.explore"),
      key: "galleries",
      icon: <SearchOutlined />,
      children: [
        {
          label: t("navHeader.findPartner"),
          key: "partner-gallery",
        },
      ],
    },
    {
      label: t("sidebars.events"),
      key: "events",
      icon: <InfoCircleOutlined />,
    },
    {
      label: t("sidebars.announcements"),
      key: "announcements",
      icon: <InfoCircleOutlined />,
    },
    {
      label: t("sidebars.profile"),
      key: "profile",
      icon: <UserOutlined />,
    },
  ];

  const guestSidebar = [
    {
      label: t("navHeader.findMentor"),
      key: "gallery",
      icon: <ToolOutlined />,
    },
    {
      label: t("navHeader.findMentee"),
      key: "mentee-gallery",
      icon: <CompassOutlined />,
    },
    {
      label: t("navHeader.findPartner"),
      key: "partner-gallery",
      icon: <PartitionOutlined />,
    },
  ];

  const supportSidebar = [
    {
      label: t("navHeader.findMentor"),
      key: "support/all-mentors",
      icon: <ToolOutlined />,
    },
    {
      label: t("navHeader.findMentee"),
      key: "support/all-mentees",
      icon: <CompassOutlined />,
    },
    {
      label: t("navHeader.findPartner"),
      key: "support/all-partners",
      icon: <PartitionOutlined />,
    },
    {
      label: t("navHeader.findHubs"),
      key: "support/all-hubs",
      icon: <ToolOutlined />,
    },
  ];

  const moderatorSidebar = [
    {
      label: t("common.group_message"),
      key: `/moderator/admin_group_messages`,
      icon: <MessageOutlined />,
    },
  ];
  const hubSidebar = [
    {
      label: t("common.messages"),
      key: `messages/${ACCOUNT_TYPE.PARTNER}`,
      icon: <MessageOutlined />,
    },
    {
      label: t("sidebars.meeting"),
      key: `createmeetinglink/${ACCOUNT_TYPE.HUB}`,
      icon: <LinkOutlined />,
    },
    {
      label: t("common.group_message"),
      key: url_prefix_hub + `/group_messages/${hub_user_id}`,
      icon: <MessageOutlined />,
    },
    {
      label: t("common.community"),
      key: url_prefix_hub + `/community`,
      icon: <DatabaseOutlined />,
    },
    {
      label: "Explore",
      key: "galleries",
      icon: <SearchOutlined />,
      children: [
        {
          label: t("navHeader.findPartner"),
          key: url_prefix_hub + "/partner-gallery",
        },
      ],
    },
    {
      label: t("sidebars.events"),
      key: url_prefix_hub + "/events",
      icon: <InfoCircleOutlined />,
    },
    // {
    //   label: "Reports",
    //   key: "reports",
    //   icon: <DatabaseOutlined />,
    //   children: [
    //     {
    //       label: "Account Data",
    //       key: "account-data",
    //     },
    //   ],
    // },
    {
      label: t("sidebars.inforamtion"),
      key: url_prefix_hub + "/partner/training",
      icon: <LaptopOutlined />,
    },
    {
      label: t("sidebars.profile"),
      key: url_prefix_hub + "/profile",
      icon: <UserOutlined />,
    },
  ];
  if (parseInt(userType) === ACCOUNT_TYPE.HUB) {
    if (user && !user.hub_id) {
      hubSidebar.push({
        label: t("sidebars.invite_link"),
        key: url_prefix_hub + "/invite-link",
        icon: <VideoCameraOutlined />,
      });
    }
  }
  const adminOAuthChildren = [
    {
      label: "Manage Clients",
      key: "admin/oauth-clients",
    },
  ];
  const adminSidebar = [
    {
      label: "Dashboard",
      key: `dashboard`,
      icon: <LinkOutlined />,
    },
    {
      label: "Onboarding",
      key: "onboarding",
      icon: <SafetyCertificateOutlined />,
    },
    {
      label: t("common.group_message"),
      key: `admin_group_messages`,
      icon: <MessageOutlined />,
    },
    {
      label: "Explore",
      key: "galleries",
      icon: <SearchOutlined />,
      children: [
        {
          label: "Find a Mentor",
          key: "gallery",
        },
        {
          label: "Find a Mentee",
          key: "mentee-gallery",
        },
        {
          label: "Find a Partner",
          key: "partner-gallery",
        },
      ],
    },
    {
      label: t("sidebars.meeting"),
      key: `createmeetinglink/${ACCOUNT_TYPE.ADMIN}`,
      icon: <LinkOutlined />,
    },
    {
      label: "Events",
      key: "events",
      icon: <InfoCircleOutlined />,
    },
    {
      label: "Reports",
      key: "reports",
      icon: <DatabaseOutlined />,
      children: [
        {
          label: "Account Data",
          key: "account-data",
        },
        {
          label: "Hub Data",
          key: "hub-data",
        },
        {
          label: "Partner Data",
          key: "partner-data",
        },
        {
          label: "All Appointments",
          key: "all-appointments",
        },
        {
          label: "Messages",
          key: "messages-details",
        },
        {
          label: "Bug Reports",
          key: "bug-reports",
        },
        {
          label: "Error Logs",
          key: "admin/error-logs",
        },
      ],
    },
    {
      label: "Applications",
      key: "applications",
      icon: <UsergroupAddOutlined />,
      children: [
        {
          label: "Mentor",
          key: "organizer",
        },
        {
          label: "Mentee",
          key: "menteeOrganizer",
        },
      ],
    },
    {
      label: "Trainings",
      key: "admin-training",
      icon: <VideoCameraOutlined />,
    },
    {
      label: "Announcement",
      key: "admin-announcement",
      icon: <VideoCameraOutlined />,
    },
    {
      label: "Sign Docs",
      key: "admin-sign",
      icon: <FileOutlined />,
    },
    {
      label: "OAuth",
      key: "oauth",
      icon: <SafetyCertificateOutlined />,
      children: adminOAuthChildren,
    },
    {
      label: "Resources",
      key: "resources",
      icon: <ContainerOutlined />,
      children: [
        {
          label: "Languages",
          key: "languages",
        },
        {
          label: "Specializations",
          key: "specializations",
        },
      ],
    },
  ];

  if (showConnectedApps) {
    const connectedAppsItem = {
      label: t("connected_apps.title"),
      key: "settings/connected-apps",
      icon: <AppstoreOutlined />,
    };
    mentorSidebar.push(connectedAppsItem);
    menteeSidebar.push(connectedAppsItem);
    partnerSidebar.push(connectedAppsItem);
    adminOAuthChildren.push({
      label: t("connected_apps.title"),
      key: "settings/connected-apps",
    });
  }

  switch (userTypeInt) {
    case ACCOUNT_TYPE.MENTOR:
      return mentorSidebar;
    case ACCOUNT_TYPE.MENTEE:
      return menteeSidebar;
    case ACCOUNT_TYPE.PARTNER:
      return partnerSidebar;
    case ACCOUNT_TYPE.GUEST:
      return guestSidebar;
    case ACCOUNT_TYPE.SUPPORT:
      return supportSidebar;
    case ACCOUNT_TYPE.MODERATOR:
      return moderatorSidebar;
    case ACCOUNT_TYPE.ADMIN:
      return adminSidebar;
    case ACCOUNT_TYPE.HUB:
      return hubSidebar;
    default:
      return [];
  }
}
