"use client"

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, TrendingUp, Users, Route, Building2, ChartBar, BadgeCent } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { API_BASE_URL, GET_ORDERS_ENDPOINT, GET_RESTAURANTS_ENDPOINT, GET_ALL_MENU_ENDPOINT } from "@/lib/constants";
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import Papa from 'papaparse';
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";   
import { Badge } from "@/components/ui/badge";

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
  customerName: string;
  customerPhoneNumber: string;
  deliveryPrice: number;
  orderStatus: string;
  orderDate: string;
  deliveryDistance?: string;
  restaurantName: string;
  totalPrice: number;
  orderNumber: string;
  dropoffName: string;
  restaurantId: string;
  products: Array<{
    quantity: number;
    name: string;
    price: number;
  }>;
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

interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  status: string;
}

interface CustomerOrder {
  orderNumber: string;
  restaurantName: string;
  items: string[];
  totalPrice: number;
  deliveryPrice: number;
  orderStatus: string;
  orderDate: string;
  dropoffName: string;
}

interface MenuType {
  foodType: string;
  foodTypeImage: {
    url: string;
  };
  restaurantName: string;
  branchName: string;
  foods: Food[];
}

interface Food {
  name: string;
  price: number;
  description: string;
  quantity: number;
  sold: number;
  foodImage?: {
    url: string;
  };
}

