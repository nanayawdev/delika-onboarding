'use client'

import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Papa from 'papaparse';

// Table components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table';

// Other UI components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
  
// Icons and other imports
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  TrendingUp,
  Building,
  UsersIcon,
  MoreHorizontal,
  Pencil,
  Trash2,
  User as UserIcon,
  Search,
  CalendarIcon
} from 'lucide-react';
import { format } from 'date-fns';
import type { Restaurant, Branch, Courier, OrderProgress, Order, User, MenuType } from '@/types';
import { API_BASE_URL } from '@/config';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/error-state';
import { EditRestaurantModal } from './edit-restaurant-modal';
import { AddBranchModal } from './add-branch-modal';
import { AddUserModal } from './add-user-modal';
import { EditUserModal } from './edit-user-modal';
import { DeleteWarningModal } from './delete-warning-modal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as DatePicker } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sonner } from "@/components/ui/sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EditBranchModal } from './edit-branch-modal'
import krontivaLogo from '/krontivalogo.png'
import PurseIcon from '@/assets/icons/purse-stroke-rounded'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"

const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

const GET_RESTAURANTS_ENDPOINT = import.meta.env.VITE_GET_RESTAURANTS_ENDPOINT;
const GET_BRANCHES_ENDPOINT = import.meta.env.VITE_GET_BRANCHES_ENDPOINT;
const GET_USERS_ENDPOINT = import.meta.env.VITE_GET_USERS_ENDPOINT;
const GET_ORDERS_ENDPOINT = import.meta.env.VITE_GET_ORDERS_ENDPOINT;

