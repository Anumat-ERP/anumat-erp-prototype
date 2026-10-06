import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Filters } from '../../ui/components/filters';
import { Select } from '../../ui';
function Demo() {
  const [query,setQuery]=useState(''); const [priority,setPriority]=useState('all');
  return <Filters queryValue={query} queryLabel="Search tasks" onQueryChange={setQuery} onQueryClear={()=>setQuery('')} onClearAll={()=>{setQuery('');setPriority('all');}} appliedFilters={priority==='all'?[]:[{key:'priority',label:priority,onRemove:()=>setPriority('all')}]} filters={[{key:'priority',label:'Priority',filter:<Select aria-label="Priority" value={priority} onChange={e=>setPriority(e.target.value)} options={[{value:'all',label:'All priorities'},{value:'high',label:'High'},{value:'low',label:'Low'}]} />}]} />;
}
export default {title:'Components/Data/Filters',component:Demo} satisfies Meta<typeof Demo>;
export const Default:StoryObj<typeof Demo>={};
