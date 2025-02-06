import React, { useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
  deleteTrainbyId,
  downloadBlob,
  EditTrainById,
  getTrainById,
  getTrainings,
  getTrainVideo,
  fetchAccounts,
  fetchPartners,
  newTrainCreate,
  updateTrainings,
} from "utils/api";
import { ACCOUNT_TYPE, I18N_LANGUAGES, TRAINING_TYPE } from "utils/consts";
import { HubsDropdown } from "../AdminDropdowns";
import {
  Table,
  Popconfirm,
  message,
  Radio,
  Button,
  notification,
  Spin,
  Tabs,
  Skeleton,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  HolderOutlined,
  PlusCircleOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { withRouter } from "react-router-dom";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DndContext } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

import "components/css/Training.scss";
import AdminDownloadDropdown from "../AdminDownloadDropdown";
import TrainingTranslationModal from "../TrainingTranslationModal";
import UpdateTrainingForm from "../UpdateTrainingModal";

// Ensure RowContext is declared only once
const RowContext = React.createContext({});

const DragHandle = () => {
  const { setActivatorNodeRef, listeners } = useContext(RowContext);
  return (
    <Button
      type="text"
      size="small"
      icon={<HolderOutlined />}
      style={{
        cursor: "move",
      }}
      ref={setActivatorNodeRef}
      {...listeners}
    />
  );
};

const Row = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props["data-row-key"],
  });

  const style = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    ...(isDragging
      ? {
          position: "relative",
          zIndex: 999,
        }
      : {}),
  };

  const contextValue = useMemo(
    () => ({
      setActivatorNodeRef,
      listeners,
    }),
    [setActivatorNodeRef, listeners]
  );

  return (
    <RowContext.Provider value={contextValue}>
      <tr {...props} ref={setNodeRef} style={style} {...attributes} />
    </RowContext.Provider>
  );
};

const AdminTraining = () => {
  const [role, setRole] = useState(ACCOUNT_TYPE.MENTEE);
  const [trainingData, setTrainingData] = useState([]);
  const [reload, setReload] = useState(true);
  const [translateLoading, setTranslateLoading] = useState(false);
  const [translateOpen, setTranslateOpen] = useState(false);
  const [trainingId, setTrainingId] = useState(null);
  const [openUpdateTraining, setOpenUpdateTraining] = useState(false);
  const [currentTraining, setCurrentTraining] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hubOptions, setHubOptions] = useState([]);
  const [resetFilters, setResetFilters] = useState(false);
  const [partnerOptions, setPartnerOptions] = useState([]);
  const [mentorOptions, setMentorOptions] = useState([]);
  const [menteeOptions, setMenteeOptions] = useState([]);
  const [allData, setAllData] = useState([]);

  useEffect(() => {
    // Suppress ResizeObserver loop limit exceeded error
    const resizeObserverError = window.ResizeObserver.prototype.constructor;
    window.ResizeObserver.prototype.constructor = (...args) => {
      const observer = resizeObserverError(...args);
      const error = observer.error;
      observer.error = () => {
        // Ignore ResizeObserver loop limit exceeded error
      };
      return observer;
    };
  }, []);

  const onCancelTrainingForm = () => {
    setTrainingId(null);
    setCurrentTraining(null);
    setOpenUpdateTraining(false);
  };

  useEffect(() => {
    async function getHubData() {
      var temp = [];
      const hub_data = await fetchAccounts(ACCOUNT_TYPE.HUB);
      hub_data.map((hub_item) => {
        temp.push({ label: hub_item.name, value: hub_item._id.$oid });
        return true;
      });
      setHubOptions(temp);
    }
    async function getUsers() {
      var temp = [];
      let data = await fetchPartners();
      data.map((item) => {
        temp.push({
          label: item.organization,
          value: item._id.$oid,
          assign_mentees: item.assign_mentees,
          assign_mentors: item.assign_mentors,
        });
        return true;
      });
      setPartnerOptions(temp);
      data = await fetchAccounts(ACCOUNT_TYPE.MENTEE);
      setMenteeOptions(data);
      data = await fetchAccounts(ACCOUNT_TYPE.MENTOR);
      setMentorOptions(data);
    }
    getHubData();
    getUsers();
  }, []);

  const handleResetFilters = () => {
    setResetFilters(!resetFilters);
    setTrainingData(allData.sort((a, b) => a.sort_order - b.sort_order));
  };

  const onFinishTrainingForm = async (values, isNewTraining) => {
    setLoading(true);
    if (isNewTraining) {
      message.loading("Announcing new training...", 3);
      const res = await newTrainCreate(values);
      if (!res?.success) {
        notification.error({
          message: "ERROR",
          description: `Couldn't create new training`,
        });
      } else {
        notification.success({
          message: "SUCCESS",
          description: "New training has been created successfully",
        });
      }
    } else {
      const res = await EditTrainById(trainingId, values);
      if (!res?.success) {
        notification.error({
          message: "ERROR",
          description: `Couldn't update training`,
        });
      } else {
        notification.success({
          message: "SUCCESS",
          description: "Training has been updated successfully",
        });
      }
    }
    setLoading(false);
    setReload(!reload);
  };

  // ... rest of your component logic

  return (
    <div className="trains">
      {/* Your component JSX */}
    </div>
  );
};

export default withRouter(AdminTraining);