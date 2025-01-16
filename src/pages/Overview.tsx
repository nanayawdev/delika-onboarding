"use client"

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Sonner } from "@/components/ui/sonner"
import { DollarSign, Star, MessageCircle, TrendingUp, Award, MapPin } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import PurseIcon from "@/assets/icons/purse-stroke-rounded";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const GET_ORDERS_ENDPOINT = import.meta.env.VITE_GET_ORDERS_ENDPOINT;

interface Courier {
  name: string;
  phoneNumber: string;
  image?: { url: string } | null;
  orders: Order[];
}

interface Order {
  id: string;
  orderStatus: string;
  orderNumber: string;
  customerName: string;
  deliveryPrice: number;
  orderReceivedTime?: string;
  orderPickedUpTime?: string;
  orderOnmywayTime?: string;
  orderCompletedTime?: string;
}

const getOrderProgress = (orders: Order[]) => {
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

const calculateTotalDeliveryPrice = (orders: Order[]) => {
  return orders.reduce((total, order) => {
    return total + (Number(order.deliveryPrice) || 0);
  }, 0);
};

const calculateDeliverySales = (orders: Order[]) => {
  return orders.reduce((acc, order) => {
    const deliveryPrice = parseFloat(order.deliveryPrice.toString()) || 0;
    return acc + deliveryPrice;
  }, 0);
};

const earningsData = [
  { month: 'Jan', earnings: 5000 },
  { month: 'Feb', earnings: 7500 },
  { month: 'Mar', earnings: 6000 },
  { month: 'Apr', earnings: 8000 },
  { month: 'May', earnings: 9500 },
];

const topSalesData = [
  { day: 'Mon', sales: 100 },
  { day: 'Tue', sales: 200 },
  { day: 'Wed', sales: 150 },
  { day: 'Thu', sales: 250 },
  { day: 'Fri', sales: 300 },
];

const bestCourierData = [
  { week: 'Week 1', deliveries: 50 },
  { week: 'Week 2', deliveries: 75 },
  { week: 'Week 3', deliveries: 60 },
  { week: 'Week 4', deliveries: 90 },
];

const mostDistanceData = [
  { day: 'Mon', distance: 10 },
  { day: 'Tue', distance: 15 },
  { day: 'Wed', distance: 12 },
  { day: 'Thu', distance: 18 },
  { day: 'Fri', distance: 20 },
];

export default function Overview() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null);
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  
  useEffect(() => {
    const fetchCouriers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}${GET_ORDERS_ENDPOINT}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const orders = await response.json();
        console.log('API Response:', orders);

        // Group orders by courier
        const courierMap = orders.reduce((acc: { [key: string]: Courier }, order: Order) => {
          const courierName = order.courierName || 'Unassigned';
          if (!acc[courierName]) {
            acc[courierName] = {
              name: courierName,
              phoneNumber: order.courierPhoneNumber || 'N/A',
              image: null,
              orders: []
            };
          }
          acc[courierName].orders.push(order);
          return acc;
        }, {});

        const courierArray = Object.values(courierMap);
        console.log('Processed Couriers:', courierArray);
        setCouriers(courierArray);

      } catch (error) {
        console.error('Error fetching couriers:', error);
        setError('Failed to load couriers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCouriers();
  }, []);

  return (
    <div className="container mx-auto p-6 mt-40">
      {/* Active Couriers Section */}
      <div className="mb-32">
        <h2 className="text-2xl font-bold mb-6">Active Couriers</h2>
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : couriers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {couriers.map((courier) => (
              <Card 
                key={courier.name}
                className="cursor-pointer hover:shadow-lg transition-shadow bg-white dark:bg-gray-800"
                onClick={() => {
                  setSelectedCourier(courier);
                  setIsCourierModalOpen(true);
                }}
              >
                <CardHeader className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {courier.image ? (
                      <img 
                        src={courier.image.url} 
                        alt={courier.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg font-semibold">{courier.name}</CardTitle>
                      <p className="text-sm text-gray-500">{courier.phoneNumber}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {courier.orders.length} orders
                  </Badge>
                </CardHeader>
                <CardContent className="mt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                    <p className="text-lg font-semibold text-green-600">
                      GH₵{calculateTotalDeliveryPrice(courier.orders).toFixed(2)}
                    </p>
                  </div>
                  
                  {/* Progress Line */}
                  <div className="mt-4 relative">
                    <div className="flex gap-1 h-2 w-full rounded-full bg-gray-200">
                      {Object.entries(getOrderProgress(courier.orders)).map(([status, isComplete]) => (
                        <div 
                          key={status}
                          className={`flex-1 rounded-full ${
                            isComplete 
                              ? status === 'Assigned' ? 'bg-blue-500'
                                : status === 'Pickup' ? 'bg-yellow-500'
                                : status === 'OnTheWay' ? 'bg-purple-500'
                                : 'bg-green-500'
                              : ''
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500">
            No active couriers found. Please check if orders have assigned couriers.
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader>
            <CardTitle>Earnings</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-4xl font-bold">
                  GH₵{calculateDeliverySales(couriers.flatMap(courier => courier.orders)).toFixed(2)}
                </p>
                <p className="text-sm">Monthly revenue</p>
              </div>
              <DollarSign className="h-12 w-12 text-white opacity-50" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={earningsData}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={false} />
                <YAxis axisLine={false} tickLine={false} tick={false} />
                <Tooltip />
                <Area type="monotone" dataKey="earnings" stroke="#ffffff" fillOpacity={1} fill="url(#colorEarnings)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader>
            <CardTitle>Top Sales</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold">Judas</p>
                <p className="text-sm">+68% from last week</p>
              </div>
              <TrendingUp className="h-12 w-12 text-white opacity-50" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={topSalesData}>
                <defs>
                  <linearGradient id="colorTopSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={false} />
                <YAxis axisLine={false} tickLine={false} tick={false} />
                <Tooltip />
                <Area type="monotone" dataKey="sales" stroke="#ffffff" fillOpacity={1} fill="url(#colorTopSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardHeader>
            <CardTitle>Best Courier</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold">Judas</p>
                <p className="text-sm">+45% from last week</p>
              </div>
              <Award className="h-12 w-12 text-white opacity-50" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={bestCourierData}>
                <defs>
                  <linearGradient id="colorBestCourier" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={false} />
                <YAxis axisLine={false} tickLine={false} tick={false} />
                <Tooltip />
                <Area type="monotone" dataKey="deliveries" stroke="#ffffff" fillOpacity={1} fill="url(#colorBestCourier)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader>
            <CardTitle>Most Distance</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold">Judas</p>
                <p className="text-sm">+17km from last week</p>
              </div>
              <MapPin className="h-12 w-12 text-white opacity-50" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={mostDistanceData}>
                <defs>
                  <linearGradient id="colorMostDistance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={false} />
                <YAxis axisLine={false} tickLine={false} tick={false} />
                <Tooltip />
                <Area type="monotone" dataKey="distance" stroke="#ffffff" fillOpacity={1} fill="url(#colorMostDistance)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Courier Details Modal */}
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

      <Sonner position="top-right" />
    </div>
  );
} 