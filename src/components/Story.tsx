
import React from "react";
import StoryView from "./story/StoryView";

interface StoryProps {
  children?: any[];
  onCreateChild?: (childData: any) => Promise<any>;
}

const Story: React.FC<StoryProps> = ({ children = [], onCreateChild }) => {
  return <StoryView children={children} onCreateChild={onCreateChild} />;
};

export default Story;
