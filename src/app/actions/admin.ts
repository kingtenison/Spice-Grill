import { createClient } from "@/lib/supabase/server";

// Dashboard stats
export async function getDashboardStats() {
  const supabase = await createClient();
  
  const [{ count: orderCount }, { count: customerCount }, { data: recentOrders }] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("orders").select(`*, profiles!inner(full_name)`).order("created_at", { ascending: false }).limit(10)
  ]);

  return {
    totalOrders: orderCount ?? 0,
    totalCustomers: customerCount ?? 0,
    recentOrders: recentOrders ?? [],
  };
}

// Orders CRUD
export async function getOrders() {
  const supabase = await createClient();
  const { data: orders } = await supabase.from("orders").select(`*, profiles!inner(full_name)`).order("created_at", { ascending: false });
  return orders ?? [];
}

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (error) throw error;
}

// Menu CRUD
export async function getMenuItems() {
  const supabase = await createClient();
  const { data: items } = await supabase.from("menu_items").select(`*, categories(name)`).order("created_at");
  return items ?? [];
}

export async function createMenuItem(data: {
  name: string;
  description: string;
  price: number;
  category_id?: string;
  image_url?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").insert([data]);
  if (error) throw error;
}

interface MenuItemUpdate {
  name?: string;
  description?: string;
  price?: number;
  category_id?: string;
  image_url?: string;
  is_available?: boolean;
  stock_quantity?: number;
}

export async function updateMenuItem(id: string, data: MenuItemUpdate) {
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").update(data).eq("id", id);
  if (error) throw error;
}

export async function deleteMenuItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) throw error;
}

// Blog CRUD
export async function getBlogPosts() {
  // Note: blogs table needs to be created in database
  const supabase = await createClient();
  const { data: posts } = await supabase.from("blogs").select("*").order("created_at", { ascending: false });
  return posts ?? [];
}

// Reviews
export async function getReviews() {
  const supabase = await createClient();
  const { data: reviews } = await supabase.from("reviews").select(`*, profiles!inner(full_name)`).eq("is_published", true).order("created_at", { ascending: false });
  return reviews ?? [];
}

// Customers
export async function getCustomers() {
  const supabase = await createClient();
  const { data: customers } = await supabase.from("profiles").select("*").eq("role", "customer").order("created_at", { ascending: false });
  return customers ?? [];
}

// Analytics - aggregated data
export async function getAnalytics(startDate?: string, endDate?: string) {
  const supabase = await createClient();
  
  let query = supabase.from("orders").select(`total_amount, created_at, status`).order("created_at", { ascending: false });
  
  if (startDate) query = query.gte("created_at", startDate);
  if (endDate) query = query.lte("created_at", endDate);
  
  const { data: orders } = await query;
  
  return {
    orders: orders ?? [],
    totalRevenue: orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) ?? 0,
    totalOrders: orders?.length ?? 0,
  };
}