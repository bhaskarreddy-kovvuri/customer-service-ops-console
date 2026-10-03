import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CustomerConsole } from "@/features/customers/ui/customer-console";
import { fetchCustomers } from "@/features/customers/api/customer-api";

const mockCustomerList = [
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
];

const mockRequests = [
    {
        id: "SR-101",
        customerId: "C-1001",
        subject: "Update mobile app login issue",
        description: "Customer cannot complete MFA after biometric verification fails on Android devices.",
        priority: "High",
        status: "In Progress",
        createdAt: "2026-09-28T09:15:00.000Z",
    },
];

vi.mock("@/features/customers/api/customer-api", () => ({
    fetchCustomers: vi.fn(async (search = "") => {
        if (!search) {
            return mockCustomerList;
        }

        return mockCustomerList.filter(
            (customer) =>
                customer.id.toLowerCase().includes(search.toLowerCase()) ||
                customer.name.toLowerCase().includes(search.toLowerCase()),
        );
    }),
    fetchCustomerDetail: vi.fn(async (customerId: string) =>
        mockCustomerList.find((customer) => customer.id === customerId) ?? mockCustomerList[0],
    ),
    fetchCustomerRequests: vi.fn(async (customerId: string) =>
        customerId === "C-1001" ? mockRequests : [],
    ),
    createCustomerRequest: vi.fn(async (customerId: string, payload: { subject: string }) => ({
        id: `SR-${Date.now()}`,
        customerId,
        subject: payload.subject,
        description: "Injected during test",
        priority: "Medium",
        status: "Open",
        createdAt: new Date().toISOString(),
    })),
}));

describe("CustomerConsole", () => {
    it("debounces the search request and filters customers by name or ID", async () => {
        const user = userEvent.setup();

        render(<CustomerConsole />);

        expect(
            await screen.findByRole("heading", { name: /customer service console/i }),
        ).toBeInTheDocument();

        const searchInput = screen.getByLabelText(/search by customer name or id/i);
        await user.type(searchInput, "C-1002");

        await waitFor(
            () => {
                expect(fetchCustomers).toHaveBeenLastCalledWith("C-1002");
            },
            { timeout: 2000 },
        );
    });

    it("keeps the selected customer details visible when search retains that customer", async () => {
        const user = userEvent.setup();

        render(<CustomerConsole />);

        expect(await screen.findByRole("heading", { name: "Aden Hart" })).toBeInTheDocument();

        await user.type(screen.getByLabelText(/search by customer name or id/i), "Aden");

        await waitFor(() => {
            expect(screen.queryByRole("button", { name: /Alicia Gomez/ })).not.toBeInTheDocument();
        });

        expect(screen.getByRole("heading", { name: "Aden Hart" })).toBeInTheDocument();
    });
});
