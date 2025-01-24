export interface Restaurant {
  id: string;
  restaurantName: string;
  restaurantEmail: string;
  restaurantPhoneNumber: string;
  restaurantAddress: string;
  restaurantLogo: {
    url: string;
    name: string;
    access: string;
    path: string;
    type: string;
    size: number;
    mime: string;
    meta: {
      width: number;
      height: number;
    };
  };
  created_at: number;
}

export interface Branch {
  id: string;
  created_at: number;
  branchName: string;
  restaurantID: string;
  branchLocation: string;
  branchPhoneNumber: string;
  branchCity: string;
  branchLongitude: string;
  branchLatitude: string;
  _restaurantTable: Restaurant[];
}

export interface OrderProduct {
  name: string;
  price: number;
  quantity: number;
  image: string | null;
}

export interface OrderLocation {
  fromLatitude?: number;
  fromLongitude?: number;
  fromAddress?: string;
  toLatitude?: number;
  toLongitude?: number;
  toAddress?: string;
}

export interface Order {
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
  orderStatus: 'Assigned' | 'Pickup' | 'OnTheWay' | 'Delivered' | string;
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
  [key: string]: any;
}

export interface Food {
  name: string;
  price: number;
  description: string;
  foodImage?: {
    url: string;
  };
}

export interface MenuType {
  foodType: string;
  foodTypeImage: {
    url: string;
  };
  restaurantName: string;
  branchName: string;
  foods: Food[];
  foodImage?: {
    url: string;
  };
  name?: string;
  description?: string;
  price?: number;
}

export interface Courier {
  name: string;
  image?: { url: string };
  phoneNumber: string;
  orders: Order[];
}

export interface OrderProgress {
  Assigned: boolean;
  Pickup: boolean;
  OnTheWay: boolean;
  Delivered: boolean;
  [key: string]: boolean;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  branchId?: string;
  image?: {
    url: string;
  };
}

export interface PaginatedOrders {
  orders: Order[];
  totalPages: number;
} 