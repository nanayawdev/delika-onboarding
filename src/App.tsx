import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from '@/pages/home'
import SignIn from '@/components/signin/sign-in'
import RestaurantDashboard from '@/components/dashboard/restaurant-dashboard'
import RestaurantDetail from '@/components/dashboard/restaurant-detail'
import RestaurantOnboarding from '@/components/restaurantonboarding/restaurant-onboarding'
import { Navbar } from '@/components/layout/navbar'
import DarkModeToggle from '@/components/DarkModeToggle'
import BroadcastList from '@/pages/BroadcastList'
import Overview from '@/pages/overview'

function App() {
  return (
    <Router>
      <Navbar />
      <DarkModeToggle />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/dashboard" element={<RestaurantDashboard />} />
        <Route path="/restaurant/:slug" element={<RestaurantDetail />} />
        <Route path="/restaurant-onboarding" element={<RestaurantOnboarding />} />
        <Route path="/broadcast" element={<BroadcastList />} />
        <Route path="/overview" element={<Overview />} />
      </Routes>
    </Router>
  )
}

export default App
