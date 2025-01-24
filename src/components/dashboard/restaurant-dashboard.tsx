'use client'

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useNavigate } from 'react-router-dom'
import { AddRestaurantModal } from './add-restaurant-modal'
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import krontivaLogo from '/krontivalogo.png' // Adjust the path as necessary
import ArrowRight01Icon from '@/assets/icons/arrow-right-01-stroke-rounded'
import ArrowLeft01Icon from '@/assets/icons/arrow-left-01-stroke-rounded'

interface Restaurant {
  id: string
  restaurantName: string
  restaurantEmail: string
  restaurantPhoneNumber: string
  restaurantAddress: string
  restaurantLogo: {
    url: string
    name: string
  }
  created_at: number
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const GET_RESTAURANTS_ENDPOINT = import.meta.env.VITE_GET_RESTAURANTS_ENDPOINT

export default function RestaurantDashboard() {
  const navigate = useNavigate()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const restaurantsPerPage = 12

  const filteredRestaurants = restaurants.filter(restaurant => 
    restaurant.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.restaurantEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.restaurantAddress.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate the current restaurants to display
  const indexOfLastRestaurant = currentPage * restaurantsPerPage
  const indexOfFirstRestaurant = indexOfLastRestaurant - restaurantsPerPage
  const currentRestaurants = filteredRestaurants.slice(indexOfFirstRestaurant, indexOfLastRestaurant)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(
        `${API_BASE_URL}${GET_RESTAURANTS_ENDPOINT}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch restaurants')
      }
      
      const restaurantsData = await response.json()
      setRestaurants(restaurantsData)

    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const refreshData = () => {
    setIsLoading(true)
    setError(null)
    fetchData()
  }

  const handleAddSuccess = () => {
    refreshData()
  }

  const handleRestaurantClick = (restaurant: Restaurant) => {
    const slug = restaurant.restaurantName.toLowerCase().replace(/ /g, '-')
    navigate(`/restaurant/${slug}`, { 
      state: { 
        restaurant,
      }
    })
  }

  const totalPages = Math.ceil(filteredRestaurants.length / restaurantsPerPage)

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="h-6 w-6" />
        <p className="text-lg">Loading restaurants...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <p className="text-lg text-red-500 mb-4">{error}</p>
          <button 
            onClick={refreshData}
            className="px-4 py-2 bg-black text-white rounded hover:bg-black/80"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex-grow container mx-auto py-8 mt-36">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black dark:text-white">
            Restaurant Dashboard 
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white rounded-full text-xs">
              {restaurants.length}
            </span>
          </h1>
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                placeholder="Search restaurants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-black dark:text-white bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <Button onClick={() => setIsAddModalOpen(true)} className="bg-orange-600 dark:bg-gray-800 text-white hover:bg-gray-900/80 dark:hover:bg-gray-700/80 border border-orange-700 dark:border-gray-600">
              Add Restaurant
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentRestaurants.map((restaurant) => (
            <Card 
              key={restaurant.id} 
              className="relative cursor-pointer transition duration-300 ease-in-out hover:grayscale"
              onClick={() => handleRestaurantClick(restaurant)}
            >
              <img 
                src={restaurant.restaurantLogo.url} 
                alt={`${restaurant.restaurantName} logo`}
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-center p-4 rounded-lg">
                <div>
                  <h2 className="font-semibold text-lg">{restaurant.restaurantName}</h2>
                  <p className="text-sm">{restaurant.restaurantEmail}</p>
                  <p className="text-sm">{restaurant.restaurantAddress}</p>
                </div>
              </div>
            </Card>
          ))}
          {currentRestaurants.length === 0 && (
            <div className="col-span-full text-center py-4 text-black">
              {searchQuery ? 'No restaurants found matching your search' : 'No restaurants found'}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-end mt-4 space-x-2">
          <Button 
            onClick={handlePreviousPage} 
            disabled={currentPage === 1} 
            className={`bg-gray-900 text-white hover:bg-gray-800 rounded-md p-2 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ArrowLeft01Icon className="w-4 h-4 text-white" />
          </Button>
          <span className="self-center text-xs">
            Page {currentPage} of {totalPages}
          </span>
          <Button 
            onClick={handleNextPage} 
            disabled={currentPage === totalPages} 
            className={`bg-gray-900 text-white hover:bg-gray-800 rounded-md p-2 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ArrowRight01Icon className="w-4 h-4 text-white" />
          </Button>
        </div>
      </div>

      {/* Footer with Logo */}
      <footer className="bg-gray-100 dark:bg-gray-900 text-black dark:text-white text-center py-4 flex items-center justify-center">
        <p className="mr-2">powered by</p>
        <img src={krontivaLogo} alt="Krontiva Logo" className="h-6" />
      </footer>

      <AddRestaurantModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
    </div>
  )
} 