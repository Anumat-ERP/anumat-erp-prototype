import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { DropZone } from '../../ui';
function Demo({disabled=false,error=false}) { const [files,setFiles]=useState<string[]>([]); return <div className="story-stack"><DropZone label="Supporting documents" accept=".pdf,.csv" multiple maxSize={10485760} disabled={disabled} error={error ? "Upload failed. Try again." : undefined} hint="PDF or CSV, up to 10 MB. Files stay in this example." onDrop={accepted=>setFiles(accepted.map(f=>f.name))} /><p role="status">{files.join(", ")}</p></div>; }
const meta = {title:'Components/Forms/DropZone', component: Demo, parameters: {docs: {description: {component: 'Local file selection only. The component validates type and size; uploading is an application responsibility.'}}}} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = {args:{disabled:true}};
export const Error: Story = {args:{error:true}};
