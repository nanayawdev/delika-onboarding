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
    Received: false,
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
        statuses.Received = true;
        break;
      case 'OnTheWay':
        statuses.OnTheWay = true;
        statuses.Pickup = true;
        statuses.Received = true;
        break;
      case 'Pickup':
        statuses.Pickup = true;
        statuses.Received = true;
        break;
      case 'Received':
        statuses.Received = true;
        break;
    }
  }
  return statuses;
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

const Overview: React.FC = () => {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [isCourierModalOpen, setIsCourierModalOpen] = useState<boolean>(false);
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null);

  useEffect(() => {
    const fetchCouriers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}${GET_ORDERS_ENDPOINT}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch orders');
        
        const orders = await response.json();
        
        // Group orders by courier
        const courierOrders = orders.reduce((acc, order) => {
          if (order.courierName) {
            if (!acc[order.courierName]) {
              acc[order.courierName] = {
                name: order.courierName,
                phoneNumber: order.courierPhoneNumber || 'N/A',
                image: null, // You'll need to get this from your users API
                orders: []
              };
            }
            acc[order.courierName].orders.push(order);
          }
          return acc;
        }, {});

        setCouriers(Object.values(courierOrders));
      } catch (error) {
        console.error('Error fetching couriers:', error);
      }
    };

    fetchCouriers();
  }, []);

  const getCouriersList = () => couriers;

  const totalSales = mockSalesData.reduce((acc, item) => acc + item.total, 0);
  const totalOrders = 100; // Mock total orders
  const averageOrderValue = totalSales / totalOrders;

  // Prepare net income data for the line chart
  const netIncomeData = mockSalesData.map(item => ({
    date: item.date,
    netIncome: item.total, // Assuming net income is the same as total sales for simplicity
  }));

  return (
    <div className="container mx-auto py-8 mt-16">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* New Visitor Chart Section */}
      <VisitorChart />

      {/* Two Columns for Graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Daily Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart width={500} height={300} data={mockSalesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#4caf50" />
            </BarChart>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart width={500} height={300} data={mockDeliveryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#2196f3" />
            </BarChart>
          </CardContent>
        </Card>
      </div>

      {/* Existing Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="mb-4 shadow-lg rounded-lg overflow-hidden">
          <CardHeader>
            <CardTitle>Net Income</CardTitle>
          </CardHeader>
          <CardContent>
            <h2 className="text-2xl font-semibold">GH₵{totalSales.toFixed(2)}</h2>
            <LineChart width={500} height={300} data={netIncomeData} style={{ borderRadius: '10px' }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="netIncome" stroke="#ff7300" strokeWidth={2} />
            </LineChart>
          </CardContent>
        </Card>

        <Card className="mb-4 shadow-lg rounded-lg overflow-hidden">
          <CardHeader>
            <CardTitle>Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <h2 className="text-2xl font-semibold">{totalOrders}</h2>
          </CardContent>
        </Card>

        <Card className="mb-4 shadow-lg rounded-lg overflow-hidden">
          <CardHeader>
            <CardTitle>Average Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <h2 className="text-2xl font-semibold">GH₵{averageOrderValue.toFixed(2)}</h2>
          </CardContent>
        </Card>

        <Card className="mb-4 col-span-2 shadow-lg rounded-lg overflow-hidden">
          <CardHeader>
            <CardTitle>Most Selling Restaurant</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Restaurant ID: 12345</p> {/* Replace with actual restaurant details */}
          </CardContent>
        </Card>

        <Card className="mb-4 col-span-2 shadow-lg rounded-lg overflow-hidden">
          <CardHeader>
            <CardTitle>Most Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Restaurant ID: 67890</p> {/* Replace with actual restaurant details */}
          </CardContent>
        </Card>

        <Card className="mb-4 col-span-2 shadow-lg rounded-lg overflow-hidden">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="border border-gray-300 rounded-lg p-4">
              <li className="border-b py-2">
                <p>Order Number: 001</p>
                <p>Customer: John Doe</p>
                <p>Status: Completed</p>
                <p>Total Price: GH₵50.00</p>
                <p>Order Date: 2023-10-01</p>
              </li>
              <li className="border-b py-2">
                <p>Order Number: 002</p>
                <p>Customer: Jane Smith</p>
                <p>Status: Completed</p>
                <p>Total Price: GH₵75.00</p>
                <p>Order Date: 2023-10-02</p>
              </li>
              {/* Add more mock transactions as needed */}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Couriers Overview</CardTitle>
          <CardDescription>Current status of all active couriers</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Courier</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead className="w-[300px]">Status</TableHead>
                <TableHead>Latest Order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getCouriersList().map((courier) => (
                <TableRow key={courier.name}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {courier.image ? (
                        <img 
                          src={courier.image.url} 
                          alt={courier.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
                      <span>{courier.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{courier.phoneNumber}</TableCell>
                  <TableCell>{courier.orders.length} orders</TableCell>
                  <TableCell>
                    <div className="flex gap-1 h-1 w-full">
                      {Object.entries(getOrderProgress(courier.orders)).map(([status, isComplete]) => (
                        <div 
                          key={status}
                          className={`flex-1 rounded-full ${
                            isComplete 
                              ? status === 'Received' ? 'bg-blue-500'
                                : status === 'Pickup' ? 'bg-yellow-500'
                                : status === 'OnTheWay' ? 'bg-purple-500'
                                : 'bg-green-500'
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {courier.orders.length > 0 ? (
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        courier.orders[courier.orders.length - 1].orderStatus === 'Delivered' 
                          ? 'bg-green-100 text-green-700'
                          : courier.orders[courier.orders.length - 1].orderStatus === 'OnTheWay'
                          ? 'bg-purple-100 text-purple-700'
                          : courier.orders[courier.orders.length - 1].orderStatus === 'Pickup'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {courier.orders[courier.orders.length - 1].orderStatus}
                      </span>
                    ) : (
                      'No orders'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Active Couriers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {getCouriersList().map((courier) => (
            <Card 
              key={courier.name}
              className="cursor-pointer hover:shadow-lg transition-shadow bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
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
                <p className="text-sm text-gray-500 mt-1">{courier.orders.length} orders</p>
                
                {/* Progress Line */}
                <div className="mt-4 relative">
                  {/* Progress Lines */}
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
      </div>
    </div>
  );
};

export default Overview; 