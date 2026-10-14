import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Welcome } from './pages/Welcome';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { TopicSelection } from './pages/TopicSelection';
import { LearnWorkspace } from './pages/LearnWorkspace';
import { PracticeWorkspace } from './pages/PracticeWorkspace';
import { QuizWorkspace } from './pages/QuizWorkspace';
import { QuizResults } from './pages/QuizResults';
import { ProgressRevision } from './pages/ProgressRevision';
import { Settings } from './pages/Settings';
import { Layout } from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/onboarding" element={<Onboarding />} />
        
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/topics" element={<TopicSelection />} />
          <Route path="/learn/:topicId" element={<LearnWorkspace />} />
          <Route path="/practice" element={<PracticeWorkspace />} />
          <Route path="/quiz" element={<QuizWorkspace />} />
          <Route path="/quiz/results" element={<QuizResults />} />
          <Route path="/progress" element={<ProgressRevision />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
