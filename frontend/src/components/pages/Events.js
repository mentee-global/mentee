import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Empty,
  Input,
  Modal,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
  notification,
} from "antd";
import {
  ArrowRightOutlined,
  CalendarOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { Link, useHistory, useLocation } from "react-router-dom";

import AddEventModal from "components/AddEventModal";
import EventCard from "components/EventCard";
import EventReviewNotificationSettings from "components/EventReviewNotificationSettings";
import {
  cancelEvent,
  fetchAccounts,
  fetchEventPublicationPreview,
  fetchEvents,
  fetchPartners,
  publishEvent,
  reviewEvent,
  submitEvent,
} from "utils/api";
import { ACCOUNT_TYPE, formatDateTime } from "utils/consts";
import i18n from "utils/i18n";
import { useAuth } from "utils/hooks/useAuth";
import {
  eventId,
  eventManagementView,
  eventSections,
} from "utils/eventWorkflow";
import "../css/Gallery.scss";

const ROLE_LABELS = {
  [ACCOUNT_TYPE.MENTOR]: "mentors",
  [ACCOUNT_TYPE.MENTEE]: "mentees",
  [ACCOUNT_TYPE.PARTNER]: "partners",
  [ACCOUNT_TYPE.HUB]: "hubs",
};

function Events() {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const { isAdmin, isMentor, isMentee, isPartner, isHub, profileId } =
    useAuth();
  const [published, setPublished] = useState([]);
  const [managed, setManaged] = useState([]);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [archive, setArchive] = useState([]);
  const [publishedLoading, setPublishedLoading] = useState(true);
  const [managedLoading, setManagedLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [archiveLoading, setArchiveLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState({ open: false, event: null });
  const [scopeOptions, setScopeOptions] = useState([]);
  const [publication, setPublication] = useState(null);
  const [notifyAudience, setNotifyAudience] = useState(true);
  const [rejecting, setRejecting] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const sections = eventSections({
    isAdmin,
    isMentor,
    isMentee,
    isPartner,
    isHub,
  });
  const appointmentsPath = isMentee ? "/mentee-appointments" : "/appointments";
  const canScheduleAppointments = isMentor || isMentee;

  const loadEvents = useCallback(async () => {
    if (!profileId) return;

    const loadSection = async (setLoading, request, setData) => {
      setLoading(true);
      try {
        setData(await request());
      } catch (error) {
        notification.error({
          message:
            error?.response?.data?.message ||
            i18n.t("events.workflow.loadFailed"),
        });
      } finally {
        setLoading(false);
      }
    };

    const requests = [
      loadSection(
        setPublishedLoading,
        () => fetchEvents("published"),
        setPublished
      ),
    ];

    if (isAdmin) {
      requests.push(
        loadSection(
          setReviewLoading,
          () =>
            Promise.all([fetchEvents("mine", "draft"), fetchEvents("review")]),
          ([draftEvents, pendingEvents]) =>
            setReviewQueue([...draftEvents, ...pendingEvents])
        ),
        loadSection(
          setArchiveLoading,
          () =>
            Promise.all([
              fetchEvents("review", "rejected"),
              fetchEvents("review", "cancelled"),
            ]),
          ([rejectedEvents, cancelledEvents]) =>
            setArchive([...rejectedEvents, ...cancelledEvents])
        )
      );
    } else {
      const managementView = eventManagementView({ isPartner, isHub });
      requests.push(
        loadSection(
          setManagedLoading,
          () => fetchEvents(managementView),
          setManaged
        )
      );
    }

    await Promise.all(requests);
  }, [isAdmin, isHub, isPartner, profileId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (!isAdmin) return;
    async function loadScopes() {
      const [hubs, partners] = await Promise.all([
        fetchAccounts(ACCOUNT_TYPE.HUB),
        fetchPartners(undefined, null),
      ]);
      setScopeOptions([
        ...hubs.map((hub) => ({
          label: hub.name,
          value: hub._id.$oid,
          scopeType: "hub",
        })),
        ...partners.map((partner) => ({
          label: partner.organization || partner.person_name,
          value: partner._id.$oid,
          scopeType: "partner",
        })),
      ]);
    }
    loadScopes().catch(() => setScopeOptions([]));
  }, [isAdmin]);

  const filteredPublished = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return published;
    return published.filter((event) =>
      [event.title, event.description, event.creator?.name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalized))
    );
  }, [published, query]);

  const runAction = async (action, successMessage) => {
    setActionLoading(true);
    try {
      await action();
      notification.success({ message: successMessage });
      await loadEvents();
      return true;
    } catch (error) {
      notification.error({
        message:
          error?.response?.data?.message || t("events.workflow.updateFailed"),
      });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const openPublication = async (event, approve = false) => {
    setActionLoading(true);
    try {
      const preview = await fetchEventPublicationPreview(eventId(event));
      setNotifyAudience(true);
      setPublication({ event, preview, approve });
    } catch (error) {
      notification.error({
        message:
          error?.response?.data?.message || t("events.workflow.previewFailed"),
      });
    } finally {
      setActionLoading(false);
    }
  };

  const confirmPublication = async () => {
    const { event, approve } = publication;
    const completed = await runAction(
      () =>
        approve
          ? reviewEvent(eventId(event), "approve", "", notifyAudience)
          : publishEvent(eventId(event), notifyAudience),
      approve
        ? t("events.workflow.approved")
        : t("events.workflow.publishedSuccess")
    );
    if (completed) setPublication(null);
  };

  const confirmRejection = async () => {
    if (!feedback.trim()) {
      notification.error({ message: t("events.workflow.feedbackRequired") });
      return;
    }
    const completed = await runAction(
      () => reviewEvent(eventId(rejecting), "reject", feedback),
      t("events.workflow.returned")
    );
    if (completed) {
      setRejecting(null);
      setFeedback("");
    }
  };

  const columns = [
    {
      title: t("events.workflow.event"),
      dataIndex: "title",
      render: (title, event) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{title}</Typography.Text>
          <Typography.Text type="secondary">
            {t("events.workflow.submittedBy", {
              name: event.creator?.name || "MENTEE",
            })}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: t("events.workflow.date"),
      render: (_, event) =>
        event.start_datetime
          ? formatDateTime(new Date(event.start_datetime.$date))
          : "—",
    },
    {
      title: t("events.workflow.audience"),
      render: (_, event) =>
        (event.audience_roles || event.role || []).map((audienceRole) => (
          <Tag key={audienceRole}>
            {t(`events.workflow.${ROLE_LABELS[audienceRole]}`)}
          </Tag>
        )),
    },
    {
      title: t("events.workflow.scope"),
      render: (_, event) => (
        <Tag>
          {event.scope_type === "global"
            ? t("events.workflow.global")
            : event.scope_type}
        </Tag>
      ),
    },
    {
      title: t("events.workflow.status"),
      dataIndex: "status",
      render: (status, event) => (
        <Space direction="vertical" size={0}>
          <Tag
            color={
              status === "published"
                ? "green"
                : status === "rejected"
                ? "red"
                : "gold"
            }
          >
            {status?.replaceAll("_", " ")}
          </Tag>
          {event.review_feedback && (
            <Typography.Text type="danger">
              {event.review_feedback}
            </Typography.Text>
          )}
          {event.status === "published" && event.notification_requested && (
            <Typography.Text type="secondary">
              Email: {event.notification_status} (
              {event.notification_recipient_count || 0} recipients)
            </Typography.Text>
          )}
        </Space>
      ),
    },
    {
      title: t("events.workflow.actions"),
      render: (_, event) => (
        <Space wrap>
          {event.permissions?.edit && event.status !== "pending_review" && (
            <Button onClick={() => setEditor({ open: true, event })}>
              {t("events.workflow.edit")}
            </Button>
          )}
          {event.permissions?.publish &&
            ["draft", "pending_review"].includes(event.status) && (
              <Button
                type="primary"
                loading={actionLoading}
                onClick={() =>
                  openPublication(event, event.status === "pending_review")
                }
              >
                {event.status === "pending_review"
                  ? t("events.workflow.approve")
                  : t("events.workflow.publish")}
              </Button>
            )}
          {event.permissions?.submit && !event.permissions?.publish && (
            <Button
              type="primary"
              loading={actionLoading}
              onClick={() =>
                runAction(
                  () => submitEvent(eventId(event)),
                  t("events.workflow.submitted")
                )
              }
            >
              {t("events.workflow.submit")}
            </Button>
          )}
          {event.permissions?.review && (
            <Button danger onClick={() => setRejecting(event)}>
              {t("events.workflow.reject")}
            </Button>
          )}
          {event.permissions?.cancel && (
            <Button
              danger
              onClick={() =>
                Modal.confirm({
                  title: t("events.workflow.cancelQuestion"),
                  content: t("events.workflow.cancelDescription"),
                  onOk: () =>
                    runAction(
                      () => cancelEvent(eventId(event)),
                      t("events.workflow.cancelled")
                    ),
                })
              }
            >
              {t("events.workflow.cancel")}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const publishedContent = (
    <>
      <Input
        style={{ maxWidth: 360, marginBottom: 16 }}
        prefix={<SearchOutlined />}
        placeholder={t("events.workflow.search")}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {publishedLoading ? (
        <div
          className="events-page__section-loading"
          role="status"
          aria-label={t("events.workflow.loading")}
        >
          <Spin size="large" />
        </div>
      ) : filteredPublished.length ? (
        <div className="events-grid">
          {filteredPublished.map((event) => (
            <EventCard
              key={eventId(event)}
              event_item={event}
              onEdit={(selected) => setEditor({ open: true, event: selected })}
              onCancel={(selected) =>
                runAction(
                  () => cancelEvent(eventId(selected)),
                  t("events.workflow.cancelled")
                )
              }
            />
          ))}
        </div>
      ) : (
        <Empty description={t("events.workflow.empty")} />
      )}
    </>
  );

  const tabs = [
    {
      key: "published",
      label: t("events.workflow.published"),
      children: publishedContent,
    },
  ];
  if (sections.includes("mine")) {
    tabs.push({
      key: "mine",
      label: t("events.workflow.proposals"),
      children: (
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Alert
            showIcon
            type="info"
            message={t("events.workflow.proposalApprovalTitle")}
            description={t("events.workflow.proposalApprovalDescription")}
          />
          <Table
            rowKey={eventId}
            columns={columns}
            dataSource={managed}
            loading={managedLoading}
            scroll={{ x: 900 }}
          />
        </Space>
      ),
    });
  } else if (sections.includes("community")) {
    tabs.push({
      key: "community",
      label: t("events.workflow.communityEvents"),
      children: (
        <Table
          rowKey={eventId}
          columns={columns}
          dataSource={managed}
          loading={managedLoading}
          scroll={{ x: 900 }}
        />
      ),
    });
  } else if (sections.includes("review")) {
    tabs.push(
      {
        key: "review",
        label: t("events.workflow.reviewQueue", {
          count: reviewQueue.length,
        }),
        children: (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <EventReviewNotificationSettings />
            <Table
              rowKey={eventId}
              columns={columns}
              dataSource={reviewQueue}
              loading={reviewLoading}
              scroll={{ x: 900 }}
            />
          </Space>
        ),
      },
      {
        key: "archive",
        label: t("events.workflow.archive"),
        children: (
          <Table
            rowKey={eventId}
            columns={columns}
            dataSource={archive}
            loading={archiveLoading}
            scroll={{ x: 900 }}
          />
        ),
      }
    );
  }

  const requestedTab = new URLSearchParams(location.search).get("tab");
  const activeTab = tabs.some((tab) => tab.key === requestedTab)
    ? requestedTab
    : "published";

  return (
    <div className="events-page">
      <div className="events-page__header">
        <Typography.Title level={2} style={{ margin: 0 }}>
          {t("events.workflow.title")}
        </Typography.Title>
        <Button
          type="primary"
          onClick={() => setEditor({ open: true, event: null })}
        >
          {isMentor || isMentee
            ? t("events.workflow.propose")
            : t("events.workflow.create")}
        </Button>
      </div>

      <section
        className="events-page__purpose"
        aria-labelledby="events-purpose-title"
      >
        <span className="events-page__purpose-icon" aria-hidden="true">
          <CalendarOutlined />
        </span>
        <div className="events-page__purpose-copy">
          <Typography.Title level={5} id="events-purpose-title">
            {t("events.workflow.purposeTitle")}
          </Typography.Title>
          <Typography.Paragraph>
            {t("events.workflow.purposeDescription")}
          </Typography.Paragraph>
        </div>
        {canScheduleAppointments && (
          <Link
            className="events-page__appointments-link"
            to={appointmentsPath}
          >
            {t("events.workflow.goToAppointments")}
            <ArrowRightOutlined aria-hidden="true" />
          </Link>
        )}
      </section>

      <Tabs
        items={tabs}
        activeKey={activeTab}
        onChange={(tab) =>
          history.replace({
            pathname: location.pathname,
            search: tab === "published" ? "" : `?tab=${tab}`,
          })
        }
      />

      <AddEventModal
        open={editor.open}
        setOpen={(open) => setEditor((current) => ({ ...current, open }))}
        event_item={editor.event}
        hubOptions={scopeOptions}
        refresh={loadEvents}
        onSaved={(event) => {
          if (event.permissions?.publish && event.status === "draft") {
            openPublication(event);
          }
        }}
      />

      <Modal
        title={
          publication?.approve
            ? t("events.workflow.approveTitle")
            : t("events.workflow.publishTitle")
        }
        open={Boolean(publication)}
        onCancel={() => setPublication(null)}
        onOk={confirmPublication}
        confirmLoading={actionLoading}
        okText={t("events.workflow.publish")}
      >
        <Typography.Paragraph>
          {t("events.workflow.publishDescription", {
            scope: publication?.preview.scope_type,
          })}
        </Typography.Paragraph>
        <Checkbox
          checked={notifyAudience}
          onChange={(event) => setNotifyAudience(event.target.checked)}
        >
          {t("events.workflow.emailRecipients", {
            count: publication?.preview.recipient_count || 0,
          })}
        </Checkbox>
        <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
          {t("events.workflow.emailExclusions")}
        </Typography.Paragraph>
      </Modal>

      <Modal
        title={t("events.workflow.rejectTitle")}
        open={Boolean(rejecting)}
        onCancel={() => setRejecting(null)}
        onOk={confirmRejection}
        confirmLoading={actionLoading}
        okText={t("events.workflow.rejectWithFeedback")}
        okButtonProps={{ danger: true }}
      >
        <Input.TextArea
          rows={4}
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder={t("events.workflow.feedbackPlaceholder")}
        />
      </Modal>
    </div>
  );
}

export default Events;
