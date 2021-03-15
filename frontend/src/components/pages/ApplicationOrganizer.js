import React, { useState, useEffect} from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { Modal, Button } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { fetchApplications} from "../../utils/api";
import uuid from "uuid/v4";

const { confirm } = Modal;
// const itemsFromBackend = [
//   { id: uuid(), content: "First task" },
//   { id: uuid(), content: "Second task" },
//   { id: uuid(), content: "Third task" },
//   { id: uuid(), content: "Fourth task" },
//   { id: uuid(), content: "Fifth task" }
// ];

// const columnsFromBackend = {
//   [uuid()]: {
//     name: "Requested",
//     items: itemsFromBackend
//   },
//   [uuid()]: {
//     name: "To do",
//     items: []
//   },
//   [uuid()]: {
//     name: "In Progress",
//     items: []
//   },
//   [uuid()]: {
//     name: "Done",
//     items: []
//   }
// };



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

function ApplicationOrganizer() {
  const [applicationData, setApplicationData] = useState([]);

  


  const itemsFromBackend = [
    { id: uuid(), content: "Application" },
    { id: uuid(), content: "Application" },
    { id: uuid(), content: "Application" },
  ];


  useEffect(() => {
    const getAllApplications = async () => {
      const applications = await fetchApplications();
      //console.log(res);
      if (applications) {
      setApplicationData(applications);
      console.log(applicationData);
      }
      //console.log(applicationData);
  
    };
  
    getAllApplications();

  }, []);

  function showConfirm () {
    console.log(applicationData);
    confirm({
      title: 'Move this Application?',
      icon: <ExclamationCircleOutlined />,
      onOk() {
        console.log('OK');
      },
      onCancel() {
        console.log('Cancel');
      },
    });
  }

  // const itemSample = [
  //   {id: uuid(), content: 'Item'},
  //   {id: uuid(), content: 'Item'}
  // ]; 

  const columnHeader = {
    [1]: {
      name: "Pending",
      items: itemsFromBackend
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
  };

  // does not work since applicationData is an empty list 
//   const getApplicationData = () => 
//     applicationData.map
  const [columns, setColumns] = useState(columnHeader);


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
                                      userSelect: "none",
                                      padding: 16,
                                      margin: "0 0 8px 0",
                                      minHeight: "50px",
                                      backgroundColor: "white",
                                      color: "black",
                                      ...provided.draggableProps.style,
                                    }}
                                    
                                    
                                  >
                                    {item.content}  
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