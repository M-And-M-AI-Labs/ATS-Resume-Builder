/**
 * POST /api/razorpay/webhook
 * Handle Razorpay payment webhooks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);

    const supabase = await createClient();

    // Handle subscription events
    if (event.event === 'subscription.activated' || event.event === 'subscription.charged') {
      const subscription = event.payload.subscription.entity;
      const customerId = subscription.customer_id;

      // Find user by Razorpay customer ID
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('razorpay_customer_id', customerId)
        .single();

      if (user) {
        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

        await supabase
          .from('users')
          .update({
            plan: 'pro',
            max_resumes_per_period: 500,
            resumes_generated_this_period: 0,
            billing_period_start: now.toISOString(),
            billing_period_end: periodEnd.toISOString(),
          })
          .eq('id', user.id);
      }
    }

    if (event.event === 'subscription.cancelled') {
      const subscription = event.payload.subscription.entity;
      const customerId = subscription.customer_id;

      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('razorpay_customer_id', customerId)
        .single();

      if (user) {
        await supabase
          .from('users')
          .update({
            plan: 'free',
            max_resumes_per_period: 0,
          })
          .eq('id', user.id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

