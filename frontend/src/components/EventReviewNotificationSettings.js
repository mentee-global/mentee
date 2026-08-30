import React, { useEffect, useState } from "react";
import { Alert, Button, Select, Spin, Typography, notification } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import {
  fetchEventReviewRecipients,
  updateEventReviewRecipients,
} from "utils/api";

function EventReviewNotificationSettings() {
  const { t } = useTranslation();
  const [admins, setAdmins] = useState([]);
  const [selectedAdminIds, setSelectedAdminIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    fetchEventReviewRecipients()
      .then((settings) => {
        if (!active) return;
        setAdmins(settings.admins || []);
        setSelectedAdminIds(settings.selected_admin_ids || []);
      })
      .catch((error) => {
        if (!active) return;
        notification.error({
          message:
            error?.response?.data?.message ||
            t("events.workflow.reviewRecipientsLoadFailed"),
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [t]);

  const save = async () => {
    if (!selectedAdminIds.length) return;
    setSaving(true);
    try {
      const settings = await updateEventReviewRecipients(selectedAdminIds);
      setSelectedAdminIds(settings.selected_admin_ids || selectedAdminIds);
      notification.success({
        message: t("events.workflow.reviewRecipientsSaved"),
      });
    } catch (error) {
      notification.error({
        message:
          error?.response?.data?.message ||
          t("events.workflow.reviewRecipientsSaveFailed"),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className="event-review-settings"
      aria-labelledby="event-review-settings-title"
    >
      <div className="event-review-settings__heading">
        <span className="event-review-settings__icon" aria-hidden="true">
          <MailOutlined />
        </span>
        <div>
          <Typography.Title level={5} id="event-review-settings-title">
            {t("events.workflow.reviewRecipientsTitle")}
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            {t("events.workflow.reviewRecipientsDescription")}
          </Typography.Paragraph>
        </div>
      </div>

      {loading ? (
        <div className="event-review-settings__loading">
          <Spin size="small" />
        </div>
      ) : (
        <>
          <Select
            mode="multiple"
            showSearch
            className="event-review-settings__selector"
            aria-label={t("events.workflow.reviewRecipientsLabel")}
            placeholder={t("events.workflow.reviewRecipientsPlaceholder")}
            value={selectedAdminIds}
            onChange={setSelectedAdminIds}
            optionFilterProp="label"
            options={admins.map((admin) => ({
              value: admin.id,
              label: `${admin.name} (${admin.email})`,
            }))}
          />
          {!selectedAdminIds.length && (
            <Alert
              type="warning"
              showIcon
              message={t("events.workflow.selectReviewRecipient")}
            />
          )}
          <Button
            type="primary"
            loading={saving}
            disabled={!selectedAdminIds.length}
            onClick={save}
          >
            {t("events.workflow.saveReviewRecipients")}
          </Button>
        </>
      )}
    </section>
  );
}

export default EventReviewNotificationSettings;
