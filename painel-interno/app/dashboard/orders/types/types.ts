export type OrderProduct = {
  id: string;
  name: string;
  image: string;
};

export type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  product: OrderProduct;
};

export type OrderCustomer = {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone?: string | null;
};

export type OrderAddress = {
  id: string;
  name: string;
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  city: string;
  state: string;
  zipCode: string;
};

export type OrderPayment = {
  id: string;
  method: string;
  status: string;
  amount: number;
  providerId?: string | null;
};

export type Order = {
  id: string;
  subtotal: number;
  shippingPrice: number;
  total: number;
  shippingName?: string | null;
  shippingMethod?: string | null;
  shippingDeadline?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  customer: OrderCustomer;
  address?: OrderAddress | null;
  payment?: OrderPayment | null;
  items: OrderItem[];
};
