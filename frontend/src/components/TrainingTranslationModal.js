import React, { useState } from "react";
import { Alert, Modal, notification } from "antd";
import { translateDocuments } from "utils/api";

import "components/css/Training.scss";
import { IS_DEVELOPMENT, IS_PRODUCTION } from "utils/consts";

function TrainingTranslationModal({
  trainingId,
  openModal,
  setOpenModal,
  // documentCost,
}) {
  const [translateLoading, setTranslateLoading] = useState(false);
  const blockTranslation = IS_DEVELOPMENT || !IS_PRODUCTION;

  const handleTranslateConfirm = async (trainingId) => {
    if (blockTranslation) {
      notification.warning({
        message: "WARNING",
        description: `Translation is disabled in development mode`,
      });
      setOpenModal(false);
      return;
    }

    setTranslateLoading(true);
    const res = await translateDocuments(trainingId);
    if (!res?.success) {
      notification.error({
        message: "ERROR",
        description: `Couldn't translate file`,
      });
    } else {
      notification.success({
        message: "SUCCESS",
        description: "Translation has been done successfully",
      });
    }
    setOpenModal(false);
    setTranslateLoading(false);
  };

  return (
    <div>
      <Modal
        title={"Translate Training"}
        okText="Yes"
        onOk={() => handleTranslateConfirm(trainingId)}
        onCancel={() => {
          setOpenModal(false);
          notification.info({
            message: "INFO",
            description: `No translation has been done`,
          });
        }}
        open={openModal}
        confirmLoading={translateLoading}
      >
        <div className="translate-modal-container">
          {`Are you sure you want to translate? This will cost you $0.08 cents per per page per language.`}
          {(!IS_PRODUCTION || IS_DEVELOPMENT) && (
            <Alert
              message="Warning"
              description="Feature is disabled in development mode since this will incur charges"
              type="warning"
              showIcon
            />
          )}
        </div>
      </Modal>
    </div>
  );
}

export default TrainingTranslationModal;
