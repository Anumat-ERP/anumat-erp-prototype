import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { RichTextEditor, plainTextDocument } from '../../components/RichTextEditor';
import { TaskRequirements } from '../../components/TaskRequirements';
import { TaskPriorityBadge } from '../../components/TaskPriorityBadge';
import type { Task } from '../../data/types';
import { storyState } from '../fixtures';
import '../../styles/work-item-editor.css';
function Demo({requirements=false,disabled=false}) {
  const [document,setDocument]=useState(plainTextDocument('Prepare onboarding\nConfirm tools, training, and ownership.'));
  const [task,setTask]=useState<Task>({...storyState().tasks[0]!,expectedOutcome:'Every new starter has access on day one.',acceptanceCriteria:[{id:'ac',text:'Accounts tested by the starter',done:false}],readiness:[{id:'dor',text:'Scope and owner agreed',done:true}],completion:[{id:'dod',text:'Acceptance criteria verified',done:false}]});
  return <div className="story-stack">{requirements?<TaskRequirements task={task} disabled={disabled} onChange={patch=>setTask({...task,...patch})} />:<RichTextEditor documentKey="storybook-editor" document={document} disabled={disabled} onChange={setDocument} />}</div>;
}
export default {title:'Patterns/Work items',component:Demo} satisfies Meta<typeof Demo>;
type Story=StoryObj<typeof Demo>;
export const RichDescription:Story={};
export const RichDescriptionReadOnly:Story={args:{disabled:true}};
export const ReadinessAndCompletion:Story={args:{requirements:true}};
export const RequirementsReadOnly:Story={args:{requirements:true,disabled:true}};
export const Priorities:Story={render:()=> <div className="story-row">{(['highest','high','medium','low','lowest'] as const).map(priority=><TaskPriorityBadge key={priority} priority={priority} />)}</div>};