export default function Overview() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedOverviewMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedRecentSalesRestaurant, setSelectedRecentSalesRestaurant] = useState<string>('all');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [isLoadingCustomerOrders, setIsLoadingCustomerOrders] = useState(false);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<MenuType[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [selectedFoodType, setSelectedFoodType] = useState<string>('all');
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [recentSalesPage, setRecentSalesPage] = useState(1);
  const [customersPage, setCustomersPage] = useState(1);
  const recentSalesPerPage = 10;
  const customersPerPage = 10;
  const [selectedRewardsMonth, setSelectedRewardsMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const earningsData = useMemo(() => {
    const [year, month] = selectedOverviewMonth.split('-');
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate.getFullYear() === parseInt(year) && 
             orderDate.getMonth() === parseInt(month) - 1;
    });

    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();

    const dailyData = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const dayOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate.getDate() === day;
      });

      return {
        day,
        earnings: dayOrders.reduce((sum, order) => sum + (Number(order.deliveryPrice) || 0), 0),
        orders: dayOrders.length
      };
    });

    return dailyData;
  }, [orders, selectedOverviewMonth]);

  const filterOrdersByMonth = (orders: Order[], monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    return orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate.getFullYear() === year && orderDate.getMonth() === month - 1;
    });
  };

  const monthlyMetrics = useMemo(() => {
    const filteredOrders = filterOrdersByMonth(orders, selectedMonth);
    
    const revenue = filteredOrders.reduce((acc, order) => {
      const deliveryPrice = parseFloat(order.deliveryPrice?.toString() || '0');
      return acc + (isNaN(deliveryPrice) ? 0 : deliveryPrice);
    }, 0);

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

    const totalDistance = filteredOrders.reduce((acc, order) => {
      return acc + (parseFloat(order.deliveryDistance?.toString() || '0') || 0);
    }, 0);

    return {
      revenue,
      bestCourier,
      totalDistance
    };
  }, [orders, selectedMonth]);

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

  const getOrderProgress = (orders: any[]) => {
    const statuses = {
      Assigned: false,
      Pickup: false,
      OnTheWay: false,
      Delivered: false
    };

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

  const totalDeliveryRevenue = useMemo(() => {
    return orders.reduce((acc, order) => {
      const deliveryPrice = parseFloat(order.deliveryPrice?.toString() || '0');
      return acc + (isNaN(deliveryPrice) ? 0 : deliveryPrice);
    }, 0);
  }, [orders]);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setIsLoadingOrders(true);
        const userId = localStorage.getItem('delikaOnboardingId');
        const response = await fetch(
          `${API_BASE_URL}${GET_RESTAURANTS_ENDPOINT}?filter[delika_onboarding_id][eq]=${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch restaurants');
        }

        const data = await response.json();
        setRestaurants(data);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchRestaurants();
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

  const restaurantMetrics = useMemo(() => {
    const totalRestaurants = restaurants.length;
    
    const [year, month] = selectedOverviewMonth.split('-');
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate.getFullYear() === parseInt(year) && 
             orderDate.getMonth() === parseInt(month) - 1;
    });
    
    const restaurantOrders = filteredOrders.reduce((acc: { [key: string]: number }, order) => {
      const restaurantId = order.restaurantId;
      acc[restaurantId] = (acc[restaurantId] || 0) + 1;
      return acc;
    }, {});

    const mostActiveRestaurant = Object.entries(restaurantOrders)
      .sort(([, a], [, b]) => b - a)[0];

    const mostActiveRestaurantName = mostActiveRestaurant
      ? restaurants.find(r => r.id === mostActiveRestaurant[0])?.restaurantName
      : 'N/A';

    const restaurantRevenue = filteredOrders.reduce((acc: { [key: string]: number }, order) => {
      const restaurantId = order.restaurantId;
      acc[restaurantId] = (acc[restaurantId] || 0) + (Number(order.totalPrice) || 0);
      return acc;
    }, {});

    const highestRevenue = Object.entries(restaurantRevenue)
      .sort(([, a], [, b]) => b - a)[0];

    const highestRevenueRestaurantName = highestRevenue
      ? restaurants.find(r => r.id === highestRevenue[0])?.restaurantName
      : 'N/A';

    return {
      totalRestaurants,
      mostActiveRestaurant: {
        name: mostActiveRestaurantName,
        orders: mostActiveRestaurant ? mostActiveRestaurant[1] : 0
      },
      highestRevenue: {
        name: highestRevenueRestaurantName,
        amount: highestRevenue ? highestRevenue[1] : 0
      },
      averageOrdersPerRestaurant: totalRestaurants 
        ? (filteredOrders.length / totalRestaurants).toFixed(1) 
        : 0
    };
  }, [restaurants, orders, selectedOverviewMonth]);

  const recentSalesByRestaurant = useMemo(() => {
    const [year, month] = selectedMonth.split('-');
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      const monthMatch = orderDate.getFullYear() === parseInt(year) && 
                        orderDate.getMonth() === parseInt(month) - 1;
      
      const restaurantMatch = selectedRecentSalesRestaurant === 'all' || 
                            order.restaurantId === selectedRecentSalesRestaurant;
      
      return monthMatch && restaurantMatch;
    });
    
    return filteredOrders.reduce((acc: { [key: string]: any[] }, order) => {
      const restaurantName = order.restaurantName;
      if (!acc[restaurantName]) {
        acc[restaurantName] = [];
      }
      acc[restaurantName].push({
        customer: order.customerName,
        amount: Number(order.totalPrice) || 0,
        date: new Date(order.orderDate),
        status: order.orderStatus,
        items: order.products.map(p => `${p.quantity}x ${p.name}`).join(', ')
      });
      return acc;
    }, {});
  }, [orders, selectedMonth, selectedRecentSalesRestaurant]);

  useEffect(() => {
    if (!mapRef.current || !orders.length) return;

    const styleSheet = document.createElement("style");
    styleSheet.textContent = mapStyle;
    document.head.appendChild(styleSheet);

    mapRef.current.innerHTML = '';

    const mapContainer = document.createElement('div');
    mapContainer.style.width = '100%';
    mapContainer.style.height = '100%';
    mapRef.current.appendChild(mapContainer);

    const deliveryLocations = orders
      .filter(order => 
        order.dropoffLocation && 
        typeof order.dropoffLocation.lat === 'number' && 
        typeof order.dropoffLocation.lng === 'number'
      )
      .map(order => ({
        lat: order.dropoffLocation.lat,
        lon: order.dropoffLocation.lng,
        weight: 1 
      }));

    if (deliveryLocations.length === 0) {
      const noDataMessage = document.createElement('div');
      noDataMessage.className = 'flex items-center justify-center h-full text-gray-500';
      noDataMessage.textContent = 'No delivery location data available';
      mapRef.current.appendChild(noDataMessage);
      return;
    }

    const center = deliveryLocations.reduce(
      (acc, loc) => ({
        lat: acc.lat + loc.lat / deliveryLocations.length,
        lon: acc.lon + loc.lon / deliveryLocations.length
      }),
      { lat: 0, lon: 0 }
    );

    const map = new maplibregl.Map({
      container: mapContainer,
      style: `https://maps.geoapify.com/v1/styles/osm-bright-smooth/style.json?apiKey=${GEOAPIFY_API_KEY}`,
      center: [center.lon, center.lat],
      zoom: 11
    });

    deliveryLocations.forEach(location => {
      const markerElement = document.createElement('div');
      markerElement.className = 'delivery-marker';
      
      new maplibregl.Marker(markerElement)
        .setLngLat([location.lon, location.lat])
        .addTo(map);
    });

    if (deliveryLocations.length > 5) {
      map.on('load', () => {
        map.addSource('delivery-points', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: deliveryLocations.map(loc => ({
              type: 'Feature',
              properties: {
                weight: loc.weight
              },
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
            'heatmap-weight': ['get', 'weight'],
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 1,
              9, 3
            ],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(33,102,172,0)',
              0.2, 'rgb(103,169,207)',
              0.4, 'rgb(209,229,240)',
              0.6, 'rgb(253,219,199)',
              0.8, 'rgb(239,138,98)',
              1, 'rgb(178,24,43)'
            ],
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 2,
              9, 20
            ],
            'heatmap-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              7, 1,
              9, 0.5
            ]
          }
        });
      });
    }

    map.addControl(new maplibregl.NavigationControl());

    return () => {
      map.remove();
      document.head.removeChild(styleSheet);
    };
  }, [orders, GEOAPIFY_API_KEY]);

  const mapStyle = `
    .delivery-marker {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: #ef4444;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .maplibregl-map {
      border-radius: 0.5rem;
    }
    .maplibregl-control-container {
      margin: 10px;
    }
  `;

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoadingCustomers(true);
        setCustomerError(null);
        const userId = localStorage.getItem('delikaOnboardingId');
        
        const response = await fetch(
          `${API_BASE_URL}${GET_ORDERS_ENDPOINT}?filter[delika_onboarding_id][eq]=${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        
        const customerMap = new Map();
        
        data.forEach((order: Order) => {
          if (!order.customerName || !order.customerPhoneNumber) return;
          
          const customerId = `${order.customerName}-${order.customerPhoneNumber}`;
          const orderAmount = Number(order.totalPrice) || 0;
          const orderDate = new Date(order.orderDate);
          
          if (customerMap.has(customerId)) {
            const customer = customerMap.get(customerId);
            customer.totalOrders += 1;
            customer.totalSpent += orderAmount;
            if (new Date(customer.lastOrderDate) < orderDate) {
              customer.lastOrderDate = order.orderDate;
            }
          } else {
            customerMap.set(customerId, {
              id: customerId,
              name: order.customerName,
              phoneNumber: order.customerPhoneNumber,
              totalOrders: 1,
              totalSpent: orderAmount,
              lastOrderDate: order.orderDate,
              status: 'Active'
            });
          }
        });

        setCustomers(Array.from(customerMap.values()));
      } catch (error) {
        console.error('Error fetching customers:', error);
        setCustomerError('Failed to load customers');
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = 
        customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        customer.phoneNumber.includes(customerSearchQuery);
        
      const matchesFilter = 
        customerFilter === 'all' ||
        (customerFilter === 'recent' && new Date(customer.lastOrderDate) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
        (customerFilter === 'frequent' && customer.totalOrders >= 5);
        
      return matchesSearch && matchesFilter;
    });
  }, [customers, customerSearchQuery, customerFilter]);

  const handleExportCustomers = () => {
    const csvData = filteredCustomers.map(customer => ({
      'Customer Name': customer.name,
      'Phone Number': customer.phoneNumber,
      'Total Orders': customer.totalOrders,
      'Total Spent (GH₵)': customer.totalSpent.toFixed(2),
      'Last Order': new Date(customer.lastOrderDate).toLocaleDateString(),
      'Status': customer.status
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleViewOrders = async (customer: Customer) => {
    try {
      setIsLoadingCustomerOrders(true);
      setSelectedCustomer(customer);
      setIsOrdersModalOpen(true);
      
      const userId = localStorage.getItem('delikaOnboardingId');
      const response = await fetch(
        `${API_BASE_URL}${GET_ORDERS_ENDPOINT}?filter[delika_onboarding_id][eq]=${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      
      const customerOrders = data
        .filter((order: Order) => 
          order.customerName === customer.name && 
          order.customerPhoneNumber === customer.phoneNumber
        )
        .map((order: Order) => ({
          orderNumber: order.orderNumber || 'N/A',
          restaurantName: order.restaurantName,
          items: order.products?.map(p => `${p.quantity}x ${p.name}`) || [],
          totalPrice: Number(order.totalPrice) || 0,
          deliveryPrice: Number(order.deliveryPrice) || 0,
          orderStatus: order.orderStatus,
          orderDate: order.orderDate,
          dropoffName: order.dropoffName || 'N/A'
        }))
        .sort((a: CustomerOrder, b: CustomerOrder) => 
          new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
        );

      setCustomerOrders(customerOrders);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      toast.error('Failed to load customer orders');
    } finally {
      setIsLoadingCustomerOrders(false);
    }
  };

  useEffect(() => {
    const fetchAllMenuItems = async () => {
      try {
        setIsLoadingMenu(true);
        setMenuError(null);

        const response = await fetch(
          `${API_BASE_URL}${GET_ALL_MENU_ENDPOINT}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch menu items');
        }

        const menuData = await response.json();
        
        const restaurantMap = new Map(restaurants.map(r => [r.id, r.restaurantName]));
        
        const validMenuItems = menuData
          .filter((item: MenuType) => 
            item.foodType && item.foodType.trim() !== '' && 
            item.foods && item.foods.length > 0
          )
          .map((item: MenuType) => ({
            ...item,
            restaurantName: restaurantMap.get(item.restaurantName) || 'Unknown Restaurant'
          }));
          
        setMenuItems(validMenuItems);
      } catch (error) {
        console.error('Error fetching menu items:', error);
        setMenuError('Failed to load menu items');
      } finally {
        setIsLoadingMenu(false);
      }
    };

    if (restaurants.length > 0) {
      fetchAllMenuItems();
    }
  }, [restaurants]);

  const foodTypes = useMemo(() => {
    const types = new Set<string>();
    menuItems.forEach(item => {
      if (item.foodType && item.foodType.trim() !== '') {
        types.add(item.foodType);
      }
    });
    return ['all', ...Array.from(types)];
  }, [menuItems]);

  const filteredAndPaginatedMenuItems = useMemo(() => {
    let items = menuItems;
    
    if (selectedFoodType !== 'all') {
      items = items.filter(item => item.foodType === selectedFoodType);
    }
    
    if (menuSearchQuery) {
      items = items.map(item => ({
        ...item,
        foods: item.foods.filter(food => 
          food.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
          food.description.toLowerCase().includes(menuSearchQuery.toLowerCase())
        )
      })).filter(item => item.foods.length > 0);
    }

    const flattenedItems = items.flatMap(item => 
      item.foods.map(food => ({ ...food, foodType: item.foodType, restaurantName: item.restaurantName }))
    );
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return {
      items: flattenedItems.slice(startIndex, endIndex),
      totalItems: flattenedItems.length,
      totalPages: Math.ceil(flattenedItems.length / itemsPerPage)
    };
  }, [menuItems, selectedFoodType, menuSearchQuery, currentPage]);

  const paginatedRecentSales = useMemo(() => {
    const allSales = Object.values(recentSalesByRestaurant).flat().sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const startIndex = (recentSalesPage - 1) * recentSalesPerPage;
    const endIndex = startIndex + recentSalesPerPage;
    
    return {
      items: allSales.slice(startIndex, endIndex),
      totalItems: allSales.length,
      totalPages: Math.ceil(allSales.length / recentSalesPerPage)
    };
  }, [recentSalesByRestaurant, recentSalesPage]);

  const paginatedCustomers = useMemo(() => {
    const startIndex = (customersPage - 1) * customersPerPage;
    const endIndex = startIndex + customersPerPage;
    
    return {
      items: filteredCustomers.slice(startIndex, endIndex),
      totalItems: filteredCustomers.length,
      totalPages: Math.ceil(filteredCustomers.length / customersPerPage)
    };
  }, [filteredCustomers, customersPage]);

  const rewardsData = useMemo(() => {
    const [year, month] = selectedRewardsMonth.split('-');
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate.getFullYear() === parseInt(year) && 
             orderDate.getMonth() === parseInt(month) - 1;
    });

    const pointsPerCedi = 1;
    const totalSpent = filteredOrders.reduce((sum, order) => sum + Number(order.totalPrice), 0);
    const totalPoints = Math.floor(totalSpent * pointsPerCedi);
    
    const customerPoints = filteredOrders.reduce((acc, order) => {
      const customerId = `${order.customerName}-${order.customerPhoneNumber}`;
      const points = Math.floor(Number(order.totalPrice) * pointsPerCedi);
      
      if (!acc[customerId]) {
        acc[customerId] = {
          name: order.customerName,
          points: 0,
          totalSpent: 0,
          orders: 0
        };
      }
      
      acc[customerId].points += points;
      acc[customerId].totalSpent += Number(order.totalPrice);
      acc[customerId].orders += 1;
      
      return acc;
    }, {} as Record<string, { name: string; points: number; totalSpent: number; orders: number; }>);

    const topEarners = Object.values(customerPoints)
      .sort((a, b) => b.points - a.points)
      .slice(0, 5)
      .map(customer => ({
        ...customer,
        level: customer.points >= 2000 ? "Gold" : customer.points >= 1000 ? "Silver" : "Bronze"
      }));

    const courierDeliveries = filteredOrders.reduce((acc, order) => {
      if (!order.courierName) return acc;
      
      if (!acc[order.courierName]) {
        acc[order.courierName] = {
          name: order.courierName,
          deliveries: 0,
          points: 0,
          totalEarned: 0
        };
      }
      
      acc[order.courierName].deliveries += 1;
      acc[order.courierName].points += Math.floor(Number(order.deliveryPrice) * pointsPerCedi);
      acc[order.courierName].totalEarned += Number(order.deliveryPrice);
      
      return acc;
    }, {} as Record<string, { name: string; deliveries: number; points: number; totalEarned: number; }>);

    const restaurantPerformance = filteredOrders.reduce((acc, order) => {
      if (!order.restaurantId || !order.totalPrice) return acc;
      
      const restaurant = restaurants.find(r => r.id === order.restaurantId);
      if (!restaurant) return acc;
      
      const restaurantKey = restaurant.restaurantName;
      const orderTotal = Number(order.totalPrice);
      const points = Math.floor(orderTotal * pointsPerCedi);
      
      if (!acc[restaurantKey]) {
        acc[restaurantKey] = {
          name: restaurant.restaurantName,
          points: 0,
          totalRevenue: 0,
          orders: 0,
          averageOrderValue: 0
        };
      }
      
      acc[restaurantKey].points += points;
      acc[restaurantKey].totalRevenue += orderTotal;
      acc[restaurantKey].orders += 1;
      acc[restaurantKey].averageOrderValue = acc[restaurantKey].totalRevenue / acc[restaurantKey].orders;
      
      return acc;
    }, {} as Record<string, { 
      name: string; 
      points: number; 
      totalRevenue: number; 
      orders: number; 
      averageOrderValue: number; 
    }>);

    const topRestaurants = Object.entries(restaurantPerformance)
      .filter(([_, restaurant]) => restaurant.name && restaurant.name.trim() !== '')
      .map(([_, restaurant]) => restaurant)
      .sort((a, b) => b.points - a.points)
      .slice(0, 3);

    const topCouriers = Object.values(courierDeliveries)
      .sort((a, b) => b.deliveries - a.deliveries)
      .slice(0, 3);

    return {
      pointsIssued: totalPoints,
      pointsValue: totalPoints * 0.1, 
      topEarners,
      topCouriers,
      topRestaurants,
      totalOrders: filteredOrders.length,
      totalRevenue: totalSpent
    };
  }, [orders, selectedRewardsMonth, restaurants]);

  return (
    <div className="container mx-auto p-6 mt-32">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <div className="flex justify-end mb-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
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
                  <BadgeCent className="h-6 w-6 text-white/80" />
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <Card className="bg-gray-900 text-white">
              <CardHeader>
                <CardTitle>Total Restaurants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <p className="text-2xl font-bold">{restaurantMetrics.totalRestaurants}</p>
                  <Building2 className="h-6 w-6 text-white/80" />
                </div>
                <p className="text-sm text-white/80">Active restaurants</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 text-white">
              <CardHeader>
                <CardTitle>Most Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold truncate max-w-[180px]">
                      {restaurantMetrics.mostActiveRestaurant.name}
                    </p>
                    <p className="text-sm text-white/80">
                      {restaurantMetrics.mostActiveRestaurant.orders} orders
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-white/80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 text-white">
              <CardHeader>
                <CardTitle>Highest Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold truncate max-w-[180px]">
                      {restaurantMetrics.highestRevenue.name}
                    </p>
                    <p className="text-sm text-white/80">
                      GH₵{restaurantMetrics.highestRevenue.amount.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="h-6 w-6 text-white/80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 text-white">
              <CardHeader>
                <CardTitle>Average Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold">
                      {restaurantMetrics.averageOrdersPerRestaurant}
                    </p>
                    <p className="text-sm text-white/80">Orders per restaurant</p>
                  </div>
                  <ChartBar className="h-6 w-6 text-white/80" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Monthly Earnings</h2>
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Monthly Earnings</h3>
                <div className="text-sm text-gray-500">
                  Last {earningsData.length} days
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={earningsData}>
                  <XAxis dataKey="day" />
                  <YAxis 
                    tickFormatter={(value) => `GH₵${value.toFixed(0)}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`GH₵${value.toFixed(2)}`, 'Earnings']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Bar 
                    dataKey="earnings" 
                    fill="#4caf50"
                    radius={[4, 4, 0, 0]}
                  >
                    {earningsData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={entry.day === new Date().getDate() ? '#2e7d32' : '#4caf50'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total Earnings</p>
                  <p className="text-xl font-semibold">
                    GH₵{earningsData.reduce((sum, item) => sum + item.earnings, 0).toFixed(2)}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-xl font-semibold">
                    {earningsData.reduce((sum, item) => sum + item.orders, 0)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="mb-16">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Recent Sales</h2>
              <Select value={selectedRecentSalesRestaurant} onValueChange={setSelectedRecentSalesRestaurant}>
                <SelectTrigger className="w-[180px] bg-gray-50 border-gray-200 hover:bg-gray-100">
                  <SelectValue placeholder="Select restaurant" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-sm">
                  <SelectItem value="all">All Restaurants</SelectItem>
                  {restaurants.map((restaurant) => (
                    <SelectItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.restaurantName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Sales History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Customer</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Items</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedRecentSales.items.map((sale, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium">{sale.customer}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-600">{sale.items}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">GH₵{Number(sale.amount).toFixed(2)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-600">
                            {new Date(sale.date).toLocaleString('default', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            sale.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            sale.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            sale.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'}`}>
                            {sale.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {Object.keys(recentSalesByRestaurant).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No sales data available
                  </div>
                ) : (
                  <div className="flex justify-between items-center p-4 border-t">
                    <p className="text-sm text-gray-500">
                      Showing {((recentSalesPage - 1) * recentSalesPerPage) + 1} to {Math.min(recentSalesPage * recentSalesPerPage, paginatedRecentSales.totalItems)} of {paginatedRecentSales.totalItems} sales
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRecentSalesPage(prev => Math.max(1, prev - 1))}
                        disabled={recentSalesPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRecentSalesPage(prev => Math.min(paginatedRecentSales.totalPages, prev + 1))}
                        disabled={recentSalesPage === paginatedRecentSales.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

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
                <div className="relative w-64">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search customers..."
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    className="pl-8 bg-gray-50 hover:bg-gray-100 focus:bg-white"
                  />
                </div>
                <Select value={customerFilter} onValueChange={setCustomerFilter}>
                  <SelectTrigger className="w-[180px] bg-gray-50 border-gray-200 hover:bg-gray-100">
                    <SelectValue placeholder="Filter by" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm">
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="recent">Recent Orders</SelectItem>
                    <SelectItem value="frequent">Frequent Buyers</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleExportCustomers}
                  className="bg-gray-900 text-white hover:bg-gray-900/80 border border-gray-700"
                >
                  Export Customers
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="relative overflow-x-auto">
                  {isLoadingCustomers ? (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner className="h-6 w-6" />
                    </div>
                  ) : customerError ? (
                    <div className="text-center py-8 text-red-500">
                      {customerError}
                    </div>
                  ) : filteredCustomers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No customers found
                    </div>
                  ) : (
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
                        {paginatedCustomers.items.map((customer) => (
                          <tr key={customer.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                  {customer.name.charAt(0)}
                                </div>
                                <div>
                                  <div>{customer.name}</div>
                                  <div className="text-sm text-gray-500">{customer.phoneNumber}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">{customer.totalOrders}</td>
                            <td className="px-6 py-4">GH₵{customer.totalSpent.toFixed(2)}</td>
                            <td className="px-6 py-4">
                              {new Date(customer.lastOrderDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                customer.status === 'Active' ? 'bg-green-100 text-green-800' :
                                customer.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'}`}>
                                {customer.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button 
                                className="text-blue-600 hover:text-blue-900"
                                onClick={() => handleViewOrders(customer)}
                              >
                                View Orders
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Menu Items</h2>
              <div className="flex items-center gap-4">
                <div className="relative w-64">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search menu items..."
                    value={menuSearchQuery}
                    onChange={(e) => setMenuSearchQuery(e.target.value)}
                    className="pl-8 border-gray-200 bg-gray-50"
                  />
                </div>
                <Select value={selectedFoodType} onValueChange={setSelectedFoodType}>
                  <SelectTrigger className="w-[180px] bg-gray-50 border-gray-200 hover:bg-gray-100">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm">
                    {foodTypes.map((type) => (
                      type && type.trim() !== '' && (
                        <SelectItem key={type} value={type}>
                          {type === 'all' ? 'All Categories' : type}
                        </SelectItem>
                      )
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoadingMenu ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner className="h-6 w-6" />
              </div>
            ) : menuError ? (
              <div className="text-center py-8">
                <p className="text-red-500">{menuError}</p>
              </div>
            ) : filteredAndPaginatedMenuItems.items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No menu items found</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredAndPaginatedMenuItems.items.map((food) => (
                    <Card key={`${food.name}-${food.restaurantName}`} className="border overflow-hidden hover:shadow-lg transition-shadow bg-white">
                      {food.foodImage && (
                        <div className="h-48 overflow-hidden">
                          <img 
                            src={food.foodImage.url} 
                            alt={food.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold truncate max-w-[150px]" title={food.name}>{food.name}</h4>
                            <p className="text-sm text-gray-500 truncate max-w-[150px]" title={food.restaurantName}>
                              {food.restaurantName || 'Unknown Restaurant'}
                            </p>
                          </div>
                          <Badge variant="outline" className="ml-2 shrink-0">{food.foodType}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2" title={food.description}>
                          {food.description}
                        </p>
                        <div className="flex justify-between items-center mt-3">
                          <p className="text-sm font-medium text-green-600">
                            GH₵{Number(food.price).toFixed(2)}
                          </p>
                          <div className="text-sm text-gray-500">
                            <p>Stock: {food.quantity || 0}</p>
                            <p>Sold: {food.sold || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="flex justify-between items-center mt-6">
                  <p className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndPaginatedMenuItems.totalItems)} of {filteredAndPaginatedMenuItems.totalItems} items
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(filteredAndPaginatedMenuItems.totalPages, prev + 1))}
                      disabled={currentPage === filteredAndPaginatedMenuItems.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rewards">
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Rewards & Loyalty</h2>
              <Select value={selectedRewardsMonth} onValueChange={setSelectedRewardsMonth}>
                <SelectTrigger className="w-[180px] bg-gray-50 border-gray-200 hover:bg-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-sm">
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
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Points Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Points System</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">Current Rate</p>
                        <p className="font-medium">1 point = GH₵0.1</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">Points Issued</p>
                        <p className="font-medium">{rewardsData.pointsIssued.toLocaleString()}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">Points Value</p>
                        <p className="font-medium">GH₵{rewardsData.pointsValue.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-500">Total Orders</p>
                          <p className="font-medium">{rewardsData.totalOrders}</p>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-500">Total Revenue</p>
                          <p className="font-medium">GH₵{rewardsData.totalRevenue.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Reward Tiers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-yellow-800">Gold</p>
                          <p className="text-sm text-yellow-800">2000+ points</p>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">10% bonus points on orders</p>
                      </div>
                      <div className="p-3 border border-gray-200 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-gray-600">Silver</p>
                          <p className="text-sm text-gray-600">1000+ points</p>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">5% bonus points on orders</p>
                      </div>
                      <div className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-orange-800">Bronze</p>
                          <p className="text-sm text-orange-800">0+ points</p>
                        </div>
                        <p className="text-sm text-orange-700 mt-1">Base points on orders</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="border-t pt-8">
              <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {rewardsData.topEarners.map((earner, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                              {earner.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{earner.name}</p>
                              <p className="text-xs text-gray-500">{earner.level} Member</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{earner.points} pts</p>
                            <p className="text-xs text-gray-500">{earner.orders} orders</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Couriers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {rewardsData.topCouriers.map((courier, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{courier.name}</p>
                            <p className="text-sm text-gray-500">{courier.deliveries} deliveries</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{courier.points} pts</p>
                            <p className="text-xs text-gray-500">GH₵{courier.totalEarned.toFixed(2)} earned</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Restaurants</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {rewardsData.topRestaurants.map((restaurant, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{restaurant.name}</p>
                            <p className="text-sm text-gray-500">{restaurant.orders} orders</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{restaurant.points} pts</p>
                            <div className="text-xs text-gray-500">
                              <p>GH₵{restaurant.totalRevenue.toFixed(2)} revenue</p>
                              <p>Avg. GH₵{restaurant.averageOrderValue.toFixed(2)}/order</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="border-t pt-8">
              <h3 className="text-lg font-semibold mb-4">Available Rewards</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Available Rewards</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { name: "GH₵50 Off", points: 500, validity: "30 days" },
                        { name: "Free Delivery", points: 300, validity: "7 days" },
                        { name: "GH₵100 Off", points: 1000, validity: "30 days" },
                        { name: "Priority Delivery", points: 200, validity: "7 days" }
                      ].map((reward, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <p className="font-medium">{reward.name}</p>
                            <p className="text-sm font-medium">{reward.points} pts</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Valid for {reward.validity}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isOrdersModalOpen} onOpenChange={setIsOrdersModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                {selectedCustomer?.name.charAt(0)}
              </div>
              <div>
                <div>{selectedCustomer?.name}</div>
                <div className="text-sm text-gray-500">{selectedCustomer?.phoneNumber}</div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {isLoadingCustomerOrders ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner className="h-6 w-6" />
            </div>
          ) : customerOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No orders found for this customer
            </div>
          ) : (
            <div className="space-y-4">
              {customerOrders.map((order, index) => (
                <Card key={index} className="bg-white">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{order.restaurantName}</p>
                        <p className="text-sm text-gray-500">
                          Order #{order.orderNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">GH₵{order.totalPrice.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">
                          Delivery: GH₵{order.deliveryPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <div className="space-y-1">
                          <p className="text-gray-500">Items:</p>
                          {order.items.map((item, i) => (
                            <p key={i}>{item}</p>
                          ))}
                        </div>
                        <div className="text-right space-y-1">
                          <p>Delivered to: {order.dropoffName}</p>
                          <p>{new Date(order.orderDate).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}