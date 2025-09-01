import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'

// Pages
import HomePage from '@/pages/HomePage'
import CalculatorPage from '@/pages/CalculatorPage'
import PoliciesPage from '@/pages/PoliciesPage'
import ClaimsPage from '@/pages/ClaimsPage'
import ProfilePage from '@/pages/ProfilePage'

// Components
import Layout from '@/components/common/Layout'
import ErrorBoundary from '@/components/common/ErrorBoundary'

// Hooks
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'

// Styles
import './styles/App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 минут
    },
  },
})

function App() {
  const { user, themeParams } = useTelegramWebApp()

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Router>
          <Layout themeParams={themeParams} user={user}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/calculator" element={<CalculatorPage />} />
              <Route path="/policies" element={<PoliciesPage />} />
              <Route path="/claims" element={<ClaimsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </Layout>
        </Router>
      </ErrorBoundary>
    </QueryClientProvider>
  )
}

export default App
