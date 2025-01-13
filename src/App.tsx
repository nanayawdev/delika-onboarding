import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from '@/pages/home'
import SignIn from '@/components/signin/sign-in'
import RestaurantDashboard from '@/components/dashboard/restaurant-dashboard'
import RestaurantDetail from '@/components/dashboard/restaurant-detail'
import RestaurantOnboarding from '@/components/restaurantonboarding/restaurant-onboarding'
import { Navbar } from '@/components/layout/navbar'

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/dashboard" element={<RestaurantDashboard />} />
        <Route path="/restaurant/:slug" element={<RestaurantDetail />} />
        <Route path="/restaurant-onboarding" element={<RestaurantOnboarding />} />
      </Routes>
    </Router>
  )
}

export default App
