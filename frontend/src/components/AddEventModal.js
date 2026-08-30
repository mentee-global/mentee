import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
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
  submitEvent,
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

const SUMMARY_MAX_LENGTH = 500;

function dateValue(value) {
  return value ? moment(value.$date || value) : null;
}

function eventDateTime(date, time) {
  if (!date || !time) return null;
  return moment(`${date.format("YYYY-MM-DD")} ${time.format("HH:mm:ss")}`);
}

function disabledPastDate(current) {
  return current && current.isBefore(moment().startOf("day"), "day");
}

function eventDraftIsValid(
  values,
  { endsOnDifferentDate, isAdmin, scopeType }
) {
  const start = eventDateTime(values.start_date, values.start_time);
  const endDate = endsOnDifferentDate ? values.end_date : values.start_date;
  const end = eventDateTime(endDate, values.end_time);
  const url = values.url?.trim();
  const validScope =
    !isAdmin || scopeType === "global" || Boolean(values.scope_id);

  return Boolean(
    values.title?.trim() &&
      values.audience_roles?.length &&
      start &&
      end?.isAfter(start) &&
      (!url || validateUrl(url)) &&
      (values.description?.length || 0) <= SUMMARY_MAX_LENGTH &&
      validScope
  );
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
  const requiresReview = isMentor || isMentee;
  const [form] = Form.useForm();
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [scopeType, setScopeType] = useState("global");
  const [scopeId, setScopeId] = useState();
  const [audienceRoles, setAudienceRoles] = useState([]);
  const [audiencePreview, setAudiencePreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [endsOnDifferentDate, setEndsOnDifferentDate] = useState(false);
  const [savedEventId, setSavedEventId] = useState(null);
  const previewRequest = useRef(0);
  const startDate = Form.useWatch("start_date", form);
  const formValues = Form.useWatch([], form) || {};
  const canSave = eventDraftIsValid(formValues, {
    endsOnDifferentDate,
    isAdmin,
    scopeType,
  });

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
    const nextStartDate = dateValue(event_item?.start_datetime);
    const nextEndDate = dateValue(event_item?.end_datetime);
    setScopeType(nextScope);
    setSavedEventId(null);
    setScopeId(event_item?.scope_id);
    setAudienceRoles(nextAudience);
    setEndsOnDifferentDate(
      Boolean(
        nextStartDate &&
          nextEndDate &&
          !nextStartDate.isSame(nextEndDate, "day")
      )
    );
    form.setFieldsValue({
      title: event_item?.title,
      audience_roles: nextAudience,
      start_date: nextStartDate,
      start_time: nextStartDate,
      end_date: nextEndDate || nextStartDate,
      end_time: nextEndDate,
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
    setEndsOnDifferentDate(false);
    setSavedEventId(null);
    setOpen(false);
  };

  const changeStartDate = (value) => {
    const endDate = form.getFieldValue("end_date");
    if (
      !endsOnDifferentDate ||
      (value && endDate && endDate.isBefore(value, "day"))
    ) {
      form.setFieldValue("end_date", value);
    }
  };

  const changeEndDateMode = (event) => {
    const checked = event.target.checked;
    setEndsOnDifferentDate(checked);
    if (!checked) {
      form.setFieldValue("end_date", form.getFieldValue("start_date"));
    }
  };

  const previewDescription =
    isMentor || isMentee
      ? t("events.workflow.proposalRecipientEstimateDescription")
      : t("events.workflow.publisherRecipientEstimateDescription");

  const validateEndTime = (_, value) => {
    const currentStartDate = form.getFieldValue("start_date");
    const currentStartTime = form.getFieldValue("start_time");
    const currentEndDate = form.getFieldValue("end_date") || currentStartDate;
    const start = eventDateTime(currentStartDate, currentStartTime);
    const end = eventDateTime(currentEndDate, value);
    return !start || !end || end.isAfter(start)
      ? Promise.resolve()
      : Promise.reject(new Error(t("events.workflow.eventMustEndAfterStart")));
  };

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
      const endDate = values.end_date || values.start_date;
      const start = eventDateTime(values.start_date, values.start_time);
      const end = eventDateTime(endDate, values.end_time);
      if (!end.isAfter(start)) {
        notification.error({
          message: t("events.workflow.eventMustEndAfterStart"),
        });
        return;
      }

      setSaving(true);
      const payload = {
        title: values.title,
        audience_roles: values.audience_roles,
        start_datetime: start.toISOString(),
        end_datetime: end.toISOString(),
        description: values.description,
        url: values.url?.trim(),
        ...(isAdmin
          ? { scope_type: values.scope_type, scope_id: values.scope_id }
          : {}),
      };
      const id = event_item?._id?.$oid || savedEventId;
      const response = id
        ? await updateEvent(id, payload)
        : await createEvent(payload);
      let savedEvent = response.data.result.event;
      const savedId = savedEvent._id.$oid;
      setSavedEventId(savedId);
      if (image instanceof File) {
        await uploadEventImage(image, savedId);
      }
      if (requiresReview) {
        const submission = await submitEvent(savedId);
        savedEvent = submission.data.result.event;
      }
      notification.success({
        message: requiresReview
          ? t("events.workflow.submitted")
          : id
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

  const endTimeField = (
    <Form.Item
      name="end_time"
      label={t("events.endTime")}
      dependencies={["start_date", "start_time", "end_date"]}
      rules={[{ required: true }, { validator: validateEndTime }]}
    >
      <TimePicker
        className="event-editor__full-width-control"
        format="h:mm A"
        placeholder={t("events.endTime")}
      />
    </Form.Item>
  );

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
      <div className="event-editor__schedule">
        <Form.Item
          name="start_date"
          label={t("events.workflow.eventDate")}
          rules={[{ required: true }]}
        >
          <DatePicker
            className="event-editor__full-width-control"
            disabledDate={disabledPastDate}
            onChange={changeStartDate}
            placeholder={t("events.workflow.selectEventDate")}
          />
        </Form.Item>
        <div
          className={`event-editor__time-grid${
            endsOnDifferentDate ? " event-editor__time-grid--single" : ""
          }`}
        >
          <Form.Item
            name="start_time"
            label={t("events.startTime")}
            rules={[{ required: true }]}
          >
            <TimePicker
              className="event-editor__full-width-control"
              format="h:mm A"
              placeholder={t("events.startTime")}
            />
          </Form.Item>
          {!endsOnDifferentDate && endTimeField}
        </div>
        <Checkbox
          className="event-editor__different-date"
          checked={endsOnDifferentDate}
          disabled={!startDate}
          onChange={changeEndDateMode}
        >
          {t("events.workflow.endsOnDifferentDate")}
        </Checkbox>
        {endsOnDifferentDate && (
          <>
            <Form.Item
              name="end_date"
              label={t("events.endDate")}
              rules={[{ required: true }]}
            >
              <DatePicker
                className="event-editor__full-width-control"
                disabledDate={(current) =>
                  disabledPastDate(current) ||
                  (startDate && current.isBefore(startDate, "day"))
                }
                placeholder={t("events.endDate")}
              />
            </Form.Item>
            {endTimeField}
          </>
        )}
      </div>
      <Form.Item
        name="description"
        label={t("events.summary")}
        rules={[
          {
            max: SUMMARY_MAX_LENGTH,
            message: t("events.workflow.summaryTooLong", {
              count: SUMMARY_MAX_LENGTH,
            }),
          },
        ]}
      >
        <Input.TextArea
          rows={4}
          maxLength={SUMMARY_MAX_LENGTH}
          showCount={{
            formatter: ({ count }) =>
              t("events.workflow.summaryCharactersLeft", {
                count: SUMMARY_MAX_LENGTH - count,
              }),
          }}
        />
      </Form.Item>
      <Form.Item
        name="url"
        label="URL"
        validateTrigger="onBlur"
        rules={[
          {
            validator: (_, value) =>
              !value?.trim() || validateUrl(value.trim())
                ? Promise.resolve()
                : Promise.reject(new Error(t("events.errorURL"))),
          },
        ]}
      >
        <Input
          type="url"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          placeholder={t("events.workflow.urlPlaceholder")}
        />
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
            <Button
              type="primary"
              disabled={!canSave}
              loading={saving}
              onClick={save}
            >
              {requiresReview
                ? t("events.workflow.submit")
                : t("events.workflow.saveDraft")}
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
      okText={
        requiresReview
          ? t("events.workflow.submit")
          : t("events.workflow.saveDraft")
      }
      okButtonProps={{ disabled: !canSave }}
      confirmLoading={saving}
      forceRender
    >
      {formContent}
    </Modal>
  );
}

export default AddEventModal;
