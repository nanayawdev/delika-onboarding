"use client"

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { User } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Sonner } from "@/components/ui/sonner"
import { DollarSign } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const GET_ORDERS_ENDPOINT = import.meta.env.VITE_GET_ORDERS_ENDPOINT;

const chartData = [
  { date: "2024-04-01", desktop: 222, mobile: 150 },
  { date: "2024-04-02", desktop: 97, mobile: 180 },
  { date: "2024-04-03", desktop: 167, mobile: 120 },
  { date: "2024-04-04", desktop: 242, mobile: 260 },
  { date: "2024-04-05", desktop: 373, mobile: 290 },
  // ... (other data points)
  { date: "2024-06-30", desktop: 446, mobile: 400 },
];

const chartConfig = {
  views: {
    label: "Page Views",
  },
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

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

export function VisitorChart() {
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("desktop");

  const total = React.useMemo(
    () => ({
      desktop: chartData.reduce((acc, curr) => acc + curr.desktop, 0),
      mobile: chartData.reduce((acc, curr) => acc + curr.mobile, 0),
    }),
    []
  );

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Bar Chart - Interactive</CardTitle>
          <CardDescription>
            Showing total visitors for the last 3 months
          </CardDescription>
        </div>
        <div className="flex">
          {["desktop", "mobile"].map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg font-bold leading-none sm:text-3xl">
                  {total[key as keyof typeof total].toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
              }
            />
            <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const mockSalesData = [
  { date: '2023-10-01', total: 120 },
  { date: '2023-10-02', total: 200 },
  { date: '2023-10-03', total: 150 },
  { date: '2023-10-04', total: 300 },
  { date: '2023-10-05', total: 250 },
];

const mockDeliveryData = [
  { date: '2023-10-01', total: 10 },
  { date: '2023-10-02', total: 15 },
  { date: '2023-10-03', total: 12 },
  { date: '2023-10-04', total: 20 },
  { date: '2023-10-05', total: 18 },
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
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Active Couriers</h2>
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : couriers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {couriers.map((courier) => (
              <Card 
                key={courier.name}
                className="cursor-pointer hover:shadow-lg transition-shadow bg-white dark:bg-gray-800"
                onClick={() => {
                  setSelectedCourier(courier);
                  setIsCourierModalOpen(true);
                }}
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
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
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
                      GH₵{calculateTotalDeliveryPrice(courier.orders).toFixed(2)}
                    </p>
                  </div>
                  
                  {/* Progress Line */}
                  <div className="mt-4 relative">
                    <div className="flex gap-1 h-1 w-full">
                      {Object.entries(getOrderProgress(courier.orders)).map(([status, isComplete]) => (
                        <div 
                          key={status}
                          className={`flex-1 rounded-full ${
                            isComplete 
                              ? status === 'Assigned' ? 'bg-blue-500'
                                : status === 'Pickup' ? 'bg-yellow-500'
                                : status === 'OnTheWay' ? 'bg-purple-500'
                                : 'bg-green-500'
                              : 'bg-gray-200'
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

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              GH₵{calculateDeliverySales(couriers.flatMap(courier => courier.orders)).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        {/* ... other stat cards ... */}
      </div>

      {/* Visitor Chart */}
      <VisitorChart />

      {/* Line Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 mt-4">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Daily Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart width={500} height={300} data={mockSalesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#8884d8" />
            </LineChart>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Daily Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart width={500} height={300} data={mockDeliveryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#82ca9d" />
            </LineChart>
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