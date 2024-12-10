// app/api/broker/create-account/route.ts
import { NextResponse } from "next/server";
import axios from "axios";

const API_GATEWAY_URL =
  "https://m043hg2via.execute-api.sa-east-1.amazonaws.com/prod/test";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("Payload recebido:", payload);

    const response = await axios.post(
      API_GATEWAY_URL,
      {
        ...payload,
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
    console.error("Erro detalhado:", {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Falha ao criar conta na corretora",
        details: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
