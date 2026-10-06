import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@app/ui';
import { ArrowRight, BookOpen, LockKeyhole } from 'lucide-react';
import { Link } from 'react-router';
import { useStore } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';
import { APP_CATALOG } from '../lib/appCatalog';
import { appRole } from '../lib/appAccess';
import { appFromRoute, type WorkspaceApp } from '../lib/moduleEntry';
import '../styles/workflow-guidance.css';

/** Optional task guidance; steps describe the workflow, never claim completion. */
export function AppWorkflowGuide({ app }: { app: WorkspaceApp }) {
  const { t: tr } = useLocale();
  const { state } = useStore();
  const guide = APP_CATALOG[app];
  return <Accordion type="single" collapsible className="an-workflow-guidance" key={app}>
    <AccordionItem value="guide"><AccordionTrigger className="an-workflow-trigger"><span className="inline-flex items-center gap-2"><BookOpen size={16} aria-hidden />{tr('How this app works')}</span></AccordionTrigger>
      <AccordionContent><p className="an-workflow-summary">{tr(guide.description)}</p>
        <ol className="an-workflow-steps">{guide.steps.map((step, index) => {
          const destination = appFromRoute(step.href);
          const permitted = (!step.admin || appRole(state, app) === 'admin') && (!destination || !!appRole(state, destination));
          return <li key={index}><span className="an-workflow-number" aria-hidden>{index + 1}</span><div><h3>{tr(step.title)}</h3><p>{tr(step.text)}</p>{permitted ? <Link to={step.href}>{tr('Open {section}', { section: tr(step.title) })}<ArrowRight size={14} aria-hidden /></Link> : <span className="an-workflow-access"><LockKeyhole size={14} aria-hidden />{tr('Ask an app admin for access.')}</span>}</div></li>;
        })}</ol>
        <Link className="an-workflow-docs" to={`/docs/${app === 'approvals' ? 'workflow-approvals' : app}`}>{tr('Read the full guide')}<ArrowRight size={14} aria-hidden /></Link>
      </AccordionContent>
    </AccordionItem>
  </Accordion>;
}
