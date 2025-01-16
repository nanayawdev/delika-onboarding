import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { DollarSign } from "lucide-react";

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

const DashboardOverview: React.FC = () => {
  return (
    <div className="container mx-auto p-6 mt-10">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₵{mockSalesData.reduce((acc, item) => acc + item.total, 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart width={400} height={200} data={mockSalesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#8884d8" />
            </BarChart>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart width={400} height={200} data={mockDeliveryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#82ca9d" />
            </LineChart>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <p className="text-sm">Top Sales: Johnathan Doe</p>
              <p className="text-sm">Best Seller: MaterialPro Admin</p>
              <p className="text-sm">Most Commented: Ample Admin</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview; 