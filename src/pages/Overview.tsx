"use client"

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
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
    </div>
  );
};

export default Overview; 