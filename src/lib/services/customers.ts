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

export async function getCustomers(query?: { search?: string; type?: string; status?: string }): Promise<Customer[]> {
  try {
    const supabase = createClient();
    let dbQuery = supabase.from("customers").select("*").order("created_at", { ascending: false });

    if (query?.type && query.type !== "all") {
      dbQuery = dbQuery.eq("type", query.type as any);
    }
    if (query?.status && query.status !== "all") {
      dbQuery = dbQuery.eq("status", query.status);
    } else {
      dbQuery = dbQuery.neq("status", "archived");
    }

    const [{ data: customersData, error: custErr }, { data: balancesData }] = await Promise.all([
      dbQuery,
      supabase.from("v_customer_balances").select("customer_id, total_invoiced, total_payments, outstanding, advance"),
    ]);

    if (!custErr && customersData && customersData.length > 0) {
      const balMap = new Map<string, any>();
      for (const b of (balancesData || [])) {
        balMap.set(b.customer_id, b);
      }

      let list: Customer[] = customersData.map((row: any) => {
        const bal = balMap.get(row.id);
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
          city: row.city || undefined,
          district: row.district || undefined,
          state: row.state || undefined,
          pin: row.pin || undefined,
          lat: row.lat || undefined,
          lng: row.lng || undefined,
          notes: row.notes || undefined,
          status: row.status === "archived" ? "archived" : "active",
          customer_code: row.customer_code || undefined,
          total_invoiced: Number(bal?.total_invoiced) || 0,
          total_paid: Number(bal?.total_payments) || 0,
          outstanding: Number(bal?.outstanding) || 0,
          advance: Number(bal?.advance) || 0,
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
            (c.city || "").toLowerCase().includes(q)
        );
      }
      return list;
    }
  } catch (err) {
    console.warn("Supabase customer fetch error:", err);
  }

  return [];
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  if (isUUID) {
    try {
      const supabase = createClient();
      const [{ data, error }, { data: balData }] = await Promise.all([
        supabase.from("customers").select("*").eq("id", id).maybeSingle(),
        supabase.from("v_customer_balances").select("total_invoiced, total_payments, outstanding, advance").eq("customer_id", id).maybeSingle(),
      ]);

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
          city: data.city || undefined,
          district: data.district || undefined,
          state: data.state || undefined,
          pin: data.pin || undefined,
          lat: data.lat || undefined,
          lng: data.lng || undefined,
          notes: data.notes || undefined,
          status: data.status === "archived" ? "archived" : "active",
          customer_code: data.customer_code || undefined,
          total_invoiced: Number(balData?.total_invoiced) || 0,
          total_paid: Number(balData?.total_payments) || 0,
          outstanding: Number(balData?.outstanding) || 0,
          advance: Number(balData?.advance) || 0,
          created_at: data.created_at,
        };
      }
    } catch (err) {
      console.warn("Supabase getCustomerById fallback:", err);
    }
  }

  return null;
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
    city: data.city || null,
    district: data.district || null,
    state: data.state || null,
    pin: data.pin || null,
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
    city: created.city || undefined,
    state: created.state || undefined,
    status: "active",
    total_invoiced: 0,
    total_paid: 0,
    outstanding: 0,
    advance: 0,
    created_at: created.created_at,
  };
}

export async function deleteCustomer(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("customers")
      .update({ status: "archived" })
      .eq("id", id)
      .select("id");

    if (error) {
      console.error("Supabase deleteCustomer error:", error);
      return { success: false, error: error.message };
    }
    if (!data || data.length === 0) {
      return { success: false, error: "Customer not found or could not be archived." };
    }
    return { success: true };
  } catch (err: any) {
    console.error("deleteCustomer exception:", err);
    return { success: false, error: err?.message || "Unknown error" };
  }
}
