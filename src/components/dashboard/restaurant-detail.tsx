'use client'

import React, { useMemo } from 'react';
import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Share2, MessageSquare, PenSquare, Building2, TrendingUp, Building, DollarSign, RefreshCcw, Users, UsersIcon, MoreHorizontal, Pencil, Trash2, User, Search } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EditRestaurantModal } from './edit-restaurant-modal'
import { AddBranchModal } from './add-branch-modal'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { ErrorState } from "@/components/ui/error-state"
import { AddUserModal } from './add-user-modal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteWarningModal } from './delete-warning-modal'
import { EditUserModal } from './edit-user-modal'
import { toast } from "sonner"
import { Sonner } from "@/components/ui/sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EditBranchModal } from './edit-branch-modal'
import krontivaLogo from '/krontivalogo.png' // Adjust the path as necessary
import PurseIcon from '@/assets/icons/purse-stroke-rounded'
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Papa from 'papaparse'
interface Restaurant {
  id: string
  restaurantName: string
  restaurantEmail: string
  restaurantPhoneNumber: string
  restaurantAddress: string
  restaurantLogo: {
    url: string
    name: string
    access: string
    path: string
    type: string
    size: number
    mime: string
    meta: {
      width: number
      height: number
    }
  }
  created_at: number
}

interface Branch {
  id: string
  created_at: number
  branchName: string
  restaurantID: string
  branchLocation: string
  branchPhoneNumber: string
  branchCity: string
  branchLongitude: string
  branchLatitude: string
  _restaurantTable: Restaurant[]
}

interface OrderProduct {
  name: string;
  price: number;
  quantity: number;
  image: string | null;
}

interface OrderLocation {
  fromLatitude?: number;
  fromLongitude?: number;
  fromAddress?: string;
  toLatitude?: number;
  toLongitude?: number;
  toAddress?: string;
}

