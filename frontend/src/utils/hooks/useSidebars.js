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
} from "@ant-design/icons";
import { ACCOUNT_TYPE } from "utils/consts";
import { getLoginPath } from "utils/auth.service";
/**
 * @param {ACCOUNT_TYPE} userType constant for user type
 * @param {Function} t translation function
 * @returns Sidebar for user type
 */
export default function useSidebars(userType, user, t) {
  var url_prefix_hub = "";
  if (parseInt(userType) == ACCOUNT_TYPE.HUB) {
    url_prefix_hub = getLoginPath();
    if (url_prefix_hub && url_prefix_hub.charAt(0) == "/") {
      url_prefix_hub = url_prefix_hub.slice(1);
    }
  }
  const mentorSidebar = [
    {
      label: t("common.messages"),
      key: `messages/${ACCOUNT_TYPE.MENTOR}`,
      icon: <MessageOutlined />,
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
  ];
  const hubSidebar = [
    {
      label: t("common.messages"),
      key: `messages/${ACCOUNT_TYPE.PARTNER}`,
      icon: <MessageOutlined />,
    },
    {
      label: t("sidebars.explore"),
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
  if (parseInt(userType) == ACCOUNT_TYPE.HUB) {
    if (user && !user.hub_id) {
      hubSidebar.push({
        label: t("sidebars.invite_link"),
        key: url_prefix_hub + "/invite-link",
        icon: <VideoCameraOutlined />,
      });
    }
  }
  const adminSidebar = [
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
          label: "All Appointments",
          key: "all-appointments",
        },
        {
          label: "Messages",
          key: "messages-details",
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

  switch (parseInt(userType)) {
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
    case ACCOUNT_TYPE.ADMIN:
      return adminSidebar;
    case ACCOUNT_TYPE.HUB:
      return hubSidebar;
    default:
      return [];
  }
}
