// app/api/broker/test/route.ts
import { NextResponse } from "next/server";
import axios from "axios";

const API_GATEWAY_URL =
  "https://m043hg2via.execute-api.sa-east-1.amazonaws.com/prod/test";

export async function GET() {
  try {
    console.log("Iniciando teste de IP...");
    console.log("Fazendo requisição para:", API_GATEWAY_URL);

    const response = await axios.get(API_GATEWAY_URL);

    console.log("Resposta do Lambda:", response.data);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      proxyResponse: response.data,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Erro no teste:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Falha no teste de IP",
        details: error.response?.data || error.message,
        timestamp: new Date().toISOString(),
      },
      {
        status: error.response?.status || 500,
      }
    );
  }
}
