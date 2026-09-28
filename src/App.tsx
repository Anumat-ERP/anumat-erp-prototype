import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router';
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
import { People } from './pages/People';
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

export function App() {
  return (
    <>
      <RouteFocus />
      <Routes>
        <Route index element={<Landing />} />
        <Route path="signin" element={<SignIn />} />
        <Route path="welcome" element={<Welcome />} />
        <Route element={<Shell />}>
          <Route path="home" element={<Home />} />
          <Route path="requests" element={<Requests />} />
          <Route path="requests/new" element={<NewRequest />} />
          <Route path="requests/:id" element={<RequestDetail />} />
          <Route path="requests/:id/edit" element={<NewRequest />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="meetings/new" element={<NewMeeting />} />
          <Route path="meetings/:id" element={<MeetingDetail />} />
          <Route path="documents" element={<Documents />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="insights" element={<Insights />} />
          <Route path="settings/people" element={<People />} />
          <Route path="processes" element={<Processes />} />
          <Route path="processes/:id" element={<ProcessEditor />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <TourPanel />
    </>
  );
}
