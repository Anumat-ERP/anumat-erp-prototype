import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../../ui';
import { FormBuilder } from '../../components/forms/FormBuilder';
import { FormRenderer } from '../../components/forms/FormRenderer';
import { validateForm } from '../../lib/forms';
import { useLocale } from '../../i18n/LocaleProvider';
import { demoProcess } from '../fixtures';
import type { FormField, FormValues } from '../../data/types';
const allFields:FormField[]=['text','longtext','number','money','date','email','phone','url','select','radio','checkboxes','yesno','rating','scale','person','department','section'].map((kind,i)=>({id:`field-${i}`,label:`${kind} example`,kind:kind as FormField['kind'],required:kind!=='section',options:['Operations','Finance','People']}));
function Demo({builder=false,allTypes=false,disabled=false}) {
  const [fields,setFields]=useState(allTypes?allFields:demoProcess.fields!); const [values,setValues]=useState<FormValues>({}); const [errors,setErrors]=useState<Record<string,string>>({}); const {t}=useLocale();
  return <div className="story-stack">{builder?<FormBuilder fields={fields} onChange={setFields} />:<><FormRenderer fields={fields} values={values} onChange={setValues} errors={errors} disabled={disabled} numbered /><Button variant="primary" disabled={disabled} onClick={()=>setErrors(validateForm(fields,values,t))}>Check answers</Button></>}</div>;
}
export default {title:'Patterns/Dynamic forms',component:Demo,parameters:{docs:{description:{component:'Request and survey forms share one schema. Choose Urgent to reveal the dependent question. Check answers shows real translated validation. Builder lets you add questions and safely change dependencies.'}}}} satisfies Meta<typeof Demo>;
type Story=StoryObj<typeof Demo>;
export const ConditionalQuestions:Story={};
export const QuestionBuilder:Story={args:{builder:true}};
export const AllQuestionTypes:Story={args:{allTypes:true}};
export const ReadOnly:Story={args:{disabled:true}};