interface Order {
  id: string;
  created_at: number;
  restaurantId: string;
  branchId: string;
  customerName: string;
  customerPhoneNumber: string;
  orderNumber: string;
  deliveryDistance: number;
  trackingUrl: string;
  courierName: string;
  courierPhoneNumber: string;
  orderStatus: string;
  orderDate: string;
  deliveryPrice: number;
  orderPrice: number;
  totalPrice: number;
  pickupName: string;
  dropoffName: string;
  foodAndDeliveryFee: boolean;
  onlyDeliveryFee: boolean;
  payNow: boolean;
  payLater: boolean;
  paymentStatus: string;
  dropOffCity: string;
  orderComment: string;
  products: OrderProduct[];
  pickup: OrderLocation[];
  dropOff: OrderLocation[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const GET_RESTAURANTS_ENDPOINT = import.meta.env.VITE_GET_RESTAURANTS_ENDPOINT;
const GET_BRANCHES_ENDPOINT = import.meta.env.VITE_GET_BRANCHES_ENDPOINT;
const GET_USERS_ENDPOINT = import.meta.env.VITE_GET_USERS_ENDPOINT;
const GET_ORDERS_ENDPOINT = import.meta.env.VITE_GET_ORDERS_ENDPOINT;

export default function RestaurantDetail() {
  const location = useLocation()
  const navigate = useNavigate()
  const { restaurant: initialRestaurant, restaurants = [] } = location.state || {}
  const [restaurant, setRestaurant] = useState(() => {
    const delikaOnboardingId = localStorage.getItem('delikaOnboardingId')
    return initialRestaurant ? {
      ...initialRestaurant,
      delika_onboarding_id: delikaOnboardingId || ''
    } : null
  })
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [branchOrders, setBranchOrders] = useState<Order[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [logoError, setLogoError] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false)
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<any>(null)
  const [isUserDeleteModalOpen, setIsUserDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([])
  const [isEditBranchModalOpen, setIsEditBranchModalOpen] = useState(false)
  const [branchToEdit, setBranchToEdit] = useState<Branch | null>(null)
  const [isDeleteBranchModalOpen, setIsDeleteBranchModalOpen] = useState(false)
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);

  const filteredOrders = useMemo(() => {
    return branchOrders.filter(order => {
      const searchLower = searchQuery.toLowerCase()
      
      const matchesSearch = 
        String(order.orderNumber || '').toLowerCase().includes(searchLower) ||
        String(order.customerName || '').toLowerCase().includes(searchLower) ||
        String(order.customerPhoneNumber || '').toLowerCase().includes(searchLower) ||
        String(order.courierName || '').toLowerCase().includes(searchLower) ||
        String(order.courierPhoneNumber || '').toLowerCase().includes(searchLower) ||
        String(order.pickupName || '').toLowerCase().includes(searchLower) ||
        String(order.dropoffName || '').toLowerCase().includes(searchLower)

      const matchesTab = activeTab === 'All' || order.orderStatus === activeTab

      return matchesSearch && matchesTab
    })
  }, [branchOrders, searchQuery, activeTab])

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const userId = localStorage.getItem('delikaOnboardingId')
        const response = await fetch(
          `${API_BASE_URL}${GET_RESTAURANTS_ENDPOINT}?filter[delika_onboarding_id][eq]=${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          }
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch restaurants')
        }
        
        const data = await response.json()
        setAllRestaurants(data)
      } catch (error) {
        console.error('Error fetching restaurants:', error)
      }
    }

    fetchRestaurants()
  }, [])

  const refreshBranches = async (restaurantId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(
        `${API_BASE_URL}${GET_BRANCHES_ENDPOINT}/${restaurantId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch branches')
      }
      
      const data = await response.json()
      if (!Array.isArray(data)) {
        throw new Error('Invalid branch data format')
      }
      
      setBranches(data)
    } catch (error) {
      console.error('Error refreshing branches:', error)
      toast.error('Failed to load branches')
      setError(error instanceof Error ? error.message : 'Failed to load branches')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async (restaurantId: string) => {
    try {
      setIsLoadingUsers(true)
      const response = await fetch(
        `${API_BASE_URL}${GET_USERS_ENDPOINT}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      
      const data = await response.json()
      if (!Array.isArray(data)) {
        throw new Error('Invalid users data format')
      }
      
      // Filter users for the specific restaurant
      const restaurantUsers = data.filter(user => user.restaurantId === restaurantId)
      setUsers(restaurantUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
      setError(error instanceof Error ? error.message : 'Failed to load users')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  // Fetch branches when component mounts
  useEffect(() => {
    if (restaurant?.id) {
      refreshBranches(restaurant.id)
      fetchUsers(restaurant.id)
    }
  }, [restaurant?.id])

  const handleAddBranchSuccess = () => {
    // Refresh the branches list
    refreshBranches(restaurant.id)
  }

  const handleBranchClick = (branch: Branch) => {
    setSelectedBranch(branch)
    fetchBranchOrders(branch.id)
  }

  const fetchBranchOrders = async (branchId: string) => {
    try {
      setIsLoadingOrders(true)
      setOrderError(null)
      
      const response = await fetch(
        `${API_BASE_URL}${GET_ORDERS_ENDPOINT}?branchId=${branchId}&restaurantId=${restaurant.id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          method: 'GET'
        }
      )
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`)
      }
      
      const data = await response.json()
      // Filter orders to only show those matching the selected branchId
      const filteredOrders = data.filter((order: Order) => order.branchId === branchId)
      console.log('Filtered orders for branch:', filteredOrders) // Debug log
      setBranchOrders(filteredOrders)
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrderError('Failed to load orders. Please try again.')
    } finally {
      setIsLoadingOrders(false)
    }
  }

  const handleAddUserSuccess = () => {
    fetchUsers(restaurant.id)
    setIsAddUserModalOpen(false)
  }

  const handleDeleteRestaurant = async () => {
    try {
      // Add your delete API call here
      console.log('Deleting restaurant:', restaurant.id)
      setIsDeleteModalOpen(false)
      // Navigate back after successful deletion
      navigate(-1)
    } catch (error) {
      console.error('Error deleting restaurant:', error)
      toast.error('Failed to delete restaurant')
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      const response = await fetch(
        `${API_BASE_URL}${import.meta.env.VITE_DELETE_USER_ENDPOINT}/${userToDelete.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      toast.success(`${userToDelete.fullName} has been deleted successfully`)
      fetchUsers(restaurant.id)
      setIsUserDeleteModalOpen(false)
      setUserToDelete(null)
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error(`Failed to delete ${userToDelete.fullName}. Please try again.`)
    }
  }

  const handleRestaurantChange = async (restaurantId: string) => {
    try {
      // Find the new restaurant from allRestaurants
      const newRestaurant = allRestaurants.find(r => r.id === restaurantId)
      if (newRestaurant) {
        // Update URL
        const slug = newRestaurant.restaurantName.toLowerCase().replace(/ /g, '-')
        navigate(`/restaurant/${slug}`, { 
          state: { 
            restaurant: newRestaurant,
            restaurants: allRestaurants
          }
        })

        // Update current restaurant
        setRestaurant(newRestaurant)

        // Fetch branches for the new restaurant
        await refreshBranches(restaurantId)
        
        // Fetch users for the new restaurant
        await fetchUsers(restaurantId)

        // Reset selected branch when switching restaurants
        setSelectedBranch(null)
        setBranchOrders([])
      }
    } catch (error) {
      console.error('Error switching restaurant:', error)
      toast.error('Failed to load restaurant details')
    }
  }

  const handleEditBranchSuccess = () => {
    refreshBranches(restaurant.id)
    setIsEditBranchModalOpen(false)
    setBranchToEdit(null)
  }

  const handleDeleteBranch = async () => {
    if (!branchToDelete) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}${import.meta.env.VITE_DELETE_BRANCH_ENDPOINT}/${branchToDelete.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete branch');
      }

      toast.success('Branch deleted successfully');
      refreshBranches(restaurant.id); // Refresh branches after deletion
      setIsDeleteBranchModalOpen(false); // Close the modal
      setBranchToDelete(null); // Reset the branch to delete
    } catch (error) {
      console.error('Error deleting branch:', error);
      toast.error('Failed to delete branch. Please try again.');
    }
  };

  const exportToCSV = (data: Order[]) => {
    const csvRows: string[] = [];
    
    // Get the headers
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(','));

    // Format the data
    for (const row of data) {
      const values = headers.map(header => {
        const escaped = ('' + row[header]).replace(/"/g, '\\"'); // Escape double quotes
        return `"${escaped}"`; // Wrap in quotes
      });
      csvRows.push(values.join(','));
    }

    // Create a Blob and download it
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'orders.csv');
    a.click();
    URL.revokeObjectURL(url); // Clean up
  };

  // Fetch orders from the API
  const fetchOrders = async () => {
    try {
      setIsLoadingOrders(true)
      setOrderError(null)
      
      const response = await fetch(
        `${API_BASE_URL}${GET_ORDERS_ENDPOINT}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          method: 'GET'
        }
      )
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`)
      }
      
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrderError('Failed to load orders. Please try again.')
    } finally {
      setIsLoadingOrders(false)
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update the export function to use filtered data
  const handleExport = () => {
    const csvData = filteredOrders.map(order => ({
      'Order Number': order.orderNumber,
      'Customer Name': order.customerName,
      'Customer Phone': order.customerPhoneNumber,
      'Courier Name': order.courierName || 'Not assigned',
      'Courier Phone': order.courierPhoneNumber || '-',
      'Status': order.orderStatus,
      'Products': order.products?.map(p => `${p.quantity}x ${p.name} (GH₵${p.price})`).join('; '),
      'Pickup': order.pickupName,
      'Dropoff': order.dropoffName,
      'Distance (km)': Number(order.deliveryDistance).toFixed(1),
      'Delivery Price (GH₵)': Number(order.deliveryPrice).toFixed(2),
      'Total Price (GH₵)': Number(order.totalPrice).toFixed(2),
      'Order Date': new Date(order.orderDate).toLocaleDateString(),
      'Created At': new Date(order.created_at).toLocaleTimeString()
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${new Date().toISOString()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const getCouriersList = useMemo(() => {
    const couriers = filteredOrders.reduce((acc, order) => {
      if (order.courierName) {
        if (!acc[order.courierName]) {
          acc[order.courierName] = {
            name: order.courierName,
            phoneNumber: order.courierPhoneNumber,
            orders: []
          };
        }
        acc[order.courierName].orders.push(order);
      }
      return acc;
    }, {});
    return Object.values(couriers);
  }, [filteredOrders]);

  const CourierDetailsModal = ({ isOpen, onClose, courier }) => {
    if (!courier) return null;

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{courier.name}'s Deliveries</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery Price</TableHead>
                  <TableHead>Pickup Location</TableHead>
                  <TableHead>Dropoff Location</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Picked Up</TableHead>
                  <TableHead>On The Way</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courier.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.orderNumber}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' :
                        order.orderStatus === 'ReadyForPickup' ? 'bg-blue-100 text-blue-700' :
                        order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        order.orderStatus === 'Assigned' ? 'bg-yellow-100 text-yellow-700' :
                        order.orderStatus === 'Pickup' ? 'bg-orange-100 text-orange-700' :
                        order.orderStatus === 'OnTheWay' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.orderStatus}
                      </span>
                    </TableCell>
                    <TableCell>GH₵{Number(order.deliveryPrice).toFixed(2)}</TableCell>
                    <TableCell>{order.pickupName}</TableCell>
                    <TableCell>{order.dropoffName}</TableCell>
                    <TableCell>{order.orderReceivedTime ? new Date(order.orderReceivedTime).toLocaleTimeString() : '-'}</TableCell>
                    <TableCell>{order.orderPickedUpTime ? new Date(order.orderPickedUpTime).toLocaleTimeString() : '-'}</TableCell>
                    <TableCell>{order.orderOnmywayTime ? new Date(order.orderOnmywayTime).toLocaleTimeString() : '-'}</TableCell>
                    <TableCell>{order.orderCompletedTime ? new Date(order.orderCompletedTime).toLocaleTimeString() : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Restaurant not found</p>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto py-8">
        {restaurant && (
          <>
            
            <div className="flex items-center justify-between mb-6 mt-40">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="rounded-lg p-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-400 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-4 w-4 text-black dark:text-white" />
              </Button>

              <Select
                value={restaurant?.id}
                onValueChange={handleRestaurantChange}
              >
                <SelectTrigger className="w-[300px] text-black dark:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Select a restaurant">
                    {restaurant?.restaurantName}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="text-black dark:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  {allRestaurants.map((r) => (
                    <SelectItem 
                      key={r.id} 
                      value={r.id}
                      className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      {r.restaurantName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="max-w-9xl mx-auto space-y-6">
              {/* Top Section Grid: Hero + Users + Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Hero Section - Takes 1/3 width with reduced height */}
                <Card className="border border-gray-200 dark:border-gray-700 overflow-hidden h-[300px] restaurant-hero">
                  <div className="relative h-full">
                    {/* Full height background image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/40 z-10" />
                    {!logoError && restaurant.restaurantLogo && (
                      <img
                        src={restaurant.restaurantLogo.url}
                        alt={restaurant.restaurantName}
                        className="w-full h-full object-cover"
                        onError={() => setLogoError(true)}
                      />
                    )}
                    
                    {/* Content overlay */}
                    <div className="absolute inset-0 z-20 p-6 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <h1 className="text-2xl font-bold text-white">
                          {restaurant.restaurantName}
                        </h1>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 text-gray-100 dark:text-white hover:bg-white/10 dark:hover:bg-white/10"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px] text-black dark:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            <DropdownMenuItem
                              onClick={() => setIsEditModalOpen(true)}
                              className="cursor-pointer"
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setIsDeleteModalOpen(true)}
                              className="cursor-pointer text-red-600 hover:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-gray-100 dark:text-white">
                          <MapPin className="h-4 w-4 text-gray-300 dark:text-gray-300" />
                          <span className="text-sm restaurant-location">{restaurant.restaurantAddress}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-100 dark:text-white">
                          <Mail className="h-4 w-4 text-gray-300 dark:text-gray-300" />
                          <span className="text-sm">{restaurant.restaurantEmail}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-100 dark:text-white">
                          <Phone className="h-4 w-4 text-gray-300 dark:text-gray-300" />
                          <span className="text-sm">{restaurant.restaurantPhoneNumber}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-100 dark:text-white">
                          <Calendar className="h-4 w-4 text-gray-300" />
                          <span className="text-sm">Joined {new Date(restaurant.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Users Section - Match hero height */}
                <Card className="border border-gray-200 dark:border-gray-700 h-[300px] overflow-auto">
                  <CardHeader className="border-b border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Users</CardTitle>
                      <Button 
                        onClick={() => setIsAddUserModalOpen(true)}
                        size="sm"
                        className="gap-2 bg-black dark:bg-gray-800 text-white dark:text-white hover:bg-black/80 dark:hover:bg-gray-700"
                      >
                        <UsersIcon className="h-4 w-4" />
                        Add User
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    {isLoadingUsers ? (
                      <div className="flex items-center justify-center py-8">
                        <LoadingSpinner className="h-6 w-6" />
                      </div>
                    ) : users.length === 0 ? (
                      <div className="text-center py-6">
                        <UsersIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No Users Yet</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">This restaurant hasn't added any users yet.</p>
                        <Button 
                          onClick={() => setIsAddUserModalOpen(true)}
                          size="sm"
                          variant="outline"
                          className="gap-2 border border-gray-200 dark:border-gray-700 shadow-none hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <UsersIcon className="h-3 w-3" />
                          Add First User
                        </Button>
                      </div>
                    ) : (
                      <div className="overflow-auto max-h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Full Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Branch</TableHead>
                              <TableHead className="w-[50px] text-black dark:text-white"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {users.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell className="font-medium text-black dark:text-white">
                                  <div className="flex items-center gap-3">
                                    {user.image ? (
                                      <img 
                                        src={user.image?.url} 
                                        alt={user.fullName}
                                        className="h-8 w-8 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                        <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                      </div>
                                    )}
                                    {user.fullName}
                                  </div>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {user.role.split('_').map(word => 
                                      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                                    ).join(' ')}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {branches.find(branch => branch.id === user.branchId)?.branchName || '-'}
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        className="h-8 w-8 p-0 hover:bg-gray-100"
                                      >
                                        <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[160px]">
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setUserToEdit(user)
                                          setIsEditUserModalOpen(true)
                                        }}
                                        className="cursor-pointer"
                                      >
                                        <Pencil className="mr-2 h-4 w-4" />
                                        <span>Edit</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setUserToDelete(user)
                                          setIsUserDeleteModalOpen(true)
                                        }}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Delete</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Stats Section - Match hero height */}
                <div className="grid grid-rows-2 gap-6 h-[300px]">
                  {/* Top Row Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border border-blue-200 dark:border-gray-700 bg-blue-50 dark:bg-gray-900">
                      <CardContent className="p-4 flex flex-col justify-between h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <UsersIcon className="h-5 w-5 text-indigo-500 dark:text-indigo-500" />
                          <span className="text-xl font-medium text-gray-600 dark:text-white">Total Users</span>
                        </div>
                        <div className="text-3xl font-semibold text-gray-900 dark:text-white">
                          {isLoadingUsers ? <LoadingSpinner className="h-6 w-6" /> : users.length}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-blue-200 dark:border-gray-700 bg-blue-50 dark:bg-gray-900">
                      <CardContent className="p-4 flex flex-col justify-between h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <Building className="h-5 w-5 text-blue-500 dark:text-blue-500" />
                          <span className="text-xl font-medium text-gray-600 dark:text-white">Branches</span>
                        </div>
                        <div className="text-3xl font-semibold text-gray-900 dark:text-white">{branches.length}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Bottom Row Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border border-green-200 dark:border-gray-700 bg-green-50 dark:bg-gray-900">
                      <CardContent className="p-4 flex flex-col justify-between h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <PurseIcon className="h-5 w-5 text-green-500 dark:text-green-500" />
                          <span className="text-xl font-medium text-gray-600 dark:text-white">Total Sales</span>
                        </div>
                        <div className="text-3xl font-semibold text-gray-900 dark:text-white">
                          GH₵{branchOrders.reduce((acc, order) => acc + Number(order.totalPrice), 0).toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-rose-200 dark:border-gray-700 bg-rose-50 dark:bg-gray-900">
                      <CardContent className="p-4 flex flex-col justify-between h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="h-5 w-5 text-purple-500 dark:text-purple-500" />
                          <span className="text-xl font-medium text-gray-600 dark:text-white">Delivery Sales</span>
                        </div>
                        <div className="text-3xl font-semibold text-gray-900 dark:text-white">
                          GH₵{branchOrders.reduce((acc, order) => {
                            // Convert to number and handle invalid/missing values
                            const deliveryPrice = parseFloat(order.deliveryPrice.toString()) || 0
                            return acc + deliveryPrice
                          }, 0).toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              {/* Courier Section */}
              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-4">Couriers</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {getCouriersList.map((courier) => (
                    <Card 
                      key={courier.name}
                      className="cursor-pointer hover:shadow-lg transition-shadow bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                      onClick={() => {
                        setSelectedCourier(courier);
                        setIsCourierModalOpen(true);
                      }}
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{courier.name}</CardTitle>
                        <User className="h-4 w-4 text-gray-500" />
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-500">{courier.phoneNumber}</p>
                        <p className="text-sm text-gray-500 mt-1">{courier.orders.length} orders</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Dialog open={isCourierModalOpen} onOpenChange={() => {
                  setIsCourierModalOpen(false);
                  setSelectedCourier(null);
                }}>
                  <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                      <DialogTitle>{selectedCourier?.name}'s Deliveries</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto mt-4">
                      <Table>
                        <TableHeader className="sticky top-0 bg-white dark:bg-gray-800">
                          <TableRow>
                            <TableHead>Order #</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Delivery Price</TableHead>
                            <TableHead>Pickup Location</TableHead>
                            <TableHead>Dropoff Location</TableHead>
                            <TableHead>Received</TableHead>
                            <TableHead>Picked Up</TableHead>
                            <TableHead>On The Way</TableHead>
                            <TableHead>Completed</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedCourier?.orders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell>{order.orderNumber}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' :
                                  order.orderStatus === 'ReadyForPickup' ? 'bg-blue-100 text-blue-700' :
                                  order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                  order.orderStatus === 'Assigned' ? 'bg-yellow-100 text-yellow-700' :
                                  order.orderStatus === 'Pickup' ? 'bg-orange-100 text-orange-700' :
                                  order.orderStatus === 'OnTheWay' ? 'bg-purple-100 text-purple-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {order.orderStatus}
                                </span>
                              </TableCell>
                              <TableCell>GH₵{Number(order.deliveryPrice).toFixed(2)}</TableCell>
                              <TableCell>{order.pickupName}</TableCell>
                              <TableCell>{order.dropoffName}</TableCell>
                              <TableCell>{order.orderReceivedTime ? new Date(order.orderReceivedTime).toLocaleTimeString() : '-'}</TableCell>
                              <TableCell>{order.orderPickedUpTime ? new Date(order.orderPickedUpTime).toLocaleTimeString() : '-'}</TableCell>
                              <TableCell>{order.orderOnmywayTime ? new Date(order.orderOnmywayTime).toLocaleTimeString() : '-'}</TableCell>
                              <TableCell>{order.orderCompletedTime ? new Date(order.orderCompletedTime).toLocaleTimeString() : '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Branches Section */}
              <Card className="border border-gray-200 dark:border-gray-700">
                <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-black dark:text-white">Branches</CardTitle>
                    <Button 
                      onClick={() => setIsAddBranchModalOpen(true)}
                      size="sm"
                      className="gap-2 bg-black hover:bg-black/80 text-white dark:bg-gray-600 dark:hover:bg-gray-700 dark:text-white"
                    >
                      <Building2 className="h-4 w-4" />
                      Add Branch
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner className="h-6 w-6" />
                    </div>
                  ) : error ? (
                    <ErrorState 
                      icon={Building2}
                      title="Failed to Load Branches"
                      description="Sorry, there are no branches for this restaurant."
                      primaryAction={{
                        label: "Reload",
                        onClick: () => refreshBranches(restaurant.id),
                        icon: RefreshCcw
                      }}
                      secondaryAction={{
                        label: "Go Back",
                        onClick: () => navigate(-1),
                        icon: ArrowLeft
                      }}
                    />
                  ) : branches.length === 0 ? (
                    <div className="text-center py-12">
                      <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Branches Yet</h3>
                      <p className="text-gray-500 mb-4">This restaurant hasn't added any branches yet.</p>
                      <Button 
                        onClick={() => setIsAddBranchModalOpen(true)}
                        className="gap-2"
                      >
                        <Building2 className="h-4 w-4" />
                        Add First Branch
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Branches Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {branches.map((branch) => (
                          <Card 
                            key={branch.id}
                            className={`cursor-pointer transition-all border border-gray-200 dark:border-gray-700 ${
                              selectedBranch?.id === branch.id 
                                ? 'bg-blue-50 dark:bg-gray-900 border-blue-200 dark:border-blue-200' 
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                            onClick={() => handleBranchClick(branch)}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-medium text-black dark:text-white">{branch.branchName}</h3>
                                <div className="flex items-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent card click
                                      setBranchToEdit(branch);
                                      setIsEditBranchModalOpen(true);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4 text-black dark:text-white" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent card click
                                      setBranchToDelete(branch); // Set the branch to delete
                                      setIsDeleteBranchModalOpen(true); // Open the delete warning modal
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm text-gray-500 dark:text-white">{branch.branchLocation}</p>
                              <p className="text-sm text-gray-500 dark:text-white">{branch.branchPhoneNumber}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Orders Section - Shows when a branch is selected */}
                      {selectedBranch && (
                        <Card className="mt-6">
                          <CardHeader>
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg text-black dark:text-white">
                                Orders for {selectedBranch.branchName}
                              </CardTitle>

                            </div>
                          </CardHeader>
                          <CardContent>
                            {isLoadingOrders ? (
                              <div className="flex items-center justify-center py-8">
                                <LoadingSpinner className="h-6 w-6" />
                              </div>
                            ) : orderError ? (
                              <div className="text-center py-8">
                                <p className="text-red-500 dark:text-red-500">{orderError}</p>
                                <Button 
                                  onClick={() => fetchBranchOrders(selectedBranch.id)} 
                                  variant="outline" 
                                  className="mt-4"
                                >
                                  Retry
                                </Button>
                              </div>
                            ) : branchOrders.length === 0 ? (
                              <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-white">No orders found for this branch</p>
                              </div>
                            ) : (
                              <div className="mb-6 space-y-4">
                                {/* Search, Export, and Tabs Section */}
                                <div className="mb-6 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div className="relative w-full md:w-96">
                                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                      <Input
                                        placeholder="Search orders..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-8 text-black dark:text-white bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-700"
                                      />
                                    </div>

                                    <div className="flex items-center gap-4">
                                      <Select value={activeTab} onValueChange={setActiveTab}>
                                        <SelectTrigger className="w-[180px] bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                          <SelectValue placeholder="Filter by status" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                          <SelectItem value="All" className="hover:bg-gray-100 dark:hover:bg-gray-700">All Orders</SelectItem>
                                          <SelectItem value="Delivered" className="hover:bg-gray-100 dark:hover:bg-gray-700">Delivered</SelectItem>
                                          <SelectItem value="ReadyForPickup" className="hover:bg-gray-100 dark:hover:bg-gray-700">Ready for Pickup</SelectItem>
                                          <SelectItem value="Cancelled" className="hover:bg-gray-100 dark:hover:bg-gray-700">Cancelled</SelectItem>
                                          <SelectItem value="Assigned" className="hover:bg-gray-100 dark:hover:bg-gray-700">Assigned</SelectItem>
                                          <SelectItem value="Pickup" className="hover:bg-gray-100 dark:hover:bg-gray-700">Pickup</SelectItem>
                                          <SelectItem value="OnTheWay" className="hover:bg-gray-100 dark:hover:bg-gray-700">On The Way</SelectItem>
                                        </SelectContent>
                                      </Select>

                                      <Button
                                        onClick={handleExport}
                                        className="bg-gray-900 dark:bg-gray-800 text-white hover:bg-gray-900/80 dark:hover:bg-gray-700/80 border border-gray-700 dark:border-gray-600"
                                      >
                                        Export Orders
                                      </Button>
                                    </div>
                                  </div>
                                </div>

                                {/* Table Section */}
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Order #</TableHead>
                                      <TableHead>Customer</TableHead>
                                      <TableHead>Courier</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead>Products</TableHead>
                                      <TableHead>Delivery Details</TableHead>
                                      <TableHead>Total</TableHead>
                                      <TableHead>Date</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {filteredOrders.map((order) => (
                                      <TableRow key={order.id}>
                                        <TableCell className="font-medium">
                                          {order.orderNumber}
                                        </TableCell>
                                        <TableCell>
                                          <div className="space-y-1">
                                            <p className="font-medium">{order.customerName}</p>
                                            <p className="text-sm text-gray-500">{order.customerPhoneNumber}</p>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <div className="space-y-1">
                                            <p className="font-medium">{order.courierName || 'Not assigned'}</p>
                                            <p className="text-sm text-gray-500">{order.courierPhoneNumber || '-'}</p>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <span className={`px-2 py-1 rounded-full text-xs ${
                                            order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' :
                                            order.orderStatus === 'ReadyForPickup' ? 'bg-blue-100 text-blue-700' :
                                            order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                            order.orderStatus === 'Assigned' ? 'bg-yellow-100 text-yellow-700' :
                                            order.orderStatus === 'Pickup' ? 'bg-orange-100 text-orange-700' :
                                            order.orderStatus === 'OnTheWay' ? 'bg-purple-100 text-purple-700' :
                                            'bg-gray-100 text-gray-700'
                                          }`}>
                                            {order.orderStatus}
                                          </span>
                                        </TableCell>
                                        <TableCell>
                                          <div className="space-y-1">
                                            {order.products?.map((product, index) => (
                                              <div key={index} className="text-sm">
                                                {product.quantity}x {product.name} - GH₵{Number(product.price).toFixed(2)}
                                              </div>
                                            ))}
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <div className="space-y-1">
                                            <p className="text-sm">From: {order.pickupName}</p>
                                            <p className="text-sm">To: {order.dropoffName}</p>
                                            <p className="text-xs text-gray-500">
                                              {Number(order.deliveryDistance).toFixed(1)}km • GH₵{Number(order.deliveryPrice).toFixed(2)}
                                            </p>
                                          </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                          GH₵{Number(order.totalPrice).toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                          <div className="space-y-1">
                                            <p className="text-sm">{new Date(order.orderDate).toLocaleDateString()}</p>
                                            <p className="text-xs text-gray-500">
                                              {new Date(order.created_at).toLocaleTimeString()}
                                            </p>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <EditRestaurantModal 
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onSuccess={async () => {
                // Fetch fresh data first
                try {
                  const userId = localStorage.getItem('delikaOnboardingId')
                  const response = await fetch(
                    `${API_BASE_URL}${GET_RESTAURANTS_ENDPOINT}?filter[delika_onboarding_id][eq]=${userId}`,
                    {
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                      }
                    }
                  )
                  
                  if (!response.ok) {
                    throw new Error('Failed to fetch restaurants')
                  }
                  
                  const freshData = await response.json()
                  setAllRestaurants(freshData)
                  
                  // Update the current restaurant with fresh data
                  const updatedRestaurant = freshData.find(r => r.id === restaurant?.id)
                  if (updatedRestaurant) {
                    setRestaurant(updatedRestaurant)
                  }
                } catch (error) {
                  console.error('Error refreshing restaurant data:', error)
                  toast.error('Failed to refresh restaurant data')
                }
                
                setIsEditModalOpen(false)
              }}
              restaurant={restaurant}
            />

            <AddBranchModal 
              restaurantId={restaurant.id}
              isOpen={isAddBranchModalOpen}
              onClose={() => setIsAddBranchModalOpen(false)}
              onSuccess={handleAddBranchSuccess}
            />

            <AddUserModal 
              isOpen={isAddUserModalOpen}
              onClose={() => setIsAddUserModalOpen(false)}
              onSuccess={handleAddUserSuccess}
              restaurantId={restaurant.id}
              branches={branches}
            />

            <DeleteWarningModal 
              isOpen={isDeleteModalOpen}
              onClose={() => setIsDeleteModalOpen(false)}
              onConfirm={handleDeleteRestaurant}
              title="Delete Restaurant"
              description={`Are you sure you want to delete "${restaurant.restaurantName}"?`}
            />

            {userToEdit && (
              <EditUserModal 
                isOpen={isEditUserModalOpen}
                onClose={() => {
                  setIsEditUserModalOpen(false)
                  setUserToEdit(null)
                }}
                onSuccess={() => {
                  fetchUsers(restaurant.id)
                  setIsEditUserModalOpen(false)
                  setUserToEdit(null)
                }}
                user={userToEdit}
                branches={branches}
              />
            )}

            <DeleteWarningModal 
              isOpen={isUserDeleteModalOpen}
              onClose={() => {
                setIsUserDeleteModalOpen(false)
                setUserToDelete(null)
              }}
              onConfirm={handleDeleteUser}
              title="Delete User"
              description={userToDelete ? `Are you sure you want to delete ${userToDelete.fullName}?` : ''}
            />

            {branchToEdit && (
              <EditBranchModal
                branch={branchToEdit}
                isOpen={isEditBranchModalOpen}
                onClose={() => {
                  setIsEditBranchModalOpen(false)
                  setBranchToEdit(null)
                }}
                onSuccess={handleEditBranchSuccess}
                restaurantId={restaurant.id}
              />
            )}

            <DeleteWarningModal 
              isOpen={isDeleteBranchModalOpen}
              onClose={() => {
                setIsDeleteBranchModalOpen(false);
                setBranchToDelete(null); // Reset the branch to delete
              }}
              onConfirm={handleDeleteBranch}
              title="Delete Branch"
              description={`Are you sure you want to delete "${branchToDelete?.branchName}"?`}
            />

            <Sonner position="top-right" />

            {/* Footer with Logo */}
            <footer className="bg-gray-100 dark:bg-gray-900 text-black dark:text-white text-center py-4 flex items-center justify-center">
              <p className="mr-2">powered by</p>
              <img src={krontivaLogo} alt="Krontiva Logo" className="h-6" />
            </footer>
          </>
        )}
      </div>
    </div>
  )
} 