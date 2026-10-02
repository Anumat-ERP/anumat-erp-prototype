import { Fragment, useEffect, useRef, type ReactNode } from 'react';
import { prefersReducedMotion } from './lib/motion';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router';
import { TourPanel } from './components/DemoTour';
import { FloatingSupport } from './components/FloatingSupport';
import { Shell } from './layout/Shell';
import { Approvals } from './pages/Approvals';
import { Documents } from './pages/Documents';
import { Home } from './pages/Home';
import { Landing } from './pages/Landing';
import { Docs } from './pages/Docs';
import { SignIn } from './pages/SignIn';
import { Insights } from './pages/Insights';
import { MeetingDetail } from './pages/MeetingDetail';
import { Meetings } from './pages/Meetings';
import { NewMeeting } from './pages/NewMeeting';
import { NewRequest } from './pages/NewRequest';
import { NotFound } from './pages/NotFound';
import { ProcessEditor } from './pages/ProcessEditor';
import { SurveyDetail } from './pages/SurveyDetail';
import { SurveyEditor } from './pages/SurveyEditor';
import { Surveys } from './pages/Surveys';
import { NotificationSettings } from './pages/NotificationSettings';
import { People } from './pages/People';
import { TelegramPreview } from './pages/TelegramPreview';
import { Pricing } from './pages/Pricing';
import { Support } from './pages/Support';
import { Processes } from './pages/Processes';
import { RequestDetail } from './pages/RequestDetail';
import { Requests } from './pages/Requests';
import { Tasks } from './pages/Tasks';
import { Welcome } from './pages/Welcome';

/** Scroll to the top and move focus to <main> when the page changes. In-page #links glide to their section. */
function RouteFocus() {
  const { pathname, hash, search, key } = useLocation();
  const first = useRef(true);
  const last = useRef({ pathname, hash, search });
  useEffect(() => {
    const initial = first.current;
    first.current = false;
    const previous = last.current;
    last.current = { pathname, hash, search };
    // A filter or tab that only rewrites the query string stays where it is, with focus where the person left it.
    if (!initial && previous.pathname === pathname && previous.hash === hash && previous.search !== search) return;
    if (hash) {
      const target = () => document.getElementById(hash.slice(1));
      // Smooth only when you click a link on a page that is already showing; a fresh load jumps straight there.
      const smooth = !initial && !prefersReducedMotion();
      target()?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
      const el = target();
      if (el && smooth) {
        el.classList.remove('an-arrive');
        void el.offsetWidth;
        el.classList.add('an-arrive');
      }
      if (initial) {
        // Fonts and images above the target can still shift layout; re-align once they settle.
        const realign = () => target()?.scrollIntoView();
        document.fonts.ready.then(realign);
        if (document.readyState !== 'complete') window.addEventListener('load', realign, { once: true });
      }
    } else window.scrollTo(0, 0);
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [pathname, hash, search, key]);
  return null;
}

/** Remounts a page when its :id changes, so nothing from the previous item (a draft, answers, a tab) carries over. */
function Keyed({ children }: { children: ReactNode }) {
  const { id } = useParams();
  const { pathname } = useLocation();
  return <Fragment key={id ?? pathname}>{children}</Fragment>;
}

export function App() {
  return (
    <>
      <RouteFocus />
      <Routes>
        <Route index element={<Landing />} />
        <Route path="signin" element={<SignIn />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="docs" element={<Docs />} />
        <Route path="docs/:topic" element={<Docs />} />
        <Route path="welcome" element={<Welcome />} />
        <Route element={<Shell />}>
          <Route path="home" element={<Home />} />
          <Route path="requests" element={<Requests />} />
          <Route path="requests/new" element={<NewRequest />} />
          <Route path="requests/:id" element={<Keyed><RequestDetail /></Keyed>} />
          <Route path="requests/:id/edit" element={<Keyed><NewRequest /></Keyed>} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="meetings/new" element={<NewMeeting />} />
          <Route path="meetings/:id" element={<Keyed><MeetingDetail /></Keyed>} />
          <Route path="documents" element={<Documents />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="insights" element={<Insights />} />
          <Route path="settings/people" element={<People />} />
          <Route path="settings/feedback" element={<Navigate to="/surveys?tab=feedback" replace />} />
          <Route path="surveys" element={<Surveys />} />
          <Route path="surveys/new" element={<Keyed><SurveyEditor /></Keyed>} />
          <Route path="surveys/:id" element={<Keyed><SurveyDetail /></Keyed>} />
          <Route path="surveys/:id/edit" element={<Keyed><SurveyEditor /></Keyed>} />
          <Route path="support" element={<Support />} />
          <Route path="settings/notifications" element={<NotificationSettings />} />
          <Route path="telegram" element={<TelegramPreview />} />
          <Route path="processes" element={<Processes />} />
          <Route path="processes/:id" element={<Keyed><ProcessEditor /></Keyed>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <TourPanel />
      <FloatingSupport />
    </>
  );
}
