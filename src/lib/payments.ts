import { supabase } from "./supabase";

export interface PixPaymentResult {
  payment_id: string;
  pix_code: string;
  qr_code: string;
  expires_at: string;
  amount: number;
  plan_name: string;
  plan_id: string;
}

export interface PaymentWithUser {
  id: string;
  user_id: string;
  plan: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  pix_code?: string;
  pix_key?: string;
  created_at: string;
  approved_at?: string;
  user_name?: string;
  user_email?: string;
}

export interface PlanFromDB {
  id: string;
  name: string;
  price: number;
  features?: string;
  duration_days?: number;
}

export async function createPixPayment(
  planId: string,
  userId: string,
  _amount: number
): Promise<PixPaymentResult> {
  try {
    const { data: planData, error: planError } = await supabase
      .from("plans")
      .select("id, name, price")
      .eq("id", planId)
      .maybeSingle();

    if (planError) throw planError;

    const planNameDB = planData?.name?.toLowerCase().trim() || planId.toLowerCase();
    const amount = planData?.price || _amount;

    const planValue = planNameDB === "básico" ? "basico" : planNameDB;
    const planNameDisplay = planData?.name || planId;

    const pixCode = generatePixCode(amount, planNameDisplay);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        plan: planValue,
        amount: amount,
        status: "pending",
        pix_code: pixCode,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      payment_id: data.id,
      pix_code: pixCode,
      qr_code: pixCode,
      expires_at: expiresAt,
      amount: amount,
      plan_name: planNameDisplay,
      plan_id: planValue,
    };
  } catch (error: any) {
    console.error("Error creating pix payment:", error);
    throw new Error(error.message || "Erro ao criar pagamento");
  }
}

export async function getPlansFromDB(): Promise<PlanFromDB[]> {
  const { data, error } = await supabase
    .from("plans")
    .select("id, name, price, features, duration_days")
    .order("price", { ascending: true });

  if (error) throw error;
  return data || [];
}

function generatePixCode(amount: number, planName: string): string {
  const amountStr = String(Math.floor(amount * 100)).padStart(10, "0");
  return `00020126580014BR.GOV.BCB.PIX0126vsfitgym@gmail.com520400005303986540${amountStr}5802BR5913VSFIT GYM6009SAO PAULO62070503***6304`;
}

export async function confirmPayment(
  paymentId: string,
  trainerId: string
): Promise<{ success: boolean; subscription_id?: string; end_date?: string }> {
  try {
    const { data: payment, error: fetchError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (fetchError || !payment) {
      throw new Error("Pagamento não encontrado");
    }

    if (payment.status !== "pending") {
      throw new Error("Pagamento não está pendente");
    }

    const { error: updateError } = await supabase
      .from("payments")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", paymentId);

    if (updateError) throw updateError;

    const newEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", payment.user_id)
      .eq("status", "active")
      .maybeSingle();

    if (existingSub) {
      await supabase
        .from("subscriptions")
        .update({
          plan: payment.plan,
          start_date: new Date().toISOString(),
          end_date: newEndDate,
        })
        .eq("id", existingSub.id);
    } else {
      await supabase
        .from("subscriptions")
        .insert({
          user_id: payment.user_id,
          plan: payment.plan,
          status: "active",
          start_date: new Date().toISOString(),
          end_date: newEndDate,
        });
    }

    return { success: true, end_date: newEndDate };
  } catch (error: any) {
    console.error("Error confirming payment:", error);
    throw new Error(error.message || "Erro ao confirmar pagamento");
  }
}

export async function rejectPayment(paymentId: string): Promise<void> {
  const { error } = await supabase
    .from("payments")
    .update({ status: "rejected" })
    .eq("id", paymentId);

  if (error) throw error;
}

export async function getPendingPayments(): Promise<PaymentWithUser[]> {
  const { data: payments, error } = await supabase
    .from("payments")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching pending payments:", error);
    throw new Error(error.message);
  }

  if (!payments || payments.length === 0) return [];

  const userIds = [...new Set(payments.map(p => p.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);

  const profileMap = new Map(profiles?.map(p => [p.id, { name: p.full_name, email: p.email }]) || []);

  return payments.map(p => ({
    ...p,
    user_name: profileMap.get(p.user_id)?.name,
    user_email: profileMap.get(p.user_id)?.email,
  }));
}

export async function getAllPayments(): Promise<PaymentWithUser[]> {
  const { data: payments, error } = await supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching payments:", error);
    throw new Error(error.message);
  }

  if (!payments || payments.length === 0) return [];

  const userIds = [...new Set(payments.map(p => p.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);

  const profileMap = new Map(profiles?.map(p => [p.id, { name: p.full_name, email: p.email }]) || []);

  return payments.map(p => ({
    ...p,
    user_name: profileMap.get(p.user_id)?.name,
    user_email: profileMap.get(p.user_id)?.email,
  }));
}

export async function getUserActiveSubscription(userId: string) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .gt("end_date", new Date().toISOString())
    .maybeSingle();

  if (error) {
    console.error("Error fetching subscription:", error);
    return null;
  }

  return data;
}

export async function subscribeToPaymentUpdates(
  paymentId: string,
  callback: (payload: any) => void
) {
  const channel = supabase
    .channel(`payment-${paymentId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "payments",
        filter: `id=eq.${paymentId}`,
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function subscribeToUserSubscription(
  userId: string,
  callback: (payload: any) => void
) {
  const channel = supabase
    .channel(`subscription-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "subscriptions",
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}