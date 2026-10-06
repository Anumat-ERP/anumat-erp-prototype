import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { DataTable, IndexTable, Badge, EmptyState, Button, type Selection } from '../../ui';
const rows = [{id:'AN-101',title:'Prepare onboarding',priority:1,status:'In progress'},{id:'AN-102',title:'Review training plan',priority:2,status:'To do'},{id:'AN-103',title:'Verify access',priority:3,status:'Done'}];
const columns = [{id:'title',header:'Task',sortable:true},{id:'priority',header:'Priority order',numeric:true,sortable:true},{id:'status',header:'Status',cell:(row:typeof rows[number])=><Badge tone={row.status==='Done'?'success':'info'}>{row.status}</Badge>}];
function Demo({loading=false,empty=false,error=false,dense=false,index=false}) {
  const [selected,setSelected]=useState<Selection>([]);
  const props={caption:'Sprint tasks',columns,rows:empty?[]:rows,loading,density:dense?'dense' as const:'comfortable' as const,selectedRows:selected,onSelectionChange:setSelected,getRowLabel:(r:typeof rows[number])=>r.title,emptyState:<EmptyState heading="No tasks match" size="card" image={null} />,error:error?<p>Unable to load tasks. <Button onClick={()=>window.location.reload()}>Retry</Button></p>:undefined};
  return index ? <IndexTable {...props} resourceName={{singular:'task',plural:'tasks'}} /> : <DataTable {...props} />;
}
const meta={title:'Components/Data/DataTable',component:Demo,parameters:{docs:{description:{component:'Sortable, selectable tables with loading, empty and error states. Selection belongs to the parent. Use IndexTable for resource lists.'}}}} satisfies Meta<typeof Demo>;
export default meta;
type Story=StoryObj<typeof meta>;
export const Default:Story={};
export const Dense:Story={args:{dense:true}};
export const Loading:Story={args:{loading:true}};
export const Empty:Story={args:{empty:true}};
export const Error:Story={args:{error:true}};
export const ResourceIndex:Story={args:{index:true}};
