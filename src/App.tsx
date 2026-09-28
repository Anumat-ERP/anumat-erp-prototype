import { Fragment, useEffect, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router';
import { TourPanel } from './components/DemoTour';
import { Shell } from './layout/Shell';
import { Approvals } from './pages/Approvals';
import { Documents } from './pages/Documents';
import { Home } from './pages/Home';
import { Landing } from './pages/Landing';
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

/** Scroll to the top and move focus to <main> when the page changes. */
function RouteFocus() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [pathname]);
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
    </>
  );
}
