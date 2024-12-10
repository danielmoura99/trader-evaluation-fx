// app/api/broker/cancel-account/route.ts
import { NextResponse } from "next/server";
import axios from "axios";

const API_GATEWAY_URL =
  "https://m043hg2via.execute-api.sa-east-1.amazonaws.com/prod/test";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("Payload de cancelamento recebido:", payload);

    const response = await axios.post(
      API_GATEWAY_URL,
      {
        request: "prop_trading_cancel_user_subscription",
        document: payload.document,
        subscriptionPlanId: payload.subscriptionPlanId,
        testAccount: payload.testAccount,
        authenticationCode: "2B295526980F475BA2A608C8C1C4F8DF",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Resposta do proxy:", response.data);
    return NextResponse.json(response.data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Erro ao cancelar conta:", error.response?.data || error);
    return NextResponse.json(
      {
        success: false,
        error: "Falha ao cancelar conta na corretora",
        details: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
