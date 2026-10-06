import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { BulkActions, Button } from '../../ui';
function Demo() { const [count,setCount]=useState(2); const [all,setAll]=useState(false); return <div className="story-stack"><BulkActions selectedCount={count} pageItemCount={3} totalCount={12} allSelected={all} resourceName={{singular:'task',plural:'tasks'}} promotedActions={[{content:'Mark done',onAction:()=>{setCount(0);setAll(false);}}]} actions={[{content:'Delete',destructive:true,onAction:()=>{setCount(0);setAll(false);}}]} onSelectAll={()=>setAll(true)} onClearSelection={()=>{setCount(0);setAll(false);}} onUndoSelectAll={()=>setAll(false)} /><Button onClick={()=>setCount(2)}>Select two tasks</Button></div>; }
export default {title:'Components/Data/BulkActions',component:Demo} satisfies Meta<typeof Demo>;
export const Default:StoryObj<typeof Demo>={};
