import type {
    CreateServiceRequestInput,
    Customer,
    ServiceRequest,
} from "@/features/customers/types";

const customers: Customer[] = [
    {
        id: "C-1001",
        name: "Aden Hart",
        email: "aden.hart@example.com",
        phone: "+1 (415) 555-0101",
        status: "Active",
        openRequestCount: 2,
    },
    {
        id: "C-1002",
        name: "Alicia Gomez",
        email: "alicia.gomez@example.com",
        phone: "+1 (415) 555-0102",
        status: "Pending",
        openRequestCount: 1,
    },
    {
        id: "C-1003",
        name: "Marcus Lee",
        email: "marcus.lee@example.com",
        phone: "+1 (415) 555-0103",
        status: "Blocked",
        openRequestCount: 3,
    },
    {
        id: "C-1004",
        name: "Priya Shah",
        email: "priya.shah@example.com",
        phone: "+1 (415) 555-0104",
        status: "Active",
        openRequestCount: 0,
    },
];

const serviceRequests: ServiceRequest[] = [
    {
        id: "SR-101",
        customerId: "C-1001",
        subject: "Update mobile app login issue",
        description: "Customer cannot complete MFA after biometric verification fails on Android devices.",
        priority: "High",
        status: "In Progress",
        createdAt: "2026-09-28T09:15:00.000Z",
    },
    {
        id: "SR-102",
        customerId: "C-1001",
        subject: "Billing discrepancy for June invoice",
        description: "Customer reports an extra charge after a plan downgrade request. Need audit of invoice adjustments.",
        priority: "Medium",
        status: "Open",
        createdAt: "2026-09-30T17:20:00.000Z",
    },
    {
        id: "SR-103",
        customerId: "C-1002",
        subject: "Account recovery assistance",
        description: "Customer needs password reset and a review of recent account activity alerts.",
        priority: "Urgent",
        status: "Open",
        createdAt: "2026-10-01T08:00:00.000Z",
    },
    {
        id: "SR-104",
        customerId: "C-1003",
        subject: "Blocked payment retry",
        description: "Customer payment is blocked after failed address verification. Need a manual review.",
        priority: "High",
        status: "Open",
        createdAt: "2026-09-18T10:30:00.000Z",
    },
    {
        id: "SR-105",
        customerId: "C-1003",
        subject: "Subscription cancellation request",
        description: "Customer wants cancellation and a partial refund because service quality is degraded.",
        priority: "Low",
        status: "Open",
        createdAt: "2026-09-24T16:35:00.000Z",
    },
    {
        id: "SR-106",
        customerId: "C-1003",
        subject: "Missing order confirmation email",
        description: "Customer reports not receiving confirmation after hardware renewal order.",
        priority: "Medium",
        status: "Resolved",
        createdAt: "2026-09-12T13:10:00.000Z",
    },
];

const idempotencyStore = new Map<string, ServiceRequest>();

export function getFilteredCustomers(searchTerm = ""): Customer[] {
    const normalizedTerm = searchTerm.trim().toLowerCase();

    if (!normalizedTerm) {
        return customers;
    }

    return customers.filter((customer) => {
        const customerText = `${customer.name} ${customer.id}`.toLowerCase();
        return customerText.includes(normalizedTerm);
    });
}

export function getCustomerById(customerId: string): Customer | undefined {
    return customers.find((customer) => customer.id === customerId);
}

export function getCustomerRequests(customerId: string): ServiceRequest[] {
    return serviceRequests
        .filter((request) => request.customerId === customerId)
        .sort(
            (left, right) =>
                new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        );
}

export function createServiceRequest(
    customerId: string,
    input: CreateServiceRequestInput,
    idempotencyKey?: string,
): ServiceRequest {
    const customer = getCustomerById(customerId);

    if (!customer) {
        throw new Error("Customer not found.");
    }

    const subject = input.subject.trim();
    const description = input.description.trim();

    if (!subject || !description || !input.priority) {
        throw new Error("Subject, description, and priority are required.");
    }

    const dedupeKey = idempotencyKey ? `${customerId}:${idempotencyKey}` : undefined;

    if (dedupeKey && idempotencyStore.has(dedupeKey)) {
        return idempotencyStore.get(dedupeKey)!;
    }

    const request: ServiceRequest = {
        id: `SR-${Date.now()}`,
        customerId,
        subject,
        description,
        priority: input.priority,
        status: "Open",
        createdAt: new Date().toISOString(),
    };

    serviceRequests.unshift(request);
    customer.openRequestCount += 1;

    if (dedupeKey) {
        idempotencyStore.set(dedupeKey, request);
    }

    return request;
}
