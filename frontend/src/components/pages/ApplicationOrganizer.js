import React, { useState, useEffect } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { fetchApplications, updateApplicationById } from "../../utils/api";
import MentorApplicationView from "../MentorApplicationView";
import { APP_STATUS } from "../../utils/consts";
import useAuth from "utils/hooks/useAuth";

const { confirm } = Modal;

function ApplicationOrganizer() {
  const { onAuthStateChanged } = useAuth();
  const [applicationData, setApplicationData] = useState([]);
  const [columns, setColumns] = useState({
    [1]: {
      name: "Pending",
      items: [],
    },
    [2]: {
      name: "Reviewed",
      items: [],
    },
    [3]: {
      name: "Rejected",
      items: [],
    },
    [4]: {
      name: "Offer Made",
      items: [],
    },
  });

  useEffect(() => {
    const getAllApplications = async () => {
      const applications = await fetchApplications();
      if (applications) {
        const newApplications = applications.mentor_applications.map(
          (app, index) => {
            return {
              ...app,
              index: index,
            };
          }
        );
        setApplicationData(newApplications);
      }
    };

    onAuthStateChanged(getAllApplications);
  }, []);

  useEffect(() => {
    setColumns({
      [1]: {
        name: "Pending",
        items: filterApplications(APP_STATUS.PENDING),
      },
      [2]: {
        name: "Reviewed",
        items: filterApplications(APP_STATUS.REVIEWED),
      },
      [3]: {
        name: "Rejected",
        items: filterApplications(APP_STATUS.REJECTED),
      },
      [4]: {
        name: "Offer Made",
        items: filterApplications(APP_STATUS.OFFER_MADE),
      },
    });
  }, [applicationData]);

  /**
   * Filters application by application state and items stored in the corresponding named columns
   */
  function filterApplications(desiredState) {
    return applicationData
      .filter((state) => state.application_state === desiredState)
      .map((application) => ({
        id: application._id.$oid,
        content:
          "Name: " +
          application.name +
          " Specializations: " +
          application.specializations,
        ...application,
      }));
  }

  /**
   * Confirmation modal when item is dragged to a new column destination
   */
  function showConfirm(name, id, removed, sourceItems, sourceColumn, sourceID) {
    confirm({
      title: "Move this Application?",
      icon: <ExclamationCircleOutlined />,
      onOk() {
        // updates application state of item based on destination column name
        async function updateApplication() {
          // onOk send the put request
          const data = {
            application_state: name,
          };
          await updateApplicationById(data, id);
        }
        updateApplication();
      },
      onCancel() {
        // puts item back into source column if canceled
        sourceItems.push(removed);
        setColumns({
          ...columns,
          [sourceID]: {
            ...sourceColumn,
            items: sourceItems,
          },
        });
      },
    });
  }

  /**
   * Handles dragging of item to a new column
   */
  const onDragEnd = (result, columns, setColumns) => {
    // if no designated column to switch then keep app in curr column
    if (!result.destination) return;

    const { source, destination } = result;
    if (source.droppableId !== destination.droppableId) {
      const sourceColumn = columns[source.droppableId];
      const destColumn = columns[destination.droppableId];
      const sourceItems = [...sourceColumn.items];
      const destItems = [...destColumn.items];
      const [removed] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removed);
      setColumns({
        ...columns,
        [source.droppableId]: {
          ...sourceColumn,
          items: sourceItems,
        },
        [destination.droppableId]: {
          ...destColumn,
          items: destItems,
        },
      });

      var destColumnName = columns[destination.droppableId].name;
      var destItemId = destItems[destination.index].id;
      showConfirm(
        destColumnName,
        destItemId,
        removed,
        sourceItems,
        sourceColumn,
        source.droppableId
      );
    } else {
      const column = columns[source.droppableId];
      const copiedItems = [...column.items];
      const [removed] = copiedItems.splice(source.index, 1);
      copiedItems.splice(destination.index, 0, removed);
      setColumns({
        ...columns,
        [source.droppableId]: {
          ...column,
          items: copiedItems,
        },
      });
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", height: "100%" }}>
      <DragDropContext
        onDragEnd={(result) => onDragEnd(result, columns, setColumns)}
      >
        {/* Mapping each columns from the list. */}
        {Object.entries(columns).map(([columnId, column]) => {
          return (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
              key={columnId}
            >
              <h2>{column.name}</h2>
              <div style={{ margin: 10 }}>
                <Droppable droppableId={columnId} key={columnId}>
                  {/* Causes the droppable item to change color of columm when picked up. */}

                  {(provided, currentApp) => {
                    //printData()
                    return (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        style={{
                          background: currentApp.isDraggingOver
                            ? "#F8D15B"
                            : "#F5F5F5",
                          padding: 4,
                          width: 250,
                          minHeight: 500,
                        }}
                      >
                        {/* Mapping each item from list that corresponds to the column */}
                        {column.items.map((item, index) => {
                          return (
                            <Draggable
                              key={item.id}
                              draggableId={item.id}
                              index={index}
                            >
                              {(provided) => {
                                return (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                      ...provided.draggableProps.style,
                                    }}
                                  >
                                    <MentorApplicationView data={item} />
                                  </div>
                                );
                              }}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    );
                  }}
                </Droppable>
              </div>
            </div>
          );
        })}
      </DragDropContext>
    </div>
  );
}

export default ApplicationOrganizer;
