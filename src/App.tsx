import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { Shell } from './layout/Shell';
import { Approvals } from './pages/Approvals';
import { Documents } from './pages/Documents';
import { Home } from './pages/Home';
import { Insights } from './pages/Insights';
import { MeetingDetail } from './pages/MeetingDetail';
import { Meetings } from './pages/Meetings';
import { NewMeeting } from './pages/NewMeeting';
import { NewRequest } from './pages/NewRequest';
import { NotFound } from './pages/NotFound';
import { ProcessEditor } from './pages/ProcessEditor';
import { Processes } from './pages/Processes';
import { RequestDetail } from './pages/RequestDetail';
import { Requests } from './pages/Requests';
import { Tasks } from './pages/Tasks';

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
        <Route element={<Shell />}>
          <Route index element={<Home />} />
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
          <Route path="processes" element={<Processes />} />
          <Route path="processes/:id" element={<ProcessEditor />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
