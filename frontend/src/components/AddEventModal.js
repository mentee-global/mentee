import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  TimePicker,
  Upload,
  notification,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import ImgCrop from "antd-img-crop";
import moment from "moment";
import { useMediaQuery } from "react-responsive";
import { useTranslation } from "react-i18next";

import {
  createEvent,
  fetchEventAudiencePreview,
  updateEvent,
  uploadEventImage,
} from "utils/api";
import { ACCOUNT_TYPE } from "utils/consts";
import { useAuth } from "utils/hooks/useAuth";
import { validateUrl } from "utils/misc";

const AUDIENCE_OPTIONS = [
  { value: ACCOUNT_TYPE.MENTEE, labelKey: "mentees" },
  { value: ACCOUNT_TYPE.MENTOR, labelKey: "mentors" },
  { value: ACCOUNT_TYPE.PARTNER, labelKey: "partners" },
  { value: ACCOUNT_TYPE.HUB, labelKey: "hubs" },
];

function dateValue(value) {
  return value ? moment(value.$date || value) : null;
}

function AddEventModal({
  open,
  setOpen,
  event_item,
  refresh,
  onSaved,
  hubOptions = [],
}) {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const { t } = useTranslation();
  const { role, isAdmin, isMentor, isMentee, isPartner } = useAuth();
  const [form] = Form.useForm();
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [scopeType, setScopeType] = useState("global");
  const [scopeId, setScopeId] = useState();
  const [audienceRoles, setAudienceRoles] = useState([]);
  const [audiencePreview, setAudiencePreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewRequest = useRef(0);

  useEffect(() => {
    if (!open) return;
    const defaultAudience = isMentee
      ? [ACCOUNT_TYPE.MENTEE]
      : isMentor
      ? [ACCOUNT_TYPE.MENTOR, ACCOUNT_TYPE.MENTEE]
      : role === ACCOUNT_TYPE.HUB
      ? [ACCOUNT_TYPE.MENTOR, ACCOUNT_TYPE.MENTEE, ACCOUNT_TYPE.PARTNER]
      : [ACCOUNT_TYPE.MENTOR, ACCOUNT_TYPE.MENTEE];
    const nextScope = event_item?.scope_type || "global";
    const nextAudience =
      event_item?.audience_roles || event_item?.role || defaultAudience;
    setScopeType(nextScope);
    setScopeId(event_item?.scope_id);
    setAudienceRoles(nextAudience);
    form.setFieldsValue({
      title: event_item?.title,
      audience_roles: nextAudience,
      start_date: dateValue(event_item?.start_datetime),
      start_time: dateValue(event_item?.start_datetime),
      end_date: dateValue(event_item?.end_datetime),
      end_time: dateValue(event_item?.end_datetime),
      description: event_item?.description,
      url: event_item?.url,
      scope_type: nextScope,
      scope_id: event_item?.scope_id,
    });
    setImage(event_item?.image_file || null);
  }, [event_item, form, isMentee, isMentor, open, role]);

  useEffect(() => {
    if (!open || !audienceRoles.length) {
      previewRequest.current += 1;
      setAudiencePreview(null);
      setPreviewLoading(false);
      return;
    }

    const requestId = previewRequest.current + 1;
    previewRequest.current = requestId;
    setPreviewLoading(true);
    const timer = window.setTimeout(() => {
      fetchEventAudiencePreview({
        audience_roles: audienceRoles,
        ...(isAdmin ? { scope_type: scopeType, scope_id: scopeId } : {}),
      })
        .then((preview) => {
          if (previewRequest.current === requestId) {
            setAudiencePreview(preview);
          }
        })
        .catch(() => {
          if (previewRequest.current === requestId) {
            setAudiencePreview({ unavailable: true });
          }
        })
        .finally(() => {
          if (previewRequest.current === requestId) {
            setPreviewLoading(false);
          }
        });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [audienceRoles, isAdmin, open, scopeId, scopeType]);

  const close = () => {
    previewRequest.current += 1;
    form.resetFields();
    setImage(null);
    setAudiencePreview(null);
    setOpen(false);
  };

  const previewDescription =
    isMentor || isMentee
      ? t("events.workflow.proposalRecipientEstimateDescription")
      : t("events.workflow.publisherRecipientEstimateDescription");

  const audienceBreakdown = audienceRoles
    .map((audienceRole) => {
      const option = AUDIENCE_OPTIONS.find(
        ({ value }) => value === audienceRole
      );
      if (!option) return null;
      return `${t(`events.workflow.${option.labelKey}`)}: ${
        audiencePreview?.recipient_counts_by_role?.[audienceRole] || 0
      }`;
    })
    .filter(Boolean)
    .join(" · ");

  const save = async () => {
    try {
      const values = await form.validateFields();
      if (values.url && !validateUrl(values.url)) {
        notification.error({ message: t("events.errorURL") });
        return;
      }
      const start = moment(
        `${values.start_date.format("YYYY-MM-DD")} ${values.start_time.format(
          "HH:mm:ss"
        )}`
      );
      const end = moment(
        `${values.end_date.format("YYYY-MM-DD")} ${values.end_time.format(
          "HH:mm:ss"
        )}`
      );
      if (end.isBefore(start)) {
        notification.error({ message: t("events.errorTimeSetting") });
        return;
      }

      setSaving(true);
      const payload = {
        title: values.title,
        audience_roles: values.audience_roles,
        start_datetime: start.toISOString(),
        end_datetime: end.toISOString(),
        description: values.description,
        url: values.url,
        ...(isAdmin
          ? { scope_type: values.scope_type, scope_id: values.scope_id }
          : {}),
      };
      const id = event_item?._id?.$oid;
      const response = id
        ? await updateEvent(id, payload)
        : await createEvent(payload);
      const savedEvent = response.data.result.event;
      const savedId = savedEvent._id.$oid;
      if (image instanceof File) {
        await uploadEventImage(image, savedId);
      }
      notification.success({
        message: id
          ? t("events.workflow.eventUpdated")
          : t("events.workflow.draftSaved"),
      });
      close();
      await refresh();
      onSaved?.(savedEvent);
    } catch (error) {
      if (error?.errorFields) return;
      notification.error({
        message: error?.response?.data?.message || t("events.errorAdd"),
      });
    } finally {
      setSaving(false);
    }
  };

  const formContent = (
    <Form form={form} layout="vertical">
      <Form.Item
        name="audience_roles"
        label={t("events.workflow.audience")}
        rules={[
          {
            required: true,
            message: t("events.workflow.selectAudience"),
          },
        ]}
      >
        <Select
          mode="multiple"
          onChange={setAudienceRoles}
          options={AUDIENCE_OPTIONS.filter((option) => {
            if (isMentee) return option.value === ACCOUNT_TYPE.MENTEE;
            if (isMentor)
              return [ACCOUNT_TYPE.MENTOR, ACCOUNT_TYPE.MENTEE].includes(
                option.value
              );
            if (isPartner)
              return [
                ACCOUNT_TYPE.MENTOR,
                ACCOUNT_TYPE.MENTEE,
                ACCOUNT_TYPE.PARTNER,
              ].includes(option.value);
            return true;
          }).map((option) => ({
            value: option.value,
            label: t(`events.workflow.${option.labelKey}`),
          }))}
        />
      </Form.Item>
      {previewLoading ? (
        <div className="event-editor__preview-loading" aria-live="polite">
          <Spin size="small" />
          <span>{t("events.workflow.recipientEstimateLoading")}</span>
        </div>
      ) : audiencePreview?.unavailable ? (
        <Alert
          className="event-editor__recipient-preview"
          showIcon
          type="info"
          message={t("events.workflow.recipientEstimateUnavailable")}
          description={previewDescription}
        />
      ) : audiencePreview ? (
        <Alert
          className="event-editor__recipient-preview"
          showIcon
          type="info"
          message={t("events.workflow.recipientEstimateTitle", {
            count: audiencePreview.recipient_count,
          })}
          description={
            <Space direction="vertical" size={2}>
              <span>{audienceBreakdown}</span>
              <span>{previewDescription}</span>
            </Space>
          }
        />
      ) : null}
      {isAdmin && (
        <>
          <Form.Item
            name="scope_type"
            label={t("events.workflow.communityScope")}
          >
            <Select
              options={[
                {
                  value: "global",
                  label: t("events.workflow.allCommunities"),
                },
                { value: "hub", label: t("events.workflow.oneHub") },
                {
                  value: "partner",
                  label: t("events.workflow.onePartner"),
                },
              ]}
              onChange={(value) => {
                setScopeType(value);
                setScopeId(undefined);
                form.setFieldValue("scope_id", undefined);
              }}
            />
          </Form.Item>
          {scopeType !== "global" && (
            <Form.Item
              name="scope_id"
              label={
                scopeType === "hub"
                  ? t("events.workflow.hub")
                  : t("events.workflow.partner")
              }
              rules={[{ required: true }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                options={hubOptions.filter(
                  (option) => option.scopeType === scopeType
                )}
                onChange={setScopeId}
              />
            </Form.Item>
          )}
        </>
      )}
      <Form.Item
        name="title"
        label={t("common.title")}
        rules={[{ required: true }]}
      >
        <Input placeholder={t("events.eventTitle")} />
      </Form.Item>
      <Form.Item label={t("events.start")} required>
        <Space wrap>
          <Form.Item name="start_date" noStyle rules={[{ required: true }]}>
            <DatePicker placeholder={t("events.startDate")} />
          </Form.Item>
          <Form.Item name="start_time" noStyle rules={[{ required: true }]}>
            <TimePicker format="h:mm A" placeholder={t("events.startTime")} />
          </Form.Item>
        </Space>
      </Form.Item>
      <Form.Item label={t("events.end")} required>
        <Space wrap>
          <Form.Item name="end_date" noStyle rules={[{ required: true }]}>
            <DatePicker placeholder={t("events.endDate")} />
          </Form.Item>
          <Form.Item name="end_time" noStyle rules={[{ required: true }]}>
            <TimePicker format="h:mm A" placeholder={t("events.endTime")} />
          </Form.Item>
        </Space>
      </Form.Item>
      <Form.Item name="description" label={t("events.summary")}>
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item name="url" label="URL">
        <Input />
      </Form.Item>
      <ImgCrop rotate aspect={5 / 3} minZoom={0.2}>
        <Upload
          beforeUpload={() => false}
          onChange={(info) => setImage(info.file.originFileObj)}
          accept=".png,.jpg,.jpeg"
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>{t("events.uploadImage")}</Button>
        </Upload>
      </ImgCrop>
      {image && (
        <img
          style={{ width: 100, marginLeft: 15 }}
          alt={t("events.workflow.createTitle")}
          src={image instanceof File ? URL.createObjectURL(image) : image.url}
        />
      )}
    </Form>
  );

  if (isMobile) {
    return (
      <Drawer
        title={
          event_item
            ? t("events.workflow.editTitle")
            : t("events.workflow.createTitle")
        }
        open={open}
        onClose={close}
        placement="bottom"
        height="92%"
        footer={
          <div className="event-editor__mobile-actions">
            <Button onClick={close}>{t("common.cancel")}</Button>
            <Button type="primary" loading={saving} onClick={save}>
              {t("events.workflow.saveDraft")}
            </Button>
          </div>
        }
      >
        {formContent}
      </Drawer>
    );
  }

  return (
    <Modal
      title={
        event_item
          ? t("events.workflow.editTitle")
          : t("events.workflow.createTitle")
      }
      open={open}
      onCancel={close}
      onOk={save}
      okText={t("events.workflow.saveDraft")}
      confirmLoading={saving}
      forceRender
    >
      {formContent}
    </Modal>
  );
}

export default AddEventModal;
