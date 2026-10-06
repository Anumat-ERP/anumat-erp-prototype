import { Tabs, TabsContent, TabsList, TabsTrigger } from '@app/ui';
import { ArrowRight, Check, ClipboardList, Eye, EyeOff, History, MessageCircle, UserCheck, Users, Workflow } from 'lucide-react';
import { Link } from 'react-router';
import { useLocale } from '../i18n/LocaleProvider';
import { ANONYMOUS_SURVEY_MIN_RESPONSES } from '../lib/surveys';

/** Explain the working concepts with labelled diagrams, rather than acronyms alone. */
export function WorkspaceGuide() {
  const { t: tr } = useLocale();
  const roles = [
    { letter: 'R', name: 'Responsible', meaning: 'Does the work', icon: ClipboardList },
    { letter: 'A', name: 'Accountable', meaning: 'Owns the outcome', icon: UserCheck },
    { letter: 'C', name: 'Consulted', meaning: 'Gives advice', icon: MessageCircle },
    { letter: 'I', name: 'Informed', meaning: 'Receives updates', icon: Eye },
  ];
  return <section className="an-work-guide" aria-labelledby="work-guide-heading">
    <div className="an-modules-section-heading">
      <h2 id="work-guide-heading">{tr('A clearer way to work together')}</h2>
      <p>{tr('Steps, roles, privacy and decision history explained.')}</p>
    </div>
    <Tabs defaultValue="steps">
      <TabsList className="an-work-guide-tabs" aria-label={tr('How work is organised')} fitted>
        <TabsTrigger value="steps"><Workflow size={16} aria-hidden />{tr('Work steps')}</TabsTrigger>
        <TabsTrigger value="roles"><Users size={16} aria-hidden />{tr('Team roles')}</TabsTrigger>
        <TabsTrigger value="privacy"><EyeOff size={16} aria-hidden />{tr('Answer privacy')}</TabsTrigger>
        <TabsTrigger value="history"><History size={16} aria-hidden />{tr('Decision history')}</TabsTrigger>
      </TabsList>
      <TabsContent value="steps" className="an-work-guide-panel">
        <div className="an-work-guide-copy">
          <h3>{tr('Follow a repeatable process')}</h3>
          <p>{tr('Set repeatable work steps and choose who reviews each request.')}</p>
          <Link to="/processes" className="an-app-overview-link">{tr('Explore approval processes')}<ArrowRight size={16} aria-hidden /></Link>
        </div>
        <ol className="an-work-guide-flow" aria-label={tr('Example approval process')}>
          {['Submit a request', 'Review the details', 'Record the decision'].map((step, index) => <li key={step}><span className="an-work-guide-step">{index + 1}</span><span>{tr(step)}</span>{index < 2 && <ArrowRight className="an-work-guide-arrow" size={16} aria-hidden />}</li>)}
        </ol>
      </TabsContent>
      <TabsContent value="roles" className="an-work-guide-panel">
        <div className="an-work-guide-copy">
          <h3>{tr('Know who does what')}</h3>
          <p>{tr('Choose who does the work, approves the outcome, gives advice, and receives updates.')}</p>
          <Link to="/tasks" className="an-app-overview-link">{tr('Explore task roles')}<ArrowRight size={16} aria-hidden /></Link>
        </div>
        <dl className="an-work-guide-roles">
          {roles.map(({ letter, name, meaning, icon: Icon }) => <div key={letter}><dt><Icon size={18} aria-hidden /><span>{letter} · {tr(name)}</span></dt><dd>{tr(meaning)}</dd></div>)}
        </dl>
      </TabsContent>
      <TabsContent value="privacy" className="an-work-guide-panel">
        <div className="an-work-guide-copy">
          <h3>{tr('Understand what is shared')}</h3>
          <p>{tr('Check who can see your answers before responding.')}</p>
          <Link to="/surveys" className="an-app-overview-link">{tr('Explore survey privacy')}<ArrowRight size={16} aria-hidden /></Link>
        </div>
        <div className="an-work-guide-privacy">
          <div className="an-work-guide-privacy-options">
            <div><Users size={24} aria-hidden /><strong>{tr('Named answers')}</strong><span>{tr('Names shown with answers')}</span></div>
            <div><EyeOff size={24} aria-hidden /><strong>{tr('Anonymous answers')}</strong><span>{tr('Names hidden in results')}</span></div>
          </div>
          <p>{tr('Anonymous survey totals appear after at least {count} responses.', { count: ANONYMOUS_SURVEY_MIN_RESPONSES })}</p>
        </div>
      </TabsContent>
      <TabsContent value="history" className="an-work-guide-panel">
        <div className="an-work-guide-copy">
          <h3>{tr('See how a decision happened')}</h3>
          <p>{tr('Transparency: see who submitted, discussed, and decided.')}</p>
          <Link to="/requests" className="an-app-overview-link">{tr('Explore request history')}<ArrowRight size={16} aria-hidden /></Link>
        </div>
        <ol className="an-work-guide-timeline" aria-label={tr('Example request history')}>
          <li><ClipboardList size={18} aria-hidden /><div><strong>{tr('Request submitted')}</strong><span>{tr('The request and its context')}</span></div></li>
          <li><MessageCircle size={18} aria-hidden /><div><strong>{tr('Discussion recorded')}</strong><span>{tr('Questions and comments')}</span></div></li>
          <li><Check size={18} aria-hidden /><div><strong>{tr('Decision recorded')}</strong><span>{tr('Who decided and when')}</span></div></li>
        </ol>
      </TabsContent>
    </Tabs>
  </section>;
}
