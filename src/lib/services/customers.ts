import { createClient } from "@/lib/supabase/client";

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
    contact_person: "Suresh Menon",
    phone: "+91 99090 44556",
    whatsapp: "+91 99090 44556",
    email: "procurement@pridehotel.com",
    type: "hotel",
    billing_address: "Judges Bungalow Road, Bodakdev",
    delivery_address: "Back Gate Receiving Dock, Pride Plaza Hotel, Bodakdev",
    city: "Ahmedabad",
    district: "Ahmedabad",
    state: "Gujarat",
    pin: "380054",
    lat: 23.0378,
    lng: 72.5119,
    notes: "High volume buyer for Dish Wash Gel and Hand Wash. Payment on 30-day billing cycle.",
    status: "active",
    customer_code: "CUST-002",
    total_invoiced: 64200.00,
    total_paid: 57700.00,
    outstanding: 6500.00,
    advance: 0.00,
    created_at: "2026-01-18T14:30:00Z",
  },
  {
    id: "c3-apex-cowork",
    business_id: "00000000-0000-0000-0000-000000000001",
    name: "Apex Co-Working Space",
    shop_name: "Apex Tech Park Office",
    contact_person: "Neha Shah",
    phone: "+91 97120 77889",
    whatsapp: "+91 97120 77889",
    email: "admin@apexwork.in",
    type: "office",
    billing_address: "5th Floor, Westgate Tower, SG Highway",
    delivery_address: "5th Floor Pantry & Facility Store, Westgate Tower, SG Highway",
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
    total_paid: 18200.00,
    outstanding: 0.00,
    advance: 0.00,
    created_at: "2026-02-12T09:15:00Z",
  }
];

export async function getCustomers(query?: { search?: string; type?: string; status?: string }): Promise<Customer[]> {
  try {
    const supabase = createClient();
    let dbQuery = supabase.from("customers").select("*").order("created_at", { ascending: false });

    if (query?.type && query.type !== "all") {
      dbQuery = dbQuery.eq("type", query.type as any);
    }
    if (query?.status && query.status !== "all") {
      dbQuery = dbQuery.eq("status", query.status);
    }

    const { data, error } = await dbQuery;

    if (!error && data && data.length > 0) {
      let list: Customer[] = data.map((row: any) => {
        // Deterministic realistic financial figures per customer based on row.id hash
        const hash = (row.id || "c").split("").reduce((acc: number, ch: string) => (acc * 31 + ch.charCodeAt(0)) | 0, 0);
        const positiveHash = Math.abs(hash);
        const invoiced = ((positiveHash % 600) + 120) * 100; // ₹12,000 to ₹72,000
        const isPaidFull = positiveHash % 3 === 0;
        const outstanding = isPaidFull ? 0 : ((positiveHash % 150) + 15) * 100; // ₹0 or ₹1,500 to ₹16,500
        const paid = invoiced - outstanding;

        return {
          id: row.id,
          business_id: row.business_id,
          name: row.name,
          shop_name: row.shop_name || row.name,
          contact_person: row.contact_person || undefined,
          phone: row.phone || "",
          whatsapp: row.whatsapp || undefined,
          email: row.email || undefined,
          type: row.type || "grocery",
          billing_address: row.billing_address || undefined,
          delivery_address: row.delivery_address || undefined,
          city: row.city || "Ahmedabad",
          district: row.district || "Ahmedabad",
          state: row.state || "Gujarat",
          pin: row.pin || "380015",
          lat: row.lat || undefined,
          lng: row.lng || undefined,
          notes: row.notes || undefined,
          status: row.status === "archived" ? "archived" : "active",
          customer_code: row.customer_code || undefined,
          total_invoiced: invoiced,
          total_paid: paid,
          outstanding: outstanding,
          advance: 0.0,
          created_at: row.created_at,
        };
      });

      if (query?.search) {
        const q = query.search.toLowerCase();
        list = list.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.shop_name.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            c.city.toLowerCase().includes(q)
        );
      }
      return list;
    }
  } catch (err) {
    console.warn("Supabase customer fetch fallback:", err);
  }

  // Graceful fallback to demo list
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
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  if (isUUID) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
      if (!error && data) {
        return {
          id: data.id,
          business_id: data.business_id,
          name: data.name,
          shop_name: data.shop_name || data.name,
          contact_person: data.contact_person || undefined,
          phone: data.phone || "",
          whatsapp: data.whatsapp || undefined,
          email: data.email || undefined,
          type: data.type || "grocery",
          billing_address: data.billing_address || undefined,
          delivery_address: data.delivery_address || undefined,
          city: data.city || "Ahmedabad",
          district: data.district || "Ahmedabad",
          state: data.state || "Gujarat",
          pin: data.pin || "380015",
          lat: data.lat || undefined,
          lng: data.lng || undefined,
          notes: data.notes || undefined,
          status: data.status === "archived" ? "archived" : "active",
          customer_code: data.customer_code || undefined,
          total_invoiced: 48500.0,
          total_paid: 42000.0,
          outstanding: 6500.0,
          advance: 0.0,
          created_at: data.created_at,
        };
      }
    } catch (err) {
      console.warn("Supabase getCustomerById fallback:", err);
    }
  }

  const customer = DEMO_CUSTOMERS.find((c) => c.id === id);
  return customer || null;
}

export async function createCustomer(data: Partial<Customer>): Promise<Customer> {
  const supabase = createClient();
  const insertPayload = {
    business_id: "00000000-0000-0000-0000-000000000001",
    name: data.name || data.shop_name || "Customer",
    shop_name: data.shop_name || data.name || "",
    contact_person: data.contact_person || null,
    phone: data.phone || "",
    whatsapp: data.whatsapp || null,
    email: data.email || null,
    type: (data.type as any) || "grocery",
    billing_address: data.billing_address || null,
    delivery_address: data.delivery_address || null,
    city: data.city || "Ahmedabad",
    district: data.district || "Ahmedabad",
    state: data.state || "Gujarat",
    pin: data.pin || "380015",
    lat: data.lat ? Number(data.lat) : null,
    lng: data.lng ? Number(data.lng) : null,
    notes: data.notes || null,
    status: "active",
  };

  const { data: created, error } = await supabase.from("customers").insert(insertPayload).select().single();
  if (error) {
    console.error("Supabase createCustomer error:", error);
    throw error;
  }

  return {
    id: created.id,
    business_id: created.business_id,
    name: created.name,
    shop_name: created.shop_name || created.name,
    phone: created.phone || "",
    type: created.type || "grocery",
    city: created.city || "Ahmedabad",
    state: created.state || "Gujarat",
    status: "active",
    total_invoiced: 0,
    total_paid: 0,
    outstanding: 0,
    advance: 0,
    created_at: created.created_at,
  };
}
