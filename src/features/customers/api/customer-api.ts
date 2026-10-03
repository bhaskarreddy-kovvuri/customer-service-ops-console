import type {
    CreateServiceRequestInput,
    Customer,
    ServiceRequest,
} from "@/features/customers/types";

async function parseJson<T>(response: Response): Promise<T> {
    const payload = (await response.json().catch(() => null)) as T | null;

    if (!response.ok) {
        const errorMessage =
            typeof payload === "object" && payload && "error" in payload
                ? String((payload as { error?: string }).error)
                : "The request could not be completed.";

        throw new Error(errorMessage);
    }

    return payload as T;
}

export async function fetchCustomers(search = ""): Promise<Customer[]> {
    const params = new URLSearchParams();

    if (search.trim()) {
        params.set("search", search.trim());
    }

    const url = `/api/customers${params.size > 0 ? `?${params.toString()}` : ""}`;
    const response = await fetch(url, { cache: "no-store" });

    return parseJson<Customer[]>(response);
}

export async function fetchCustomerDetail(customerId: string): Promise<Customer> {
    const response = await fetch(`/api/customers/${customerId}`, { cache: "no-store" });

    return parseJson<Customer>(response);
}

export async function fetchCustomerRequests(customerId: string): Promise<ServiceRequest[]> {
    const response = await fetch(`/api/customers/${customerId}/requests`, {
        cache: "no-store",
    });

    return parseJson<ServiceRequest[]>(response);
}

export async function createCustomerRequest(
    customerId: string,
    details: CreateServiceRequestInput,
): Promise<ServiceRequest> {
    const response = await fetch(`/api/customers/${customerId}/requests`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify(details),
    });

    return parseJson<ServiceRequest>(response);
}
