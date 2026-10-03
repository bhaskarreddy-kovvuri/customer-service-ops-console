import { NextResponse } from "next/server";
import { getFilteredCustomers } from "@/features/customers/api/mock-data";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get("search") ?? "";

    return NextResponse.json(getFilteredCustomers(searchTerm));
}
