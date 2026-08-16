import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Issue from './pages/Issue'
import About from './pages/About'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/en" replace />} />
        <Route path="/:lang" element={<Home />} />
        <Route path="/:lang/issues/:week" element={<Issue />} />
        <Route path="/:lang/about" element={<About />} />
      </Route>
      <Route path="*" element={<Navigate to="/en" replace />} />
    </Routes>
  )
}
