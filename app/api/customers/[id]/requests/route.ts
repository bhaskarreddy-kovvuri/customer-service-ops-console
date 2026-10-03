import { NextResponse } from "next/server";
import { createServiceRequest, getCustomerRequests } from "@/features/customers/api/mock-data";

export async function GET(
    _request: Request,
    context: { params: Promise<{ id: string }> },
) {
    const { id } = await context.params;
    const requests = getCustomerRequests(id);

    return NextResponse.json(requests);
}

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> },
) {
    const { id } = await context.params;

    try {
        const body = (await request.json()) as {
            subject?: string;
            description?: string;
            priority?: "Low" | "Medium" | "High" | "Urgent";
        };

        const idempotencyKey = request.headers.get("Idempotency-Key") ?? undefined;

        const createdRequest = createServiceRequest(
            id,
            {
                subject: body.subject ?? "",
                description: body.description ?? "",
                priority: body.priority ?? "Medium",
            },
            idempotencyKey,
        );

        return NextResponse.json(createdRequest, { status: 201 });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unable to create the service request.";

        return NextResponse.json({ error: message }, { status: 400 });
    }
}
