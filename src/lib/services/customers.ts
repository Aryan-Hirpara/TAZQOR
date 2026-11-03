export interface Customer {
  id: string;
  business_id: string;
  name: string;
  shop_name: string;
  contact_person?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  type: 'grocery' | 'hotel' | 'mall' | 'office' | 'pg' | 'school' | 'other';
  billing_address?: string;
  delivery_address?: string;
  city: string;
  district?: string;
  state: string;
  pin?: string;
  lat?: number;
  lng?: number;
  notes?: string;
  status: 'active' | 'archived';
  customer_code?: string;
  total_invoiced: number;
  total_paid: number;
  outstanding: number;
  advance: number;
  created_at: string;
}

// In-memory demo data with realistic cleaning-products retail clients
const DEMO_CUSTOMERS: Customer[] = [
  {
    id: "c1-shreeji",
    business_id: "00000000-0000-0000-0000-000000000001",
    name: "Shreeji Supermarket",
    shop_name: "Shreeji Provision & General Stores",
    contact_person: "Haresh Patel",
    phone: "+91 98250 11223",
    whatsapp: "+91 98250 11223",
    email: "haresh@shreejisuper.in",
    type: "grocery",
    billing_address: "Shop 4, Ground Floor, Shivalik Plaza, IIM Road",
    delivery_address: "Shop 4, Ground Floor, Shivalik Plaza, IIM Road",
    city: "Ahmedabad",
    district: "Ahmedabad",
    state: "Gujarat",
    pin: "380015",
    lat: 23.0225,
    lng: 72.5714,
    notes: "Consistently re-orders 5L floor cleaners every 2 weeks. Prefers delivery on Tuesdays.",
    status: "active",
    customer_code: "CUST-001",
    total_invoiced: 48500.00,
    total_paid: 42000.00,
    outstanding: 6500.00,
    advance: 0.00,
    created_at: "2026-01-10T10:00:00Z",
  },
  {
    id: "c2-pride-hotel",
    business_id: "00000000-0000-0000-0000-000000000001",
    name: "Hotel Pride Plaza",
    shop_name: "Pride Hospitality Group",
    contact_person: "Rohit Verma (Housekeeping Lead)",
    phone: "+91 99090 44556",
    whatsapp: "+91 99090 44556",
    email: "procurement@pridehotel.com",
    type: "hotel",
    billing_address: "Judges Bungalow Road, Bodakdev",
    delivery_address: "Judges Bungalow Road, Bodakdev",
    city: "Ahmedabad",
    district: "Ahmedabad",
    state: "Gujarat",
    pin: "380054",
    lat: 23.0338,
    lng: 72.5073,
    notes: "Large commercial account. Bulk 5L Floor Cleaner, Glass Cleaner and Liquid Hand Wash.",
    status: "active",
    customer_code: "CUST-002",
    total_invoiced: 112400.00,
    total_paid: 95000.00,
    outstanding: 17400.00,
    advance: 0.00,
    created_at: "2026-01-15T14:30:00Z",
  },
  {
    id: "c3-apex-cowork",
    business_id: "00000000-0000-0000-0000-000000000001",
    name: "Apex Co-Working Space",
    shop_name: "Apex Tech Park Facilities",
    contact_person: "Neha Shah",
    phone: "+91 97120 77889",
    whatsapp: "+91 97120 77889",
    email: "facilities@apexwork.in",
    type: "office",
    billing_address: "Tower B, Infocity",
    delivery_address: "Tower B, Infocity",
    city: "Gandhinagar",
    district: "Gandhinagar",
    state: "Gujarat",
    pin: "382010",
    lat: 23.2156,
    lng: 72.6369,
    notes: "Net 15 days payment terms. Requires GST tax invoice for all orders.",
    status: "active",
    customer_code: "CUST-003",
    total_invoiced: 32000.00,
    total_paid: 32000.00,
    outstanding: 0.00,
    advance: 1500.00,
    created_at: "2026-02-01T11:00:00Z",
  },
  {
    id: "c4-radhe-pg",
    business_id: "00000000-0000-0000-0000-000000000001",
    name: "Radhe Krishna PG",
    shop_name: "Radhe PG Accommodations",
    contact_person: "Mahesh Bhai",
    phone: "+91 98790 33445",
    whatsapp: "+91 98790 33445",
    type: "pg",
    billing_address: "Near Navrangpura Bus Stand",
    delivery_address: "Near Navrangpura Bus Stand",
    city: "Ahmedabad",
    district: "Ahmedabad",
    state: "Gujarat",
    pin: "380009",
    lat: 23.0365,
    lng: 72.5611,
    notes: "Buys Toilet Cleaner and Floor Cleaner on 1st of each month. Cash on delivery.",
    status: "active",
    customer_code: "CUST-004",
    total_invoiced: 18200.00,
    total_paid: 14500.00,
    outstanding: 3700.00,
    advance: 0.00,
    created_at: "2026-02-12T09:15:00Z",
  }
];

export async function getCustomers(query?: { search?: string; type?: string; status?: string }): Promise<Customer[]> {
  let list = [...DEMO_CUSTOMERS];

  if (query?.search) {
    const q = query.search.toLowerCase();
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.shop_name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.city.toLowerCase().includes(q) ||
        (c.customer_code && c.customer_code.toLowerCase().includes(q))
    );
  }

  if (query?.type && query.type !== "all") {
    list = list.filter((c) => c.type === query.type);
  }

  if (query?.status && query.status !== "all") {
    list = list.filter((c) => c.status === query.status);
  }

  return list;
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const customer = DEMO_CUSTOMERS.find((c) => c.id === id);
  return customer || null;
}

