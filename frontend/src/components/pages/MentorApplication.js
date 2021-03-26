import React, { useEffect, useState } from "react";
import { Steps, message } from 'antd';
import MenteeButton from "../MenteeButton";

function MentorApplication() { 
    const { Step } = Steps;
    const steps = [
        {
          title: 'Personal Information',
          content: 'First-content',
        },
        {
          title: 'Commitments',
          content: 'Second-content',
        },
        {
          title: 'Work Informatiom',
          content: 'Last-content',
        },
        {
            title: 'Specialization Information',
            content: 'Last-content',
        },
      ];
      
    const [current, setCurrent] = useState(0); 
    const next = () => {
        setCurrent(current + 1);
      };
    
      const prev = () => {
        setCurrent(current - 1);
      };
    
    return (
        <>
          <Steps current={current}>
            {steps.map(item => (
              <Step key={item.title} title={item.title} />
            ))}
          </Steps>
          <div className="steps-content">{steps[current].content}</div>
          <div className="steps-action">
          <div className="next-button">
            {current < steps.length - 1 && (
              <MenteeButton 
              content={<b>Next ></b>}
              width={"7%"}
              onClick={() => next()}
    
             />
            )}
          </div>
          <div className="previous-button">
            {current > 0 && (
              <MenteeButton 
              content={<b> Previous</b>}
              width={"7%"}
              onClick={() => prev()}
             />
            )}
            </div>
            {current === steps.length - 1 && (
              <MenteeButton type="primary" onClick={() => message.success('Processing complete!')}>
                Done
              </MenteeButton>
            )}
            </div>
        </>
      );
}
export default MentorApplication; 