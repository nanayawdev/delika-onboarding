"use client"

import * as React from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import { GoogleMap, LoadScript, DirectionsRenderer } from '@react-google-maps/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, Users, Route, MapPin, Phone, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { API_BASE_URL, GET_ORDERS_ENDPOINT } from "@/lib/constants";
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

interface Courier {
  name: string;
  phoneNumber: string;
  image: string | null;
  orders: Order[];
}

interface Order {
  courierName: string;
  courierPhoneNumber: string;
  deliveryPrice: number;
  orderStatus: string;
  orderDate: string;
  deliveryDistance?: string;
  restaurantName: string;
  customerName: string;
  totalPrice: number;
  pickupLocation: {
    lat: number;
    lng: number;
  };
  dropoffLocation: {
    lat: number;
    lng: number;
  };
}

interface CourierStats {
  name: string;
  totalDeliveries: number;
  totalRevenue: number;
}

export default function Overview() {
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Example restaurant data
  const restaurants = ["Restaurant A", "Restaurant B", "Restaurant C"];

  // Mock earnings data
  const earningsData = [
    { month: 'Jan', earnings: 5000 },
    { month: 'Feb', earnings: 7500 },
    { month: 'Mar', earnings: 6000 },
    { month: 'Apr', earnings: 8000 },
    { month: 'May', earnings: 9500 },
  ];

  // Mock active couriers data
  const activeCouriers = [
    { 
      id: 1, 
      name: "John Doe", 
      status: "Delivering", 
      orders: 5, 
      location: "East Legon",
      phone: "+233 50 123 4567",
      image: "https://ui.shadcn.com/avatars/01.png"
    },
    { 
      id: 2, 
      name: "Jane Smith", 
      status: "Available", 
      orders: 0, 
      location: "Accra Mall",
      phone: "+233 50 123 4568",
      image: "https://ui.shadcn.com/avatars/02.png"
    },
    { 
      id: 3, 
      name: "Mike Johnson", 
      status: "Break", 
      orders: 3, 
      location: "Tema",
      phone: "+233 50 123 4569",
      image: "https://ui.shadcn.com/avatars/03.png"
    },
    { 
      id: 4, 
      name: "Sarah Wilson", 
      status: "Delivering", 
      orders: 2, 
      location: "Spintex",
      phone: "+233 50 123 4570",
      image: "https://ui.shadcn.com/avatars/04.png"
    },
    { 
      id: 5, 
      name: "Tom Brown", 
      status: "Available", 
      orders: 0, 
      location: "Madina",
      phone: "+233 50 123 4571",
      image: "https://ui.shadcn.com/avatars/05.png"
    },
  ];

  // Mock recent sales data grouped by restaurant
  const recentSales = {
    "Restaurant A": [
      { customer: "Olivia Martin", amount: 1999.00 },
      { customer: "Jackson Lee", amount: 39.00 },
    ],
    "Restaurant B": [
      { customer: "Isabella Nguyen", amount: 299.00 },
      { customer: "William Kim", amount: 99.00 },
    ],
    "Restaurant C": [
      { customer: "Sofia Davis", amount: 39.00 },
    ]
  };

  // Add helper function for order progress
  const getOrderProgress = (orders: any[]) => {
    const statuses = {
      Assigned: false,
      Pickup: false,
      OnTheWay: false,
      Delivered: false
    };

    // Check the latest order status
    const latestOrder = orders[orders.length - 1];
    if (latestOrder) {
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

  // Function to filter orders by month
  const filterOrdersByMonth = (orders: Order[], monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    return orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate.getFullYear() === year && orderDate.getMonth() === month - 1;
    });
  };

  // Calculate metrics for the selected month
  const monthlyMetrics = useMemo(() => {
    const filteredOrders = filterOrdersByMonth(orders, selectedMonth);
    
    // Total delivery revenue
    const revenue = filteredOrders.reduce((acc, order) => {
      const deliveryPrice = parseFloat(order.deliveryPrice?.toString() || '0');
      return acc + (isNaN(deliveryPrice) ? 0 : deliveryPrice);
    }, 0);

    // Best courier
    const courierStats = filteredOrders.reduce((acc: { [key: string]: CourierStats }, order) => {
      if (order.courierName) {
        if (!acc[order.courierName]) {
          acc[order.courierName] = {
            name: order.courierName,
            totalDeliveries: 0,
            totalRevenue: 0
          };
        }
        acc[order.courierName].totalDeliveries++;
        acc[order.courierName].totalRevenue += parseFloat(order.deliveryPrice?.toString() || '0');
      }
      return acc;
    }, {});

    const bestCourier = Object.values(courierStats).reduce((best: CourierStats | null, current: CourierStats) => {
      return (!best || current.totalRevenue > best.totalRevenue) ? current : best;
    }, null);

    // Most distance
    const totalDistance = filteredOrders.reduce((acc, order) => {
      return acc + (parseFloat(order.deliveryDistance?.toString() || '0') || 0);
    }, 0);

    return {
      revenue,
      bestCourier,
      totalDistance
    };
  }, [orders, selectedMonth]);

  // Fetch orders for revenue calculation
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoadingOrders(true);
        const userId = localStorage.getItem('delikaOnboardingId');
        const response = await fetch(
          `${API_BASE_URL}${GET_ORDERS_ENDPOINT}?filter[delika_onboarding_id][eq]=${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            method: 'GET'
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        
        const data = await response.json();
        console.log('Orders data for revenue:', data);
        setOrders(data);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrderError('Failed to load orders');
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchOrders();
  }, []);

  // Calculate total delivery revenue
  const totalDeliveryRevenue = useMemo(() => {
    return orders.reduce((acc, order) => {
      const deliveryPrice = parseFloat(order.deliveryPrice?.toString() || '0');
      return acc + (isNaN(deliveryPrice) ? 0 : deliveryPrice);
    }, 0);
  }, [orders]);

  useEffect(() => {
    const fetchCouriers = async () => {
      try {
        const userId = localStorage.getItem('delikaOnboardingId');
        const response = await fetch(
          `${API_BASE_URL}${GET_ORDERS_ENDPOINT}?filter[delika_onboarding_id][eq]=${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            method: 'GET'
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        
        const data = await response.json();
        console.log('Orders data:', data);
        
        // Group orders by courier
        const couriersList = data.reduce((acc: { [key: string]: Courier }, order: Order) => {
          if (order.courierName) {
            if (!acc[order.courierName]) {
              acc[order.courierName] = {
                name: order.courierName,
                phoneNumber: order.courierPhoneNumber,
                image: null,
                orders: []
              };
            }
            acc[order.courierName].orders.push(order);
          }
          return acc;
        }, {});
        
        console.log('Grouped couriers:', Object.values(couriersList));
        setCouriers(Object.values(couriersList));
      } catch (error) {
        console.error('Error fetching couriers:', error);
      }
    };

    fetchCouriers();
  }, []);

  const handleCourierClick = async (courier: Courier) => {
    setSelectedCourier(courier);
    const origin = { lat: courier.orders[0].pickupLocation.lat, lng: courier.orders[0].pickupLocation.lng };
    const destination = { lat: courier.orders[0].dropoffLocation.lat, lng: courier.orders[0].dropoffLocation.lng };

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error(`Error fetching directions: ${result}`);
        }
      }
    );
  };

  // Group orders by restaurant for Recent Sales
  const recentSalesByRestaurant = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
    
    // Filter orders from the last 30 days
    const recentOrders = orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate >= thirtyDaysAgo;
    });

    // Group by restaurant
    return recentOrders.reduce((acc: { [key: string]: any[] }, order) => {
      const restaurantName = order.restaurantName || 'Unknown Restaurant';
      if (!acc[restaurantName]) {
        acc[restaurantName] = [];
      }
      acc[restaurantName].push({
        customer: order.customerName,
        amount: order.totalPrice,
        date: new Date(order.orderDate),
        status: order.orderStatus
      });
      return acc;
    }, {});
  }, [orders]);

  // Initialize map when orders are loaded
  useEffect(() => {
    if (!mapRef.current || !orders.length) return;

    // Clear any existing map
    mapRef.current.innerHTML = '';

    // Create map container
    const mapContainer = document.createElement('div');
    mapContainer.style.width = '100%';
    mapContainer.style.height = '100%';
    mapRef.current.appendChild(mapContainer);

    // Initialize map
    const myAPIKey = GEOAPIFY_API_KEY;
    const mapStyle = 'osm-bright-smooth';

    // Extract delivery locations from orders with valid coordinates
    const deliveryLocations = orders
      .filter(order => 
        order.dropoffLocation && 
        typeof order.dropoffLocation.lat === 'number' && 
        typeof order.dropoffLocation.lng === 'number'
      )
      .map(order => ({
        lat: order.dropoffLocation.lat,
        lon: order.dropoffLocation.lng,
        type: 'delivery'
      }));

    // Only proceed if we have valid locations
    if (deliveryLocations.length === 0) {
      const noDataMessage = document.createElement('div');
      noDataMessage.className = 'flex items-center justify-center h-full text-gray-500';
      noDataMessage.textContent = 'No valid location data available';
      mapRef.current.appendChild(noDataMessage);
      return;
    }

    // Calculate center point (average of all locations)
    const center = deliveryLocations.reduce(
      (acc, loc) => ({
        lat: acc.lat + loc.lat / deliveryLocations.length,
        lon: acc.lon + loc.lon / deliveryLocations.length
      }),
      { lat: 0, lon: 0 }
    );

    // Initialize the map
    const map = new maplibregl.Map({
      container: mapContainer,
      style: `https://maps.geoapify.com/v1/styles/${mapStyle}/style.json?apiKey=${myAPIKey}`,
      center: [center.lon, center.lat],
      zoom: 11
    });

    // Add markers for each location
    deliveryLocations.forEach(location => {
      const markerElement = document.createElement('div');
      markerElement.className = 'delivery-marker';
      markerElement.style.width = '20px';
      markerElement.style.height = '20px';
      markerElement.style.borderRadius = '50%';
      markerElement.style.backgroundColor = '#4CAF50';
      markerElement.style.border = '2px solid white';
      markerElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';

      new maplibregl.Marker(markerElement)
        .setLngLat([location.lon, location.lat])
        .addTo(map);
    });

    // Add heatmap layer if there are enough points
    if (deliveryLocations.length > 5) {
      map.on('load', () => {
        map.addSource('delivery-points', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: deliveryLocations.map(loc => ({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: [loc.lon, loc.lat]
              }
            }))
          }
        });

        map.addLayer({
          id: 'delivery-heat',
          type: 'heatmap',
          source: 'delivery-points',
          paint: {
            'heatmap-weight': 1,
            'heatmap-intensity': 1,
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(0, 0, 255, 0)',
              0.2, 'rgba(0, 255, 255, 0.5)',
              0.4, 'rgba(0, 255, 0, 0.7)',
              0.6, 'rgba(255, 255, 0, 0.8)',
              0.8, 'rgba(255, 0, 0, 0.9)',
              1, 'rgba(255, 0, 0, 1)'
            ],
            'heatmap-radius': 30
          }
        });
      });
    }

    // Cleanup function
    return () => {
      map.remove();
    };
  }, [orders]);

  return (
    <div className="container mx-auto p-6 mt-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <div className="flex justify-end mb-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Total Revenue</span>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[120px] bg-white/10 border-0 text-white hover:bg-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm border-0">
                      {Array.from({ length: 12 }, (_, i) => {
                        const date = new Date();
                        date.setMonth(date.getMonth() - i);
                        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                        return (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  {isLoadingOrders ? (
                    <p className="text-2xl font-bold">Loading...</p>
                  ) : orderError ? (
                    <p className="text-2xl font-bold text-red-300">Error loading data</p>
                  ) : (
                    <p className="text-2xl font-bold">GH₵{monthlyMetrics.revenue.toFixed(2)}</p>
                  )}
                  <DollarSign className="h-6 w-6 text-white/80" />
                </div>
                <p className="text-sm text-white/80">Monthly delivery revenue</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Top Sales</span>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[120px] bg-white/10 border-0 text-white hover:bg-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm border-0">
                      {Array.from({ length: 12 }, (_, i) => {
                        const date = new Date();
                        date.setMonth(date.getMonth() - i);
                        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                        return (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <p className="text-2xl font-bold">{filterOrdersByMonth(orders, selectedMonth).length}</p>
                  <TrendingUp className="h-6 w-6 text-white/80" />
                </div>
                <p className="text-sm text-white/80">Total orders this month</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Best Courier</span>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[120px] bg-white/10 border-0 text-white hover:bg-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm border-0">
                      {Array.from({ length: 12 }, (_, i) => {
                        const date = new Date();
                        date.setMonth(date.getMonth() - i);
                        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                        return (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <p className="text-2xl font-bold">{monthlyMetrics.bestCourier?.name || 'No data'}</p>
                  <Users className="h-6 w-6 text-white/80" />
                </div>
                <p className="text-sm text-white/80">
                  {monthlyMetrics.bestCourier ? 
                    `${monthlyMetrics.bestCourier.totalDeliveries} deliveries` : 
                    'No deliveries this month'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Most Distance</span>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[120px] bg-white/10 border-0 text-white hover:bg-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm border-0">
                      {Array.from({ length: 12 }, (_, i) => {
                        const date = new Date();
                        date.setMonth(date.getMonth() - i);
                        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                        return (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <p className="text-2xl font-bold">{monthlyMetrics.totalDistance.toFixed(1)} km</p>
                  <Route className="h-6 w-6 text-white/80" />
                </div>
                <p className="text-sm text-white/80">Total distance this month</p>
              </CardContent>
            </Card>
          </div>

          {/* Active Now Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Active Now</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 relative">
              {couriers.map((courier: any, index: number) => (
                <React.Fragment key={courier.name}>
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center gap-3">
                        {courier.image ? (
                          <img 
                            src={courier.image} 
                            alt={courier.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                        <CardTitle className="text-sm font-medium">{courier.name}</CardTitle>
                      </div>
                      <User className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">{courier.phoneNumber}</p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-sm text-gray-500">{courier.orders.length} orders</p>
                        <p className="text-sm font-medium text-green-600">
                          GH₵{courier.orders.reduce((total: number, order: any) => total + (Number(order.deliveryPrice) || 0), 0).toFixed(2)}
                        </p>
                      </div>
                      
                      {/* Progress Line */}
                      <div className="mt-4 relative">
                        {/* Progress Lines */}
                        <div className="flex gap-1 h-1 w-full">
                          {Object.entries(getOrderProgress(courier.orders)).map(([status, isComplete], index) => (
                            <div 
                              key={status}
                              className={`flex-1 rounded-full ${
                                isComplete 
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
                  {index < couriers.length - 1 && (
                    <div className="hidden lg:block absolute h-4/5 w-px bg-gray-200 top-1/2 -translate-y-1/2" style={{ left: `${(index + 1) * (100 / 5)}%` }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Overview</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={earningsData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="earnings" fill="#4caf50" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Sales Section */}
          <div className="mb-16">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Recent Sales</h2>
              <Select defaultValue="today">
                <SelectTrigger className="w-[180px] bg-gray-50 border-gray-200 hover:bg-gray-100">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-sm">
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(recentSalesByRestaurant).map(([restaurant, sales]) => (
                <Card key={restaurant} className="bg-white overflow-hidden">
                  <CardHeader className="border-b bg-gray-50/50">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{restaurant}</CardTitle>
                      <span className="text-sm text-gray-500">{sales.length} orders</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {sales.slice(0, 5).map((sale, index) => (
                      <div key={index} 
                           className={`p-4 flex justify-between items-center hover:bg-gray-50 transition-colors
                                    ${index !== sales.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            {sale.customer.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{sale.customer}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(sale.date).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-green-600">
                            GH₵{Number(sale.amount).toFixed(2)}
                          </span>
                          <div className={`text-xs mt-1 px-2 py-1 rounded-full inline-block
                            ${sale.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                              sale.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'}`}>
                            {sale.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* New Sections Suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Popular Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={mapRef} className="h-[300px] rounded-lg overflow-hidden">
                  {!orders.length && (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No delivery data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Peak Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] bg-gray-100 rounded-lg">
                  {/* Add a time-based chart here */}
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Time-based chart coming soon
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Customers</h2>
              <div className="flex items-center space-x-4">
                <input
                  type="search"
                  placeholder="Search customers..."
                  className="px-4 py-2 border rounded-lg bg-gray-50 hover:bg-gray-100 focus:bg-white"
                />
                <Select defaultValue="all">
                  <SelectTrigger className="w-[150px] bg-gray-50 border-gray-200 hover:bg-gray-100">
                    <SelectValue placeholder="Filter by" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm">
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="recent">Recent Orders</SelectItem>
                    <SelectItem value="frequent">Frequent Buyers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-gray-50">
                      <tr>
                        <th className="px-6 py-3">Customer</th>
                        <th className="px-6 py-3">Total Orders</th>
                        <th className="px-6 py-3">Total Spent</th>
                        <th className="px-6 py-3">Last Order</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                              O
                            </div>
                            <span>Olivia Martin</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">24</td>
                        <td className="px-6 py-4">GH₵4,200.00</td>
                        <td className="px-6 py-4">2 hours ago</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-blue-600 hover:text-blue-900">View Details</button>
                        </td>
                      </tr>
                      {/* Add more customer rows here */}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <div className="flex items-center justify-center h-[400px] text-gray-500">
            Products content coming soon
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="flex items-center justify-center h-[400px] text-gray-500">
            Settings content coming soon
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 