export default function RestaurantDetail() {
  const location = useLocation()
  const navigate = useNavigate()
  const { restaurant: initialRestaurant = [] } = location.state || {}
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
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [isUserDeleteModalOpen, setIsUserDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([])
  const [isEditBranchModalOpen, setIsEditBranchModalOpen] = useState(false)
  const [branchToEdit, setBranchToEdit] = useState<Branch | null>(null)
  const [isDeleteBranchModalOpen, setIsDeleteBranchModalOpen] = useState(false)
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null)
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [currentPage] = useState(1)
  const ordersPerPage = 10
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined
  })
  const [menuItems] = useState<MenuType[]>([])
  const [isLoadingMenu] = useState(false)
  const [menuError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [menuSearchQuery, setMenuSearchQuery] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)
  const itemsPerSlide = 5

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const filteredOrders = orders.filter(order => {
      // Apply search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          order.orderNumber.toLowerCase().includes(searchLower) ||
          order.customerName.toLowerCase().includes(searchLower) ||
          order.courierName?.toLowerCase().includes(searchLower)
        );
      }
      // Apply status filter
      if (activeTab !== 'All') {
        return order.orderStatus === activeTab;
      }
      return true;
    });
    
    return {
      orders: filteredOrders.slice(startIndex, endIndex),
      totalPages: Math.ceil(filteredOrders.length / ordersPerPage)
    };
  }, [orders, currentPage, ordersPerPage, searchQuery, activeTab]);

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

  const handleExport = () => {
    const csvData = paginatedOrders.orders.map(order => ({
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
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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

  const fetchAllUsers = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}${GET_USERS_ENDPOINT}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setAllUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const getCouriersList = useMemo(() => {
    const couriers: Record<string, Courier> = {};
    
    paginatedOrders.orders.forEach((order: Order) => {
      if (order.courierName) {
        if (!couriers[order.courierName]) {
          const courierUser = allUsers.find((user: User) => 
            user.fullName === order.courierName || 
            user.email === order.courierPhoneNumber
          );

          couriers[order.courierName] = {
            name: order.courierName,
            phoneNumber: order.courierPhoneNumber,
            image: courierUser?.image,
            orders: []
          };
        }
        couriers[order.courierName].orders.push(order);
      }
    });
    
    return Object.values(couriers);
  }, [paginatedOrders.orders, allUsers]);

  const getOrderProgress = (orders: Order[]): OrderProgress => {
    const statuses: OrderProgress = {
      Assigned: false,
      Pickup: false,
      OnTheWay: false,
      Delivered: false
    };

    if (orders.length > 0) {
      const latestOrder = orders[orders.length - 1];
      switch (latestOrder.orderStatus) {
        case 'Delivered':
          statuses.Delivered = true;
          statuses.OnTheWay = true;
          statuses.Pickup = true;
          statuses.Assigned = true;
          break;
        case 'OnTheWay':
          statuses.OnTheWay = true;
          statuses.Pickup = true;
          statuses.Assigned = true;
          break;
        case 'Pickup':
          statuses.Pickup = true;
          statuses.Assigned = true;
          break;
        case 'Assigned':
          statuses.Assigned = true;
          break;
      }
    }

    return statuses;
  };

  const currentSlideItems = useMemo(() => {
    const startIndex = currentSlide * itemsPerSlide;
    return menuItems.slice(startIndex, startIndex + itemsPerSlide);
  }, [menuItems, currentSlide, itemsPerSlide]);

  // Filter menu items based on search


  const handleCourierClick = (courier: Courier) => {
    setSelectedCourier(courier);
    setIsCourierModalOpen(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };

  const handleMenuSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setMenuSearchQuery(e.target.value);
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
                <Card className="border border-orange-600 dark:border-gray-700 h-[300px] overflow-auto">
                  <CardHeader className="border-b border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Users</CardTitle>
                      <Button 
                        onClick={() => setIsAddUserModalOpen(true)}
                        size="sm"
                        className="gap-2 bg-orange-600 dark:bg-gray-800 text-white dark:text-white hover:bg-black/80 dark:hover:bg-gray-700"
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
                          className="gap-2 bg-blue-600 text-white border border-gray-200 dark:border-gray-700 shadow-none hover:bg-blue-800 dark:hover:bg-blue-800"
                        >
                          <UsersIcon className="h-3 w-3" />
                          Add First User
                        </Button>
                      </div>
                    ) : (
                      <div className="overflow-auto max-h-[400px]">
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableHead>Full Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Branch</TableHead>
                              <TableHead className="w-[50px] text-black dark:text-white"></TableHead>
                            </TableRow>
                          </TableHead>
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
                                        <UserIcon className="h-4 w-4 text-gray-500" />
                                      </div>
                                    )}
                                    {user.fullName}
                                  </div>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {capitalizeFirstLetter(user.role.split('_').join(' '))}
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

              {/* Menu Section */}
              <Card className="border border-gray-900 dark:border-gray-700">
                <CardHeader className="border-b border-gray-900 dark:border-gray-700">
                  <CardTitle className="text-black dark:text-white">Menu Categories</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {isLoadingMenu ? (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner className="h-6 w-6" />
                    </div>
                  ) : menuError ? (
                    <div className="text-center py-8">
                      <p className="text-red-500">{menuError}</p>
                    </div>
                  ) : menuItems.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No menu items found</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {menuItems.map((menuType, index) => (
                          <Card 
                            key={index}
                            className={`cursor-pointer transition-all hover:shadow-lg ${
                              selectedCategory === menuType.foodType 
                                ? 'bg-white border-2 border-gray-500 dark:border-gray-900' 
                                : 'border border-gray-500 dark:border-gray-700'
                            }`}
                            onClick={() => setSelectedCategory(
                              selectedCategory === menuType.foodType ? null : menuType.foodType
                            )}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                {menuType.foodTypeImage && (
                                  <img 
                                    src={menuType.foodTypeImage.url} 
                                    alt={menuType.foodType}
                                    className="h-12 w-12 rounded-full object-cover"
                                  />
                                )}
                                <div>
                                  <h3 className="font-semibold">{menuType.foodType}</h3>
                                  <p className="text-sm">
                                    {menuType.foods.length} items
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Show menu items for selected category */}
                      {selectedCategory && (
                        <div className="mt-8">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">
                              {selectedCategory} Menu Items
                            </h3>
                            <div className="flex items-center gap-4">
                              <div className="relative w-64">
                                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <Input
                                  placeholder="Search menu items..."
                                  value={menuSearchQuery}
                                  onChange={handleMenuSearchChange}
                                  className="pl-8 border-gray-200 bg-gray-50"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                onClick={() => setSelectedCategory(null)}
                                className="text-gray-500"
                              >
                                View All Categories
                              </Button>
                            </div>
                          </div>

                          <div className="relative px-12">
                            <Carousel
                              opts={{
                                align: "start",
                                loop: true,
                              }}
                              className="w-full"
                              setApi={(api) => {
                                api?.on("select", () => {
                                  const currentSlide = api.selectedScrollSnap();
                                  setCurrentSlide(currentSlide);
                                });
                              }}
                            >
                              <CarouselContent className="-ml-2 md:-ml-4">
                                {currentSlideItems.map((menuType, index) => (
                                  <CarouselItem key={index} className="pl-2 md:pl-4 basis-1/5">
                                    <Card className="overflow-hidden bg-white hover:shadow-lg transition-shadow">
                                      {menuType.foods[0]?.foodImage && (
                                        <div className="h-48 overflow-hidden">
                                          <img 
                                            src={menuType.foods[0].foodImage.url} 
                                            alt={menuType.foods[0].name}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      )}
                                      <CardContent className="p-4">
                                        <h4 className="font-semibold">{menuType.foods[0]?.name || 'Untitled'}</h4>
                                        <p className="text-sm text-gray-600 mt-1">{menuType.foods[0]?.description || 'No description'}</p>
                                        <p className="text-sm font-medium text-green-600 mt-2">
                                          GH₵{Number(menuType.foods[0]?.price || 0).toFixed(2)}
                                        </p>
                                      </CardContent>
                                    </Card>
                                  </CarouselItem>
                                ))}
                              </CarouselContent>
                            </Carousel>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

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
                      icon={<Building2 className="h-6 w-6" />}
                      message="Sorry, there are no branches for this restaurant."
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
                              <div className="space-y-4">
                                {/* Search, Status Filter, Date Range, and Export */}
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-4">
                                    <Input
                                      placeholder="Search orders..."
                                      value={searchQuery}
                                      onChange={handleSearchChange}
                                      className="max-w-sm"
                                    />
                                    
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

                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button variant="outline" className="flex items-center gap-2">
                                          <CalendarIcon className="h-4 w-4" />
                                          {dateRange.from ? (
                                            dateRange.to ? (
                                              <>
                                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                                {format(dateRange.to, "LLL dd, y")}
                                              </>
                                            ) : (
                                              format(dateRange.from, "LLL dd, y")
                                            )
                                          ) : (
                                            "Pick a date range"
                                          )}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0 bg-white border shadow-md" align="end">
                                        <DatePicker
                                          initialFocus
                                          mode="range"
                                          defaultMonth={dateRange.from}
                                          selected={{
                                            from: dateRange.from,
                                            to: dateRange.to,
                                          }}
                                          onSelect={(range) => setDateRange({
                                            from: range?.from,
                                            to: range?.to
                                          })}
                                          numberOfMonths={2}
                                          className="rounded-md"
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  </div>

                                  <Button
                                    onClick={handleExport}
                                    className="bg-gray-900 dark:bg-gray-800 text-white hover:bg-gray-900/80 dark:hover:bg-gray-700/80 border border-gray-700 dark:border-gray-600"
                                  >
                                    Export Orders
                                  </Button>
                                </div>

                                {/* Courier Section */}
                                <div className="mt-6">
                                  <h2 className="text-lg font-semibold mb-4">Couriers</h2>
                                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {getCouriersList.map((courier: Courier) => (
                                      <Card 
                                        key={courier.name}
                                        className="cursor-pointer hover:shadow-lg transition-shadow bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                                        onClick={() => handleCourierClick(courier)}
                                      >
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                          <div className="flex items-center gap-3">
                                            {courier.image ? (
                                              <img 
                                                src={courier.image.url} 
                                                alt={courier.name}
                                                className="h-8 w-8 rounded-full object-cover"
                                              />
                                            ) : (
                                              <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                <UserIcon className="h-4 w-4 text-gray-500" />
                                              </div>
                                            )}
                                            <CardTitle className="text-sm font-medium">{courier.name}</CardTitle>
                                          </div>
                                          <UserIcon className="h-4 w-4 text-gray-500" />
                                        </CardHeader>
                                        <CardContent>
                                          <p className="text-sm text-gray-500">{courier.phoneNumber}</p>
                                          <div className="flex justify-between items-center mt-1">
                                            <p className="text-sm text-gray-500">{courier.orders.length} orders</p>
                                            <p className="text-sm font-medium text-green-600">
                                              GH₵{courier.orders.reduce((total: number, order: Order) => total + (Number(order.deliveryPrice) || 0), 0).toFixed(2)}
                                            </p>
                                          </div>
                                          
                                          {/* Progress Line */}
                                          <div className="mt-4 relative">
                                            {/* Progress Lines */}
                                            <div className="flex gap-1 h-1 w-full">
                                              {Object.entries(getOrderProgress(courier.orders)).map(([status]) => (
                                                <div 
                                                  key={status}
                                                  className={`flex-1 rounded-full ${
                                                    getOrderProgress(courier.orders)[status] 
                                                      ? status === 'Assigned' ? 'bg-blue-500'
                                                        : status === 'Pickup' ? 'bg-yellow-500'
                                                        : status === 'OnTheWay' ? 'bg-purple-500'
                                                        : 'bg-green-500'
                                                      : 'bg-gray-200 dark:bg-gray-700'
                                                  }`}
                                                />
                                              ))}
                                            </div>
                                            
                                            {/* Status Labels */}
                                            <div className="flex justify-between mt-2">
                                              {Object.entries(getOrderProgress(courier.orders)).map(([status]) => (
                                                <span key={status} className="text-xs text-gray-500">
                                                  {status === 'Assigned' ? 'Assigned' :
                                                   status === 'Pickup' ? 'Picked Up' :
                                                   status === 'OnTheWay' ? 'On Way' :
                                                   'Completed'}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </div>

                                {/* Orders Table */}
                                <div className="mt-4">
                                  <h3 className="text-lg font-semibold mb-4">Orders</h3>
                                  <Table>
                                    <TableHead>
                                      <TableRow>
                                        <TableHead>Order #</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Courier</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Date</TableHead>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {paginatedOrders.orders.map((order) => (
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
                                              <p className="font-medium">{order.courierName || 'Not assigned'}</p>
                                              <p className="text-sm text-gray-500">{order.courierPhoneNumber || '-'}</p>
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
                  const updatedRestaurant = freshData.find((r: Restaurant) => r.id === restaurant?.id)
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

            <Sonner />

            {/* Footer with Logo */}
            <footer className="bg-gray-100 dark:bg-gray-900 text-black dark:text-white text-center py-4 flex items-center justify-center">
              <p className="mr-2">powered by</p>
              <img src={krontivaLogo} alt="Krontiva Logo" className="h-6" />
            </footer>

            {selectedCourier && (
              <Dialog open={isCourierModalOpen} onOpenChange={() => setIsCourierModalOpen(false)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Courier Details</DialogTitle>
                    <DialogDescription>
                      View details and recent orders for {selectedCourier.name}
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="max-h-[80vh]">
                    {/* ... rest of the dialog content ... */}
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            )}
          </>
        )}
      </div>
    </div>
  )
} 