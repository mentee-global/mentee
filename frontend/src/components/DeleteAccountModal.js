import React, { useState, useEffect } from "react";
import { Modal, Button, Checkbox, Alert, Typography } from "antd";
import { ExclamationCircleFilled, DeleteOutlined } from "@ant-design/icons";
import { ACCOUNT_TYPE } from "utils/consts";

const { Paragraph, Text } = Typography;

// Two-step confirmation for the destructive "delete account" admin action.
// Step 1 explains exactly what is removed vs retained; step 2 forces an explicit
// "cannot be undone" acknowledgement before the delete button enables.
function DeleteAccountModal({ open, account, onCancel, onConfirm }) {
  const [step, setStep] = useState(1);
  const [acknowledged, setAcknowledged] = useState(false);

  // Reset to the first step whenever the modal is (re)opened for a new account.
  useEffect(() => {
    if (open) {
      setStep(1);
      setAcknowledged(false);
    }
  }, [open]);

  const name = account?.name || "this account";
  const isHub = account?.type === ACCOUNT_TYPE.HUB;

  const removed = [
    "Their profile and account record",
    "Login access — they can no longer sign in, and their email is freed",
    "Connected-app access (OAuth tokens) and the email allowlist entry",
  ];
  const kept = [
    'Past direct messages — kept for the people they talked with, shown as "Deleted Account" with replies disabled',
    "Appointment history and application records",
  ];

  const footer =
    step === 1
      ? [
          <Button key="cancel" onClick={onCancel}>
            Cancel
          </Button>,
          <Button key="next" type="primary" danger onClick={() => setStep(2)}>
            Continue
          </Button>,
        ]
      : [
          <Button key="back" onClick={() => setStep(1)}>
            Back
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            disabled={!acknowledged}
            icon={<DeleteOutlined />}
            onClick={onConfirm}
          >
            Permanently delete
          </Button>,
        ];

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      destroyOnClose
      title={
        <span>
          <ExclamationCircleFilled
            style={{ color: "#faad14", marginRight: 8 }}
          />
          Delete {name} — step {step} of 2
        </span>
      }
      footer={footer}
    >
      {step === 1 ? (
        <div>
          <Paragraph>
            You are about to delete <Text strong>{name}</Text>. Please review
            what happens before continuing.
          </Paragraph>
          <Paragraph strong style={{ marginBottom: 4 }}>
            This permanently removes:
          </Paragraph>
          <ul>
            {removed.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Paragraph strong style={{ marginBottom: 4 }}>
            This is kept:
          </Paragraph>
          <ul>
            {kept.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {isHub && (
            <Alert
              type="warning"
              showIcon
              style={{ marginTop: 8 }}
              message="A hub that still owns announcements, events, training, partners or other content cannot be deleted until that content is reassigned or removed."
            />
          )}
        </div>
      ) : (
        <div>
          <Alert
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
            message="This action cannot be undone"
            description={
              <>
                Deleting <Text strong>{name}</Text> permanently removes their
                account and access. This cannot be restored.
              </>
            }
          />
          <Checkbox
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
          >
            I understand this is permanent and cannot be undone.
          </Checkbox>
        </div>
      )}
    </Modal>
  );
}

export default DeleteAccountModal;
