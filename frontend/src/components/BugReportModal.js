import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Button, Form, Input, Modal, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { submitBugReport } from "utils/api";
import { ACCOUNT_TYPE_LABELS } from "utils/consts";

function BugReportModal({ open, onClose, contextLabel }) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const user = useSelector((state) => state.user?.user);
  const role = useSelector((state) => state.user?.role);
  const isLoggedIn = Boolean(user && user.email);

  const initialValues = useMemo(() => ({}), []);

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions to keep file size reasonable
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with quality setting
          const base64Content = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
          resolve({
            name: file.name.replace(/\.\w+$/, '.jpg'), // Change extension to jpg
            content: base64Content,
            type: 'image/jpeg',
          });
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);

    try {
      // Convert and compress files to base64
      const attachmentsPromises = fileList.map((file) => {
        // If it's an image, compress it
        if (file.type && file.type.startsWith('image/')) {
          return compressImage(file.originFileObj);
        }
        
        // For non-images (like PDFs), just convert to base64
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64Content = reader.result.split(',')[1];
            resolve({
              name: file.name,
              content: base64Content,
              type: file.type || "application/octet-stream",
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file.originFileObj);
        });
      });

      const attachments = await Promise.all(attachmentsPromises);

      // Show uploading message if there are attachments
      if (attachments.length > 0) {
        message.loading({ content: `Uploading ${attachments.length} file(s)...`, key: 'upload', duration: 0 });
      }

      const bugReportData = {
        description: values.description,
        user_name: user?.name || values.name || "Not provided",
        user_email: user?.email || values.email || "Not provided",
        role: ACCOUNT_TYPE_LABELS[role] || "unknown",
        context: contextLabel || "app",
        page_url: window.location.href,
        attachments: attachments,
      };

      const response = await submitBugReport(bugReportData);
      
      // Dismiss loading message
      message.destroy('upload');

      if (response && response.status === 200) {
        message.success("Bug report submitted successfully!");
        form.resetFields();
        setFileList([]);
        onClose();
      } else {
        message.error(
          response?.data?.message ||
            "Failed to submit bug report. Please try again."
        );
      }
    } catch (error) {
      console.error("Error submitting bug report:", error);
      message.destroy('upload');
      message.error("Failed to submit bug report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    onClose();
  };

  return (
    <Modal
      title="Report a bug"
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={initialValues}
      >
        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: true, message: "Please describe the issue." }]}
        >
          <Input.TextArea
            rows={4}
            placeholder="What happened? Include any error messages."
          />
        </Form.Item>
        {!isLoggedIn && (
          <>
            <Form.Item
              label="Name"
              name="name"
              rules={[{ required: true, message: "Please enter your name." }]}
            >
              <Input placeholder="Your name" />
            </Form.Item>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Please enter your email." },
                { type: "email", message: "Enter a valid email." },
              ]}
            >
              <Input placeholder="you@example.com" />
            </Form.Item>
          </>
        )}
        <Form.Item label="Screenshots (optional)">
          <Upload
            multiple
            fileList={fileList}
            beforeUpload={(file) => {
              const isLt5M = file.size / 1024 / 1024 < 5;
              if (!isLt5M) {
                message.error(`${file.name} is too large. Max 5MB per file.`);
                return Upload.LIST_IGNORE;
              }
              return false;
            }}
            onChange={({ fileList: nextList }) => setFileList(nextList)}
            accept="image/*,.pdf"
            maxCount={3}
          >
            <Button icon={<UploadOutlined />}>Add files</Button>
          </Upload>
          <div style={{ fontSize: "12px", color: "#8c8c8c", marginTop: "4px" }}>
            Files will be attached to the email. Max 3 files, 5MB each.
          </div>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting}>
            {submitting ? "Submitting..." : "Submit bug report"}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default BugReportModal;
