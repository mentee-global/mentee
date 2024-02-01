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
} from "@ant-design/icons";
import { ACCOUNT_TYPE } from "utils/consts";

/**
 * @param {ACCOUNT_TYPE} userType constant for user type
 * @param {Function} t translation function
 * @returns Sidebar for user type
 */
export default function useSidebars(userType, t) {
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
  const adminSidebar = [
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
      label: "Reports",
      key: "reports",
      icon: <DatabaseOutlined />,
      children: [
        {
          label: "Account Data",
          key: "account-data",
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
    default:
      return [];
  }
}
