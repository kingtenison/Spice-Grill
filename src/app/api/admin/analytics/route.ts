import { getServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function GET() {
  const db = getServiceClient();
  
  const { data: orders, error } = await db
    .from("orders")
    .select(`total_amount, created_at, status, payment_status`)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) ?? 0;
  const totalOrders = orders?.length ?? 0;
  const completedOrders = orders?.filter(o => o.status === 'delivered').length ?? 0;

  // Simple daily breakdown for last 7 days
  const ordersByDay = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStr = date.toISOString().split('T')[0];
    
    const dayOrders = orders?.filter(o => o.created_at.startsWith(dayStr)) || [];
    const revenue = dayOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    
    return {
      date: dayStr,
      revenue: Math.round(revenue * 100) / 100,
      orders: dayOrders.length
    };
  }).reverse();

  return NextResponse.json({
    totalRevenue,
    totalOrders,
    completedOrders,
    ordersByDay,
    recentOrders: orders?.slice(0, 10) ?? [],
  });
}