import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log("Next.js API Route Forwarding Body:", JSON.stringify(body));

        const response = await fetch(`${BACKEND_URL}/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Backend error:", errorText);
            return new Response(
                JSON.stringify({ error: "Backend request failed" }),
                { status: response.status, headers: { "Content-Type": "application/json" } }
            );
        }

        // Stream the response from backend to frontend
        const contentType = response.headers.get("Content-Type") || "text/plain; charset=utf-8";

        return new Response(response.body, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Transfer-Encoding": "chunked",
            },
        });
    } catch (error) {
        console.error("API route error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to connect to backend" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
