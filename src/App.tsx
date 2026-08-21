import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Events from './pages/Events';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import OfficePJ from './pages/OfficePJ';
import JudgesPage from './pages/JudgesPage';
import News from './pages/News';
import Publications from './pages/Publications';
import Missionandvision from './pages/Missionandvision';
import HistoryElc from './pages/HistoryElc';
import Mandj from './pages/mandj';
import ElcAdvisoryCommittee from './pages/ElcAdvisoryCommittee';
import OfficeoftheRegistrar from './pages/OfficeoftheRegistrar';
import ElcDocuments from './pages/ElcDocuments';
import ContactPage from './pages/ContactPage';
import ElcRegistry from './pages/ElcRegistry';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Parent route using the shared MainLayout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/media/events" element={<Events />} />
          <Route path="/leadership/principal-judge" element={<OfficePJ />} />
          <Route path="/elc-judges" element={<JudgesPage />} />
          <Route path="/media/news" element={<News />} />
          <Route path="/media/publications" element={<Publications />} />
          <Route path="/about/vision" element={<Missionandvision />} />
          <Route path="/about/history" element={<HistoryElc />} />
          <Route path="/about/mandate" element={<Mandj />} />
          <Route path="/leadership/advisory-committee" element={<ElcAdvisoryCommittee />} />
          <Route path="/leadership/registrar" element={<OfficeoftheRegistrar />} />
          <Route path="/media/documents" element={<ElcDocuments />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/elc-registry" element={<ElcRegistry />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;