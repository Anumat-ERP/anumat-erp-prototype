import type { Meta, StoryObj } from '@storybook/react-vite';
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '../../ui';
const config={completed:{label:'Completed tasks',color:'var(--primary)'}};
function Demo() { return <div className="story-stack"><p>Illustrative sprint data: Sprint 1: 8, Sprint 2: 12, Sprint 3: 10 completed tasks.</p><ChartContainer config={config} className="h-64"><BarChart data={[{name:'Sprint 1',completed:8},{name:'Sprint 2',completed:12},{name:'Sprint 3',completed:10}]} accessibilityLayer><XAxis dataKey="name" /><YAxis /><Tooltip content={<ChartTooltipContent config={config} />} /><Bar dataKey="completed" fill="var(--color-completed)" radius={4} /></BarChart></ChartContainer></div>; }
export default {title:'Components/Data/Chart',component:Demo} satisfies Meta<typeof Demo>;
export const Default:StoryObj<typeof Demo>={};
