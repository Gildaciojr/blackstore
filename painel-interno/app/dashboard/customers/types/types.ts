export type CustomerOrder = {
  id: string;
  total: number;
  status: string;
  createdAt: string;
};

export type Address = {
  street: string;
  number: string;
  city: string;
  state: string;
  zipCode: string;
};

export type Customer = {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone?: string | null;
  createdAt: string;

  orders: CustomerOrder[];
  addresses: Address[];

  ordersCount?: number;
  totalSpent?: number;
};