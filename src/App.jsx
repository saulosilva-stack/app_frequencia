import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Turmas from './pages/Turmas'
import Chamada from './pages/Chamada'
import RelatorioFrequencia from './pages/RelatorioFrequencia'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Turmas />} />
        <Route path="/chamada/:turmaId" element={<Chamada />} />
        <Route path="/relatorio/:turmaId" element={<RelatorioFrequencia />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App