import { NextResponse } from "next/server";
import { getCustomerById } from "@/features/customers/api/mock-data";

export async function GET(
    _request: Request,
    context: { params: Promise<{ id: string }> },
) {
    const { id } = await context.params;
    const customer = getCustomerById(id);

    if (!customer) {
        return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    return NextResponse.json(customer);
}
