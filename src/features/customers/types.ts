export type CustomerStatus = "Active" | "Pending" | "Blocked";
export type ServiceRequestStatus = "Open" | "In Progress" | "Resolved";
export type Priority = "Low" | "Medium" | "High" | "Urgent";

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: CustomerStatus;
    openRequestCount: number;
}

export interface ServiceRequest {
    id: string;
    customerId: string;
    subject: string;
    description: string;
    priority: Priority;
    status: ServiceRequestStatus;
    createdAt: string;
}

export interface CreateServiceRequestInput {
    subject: string;
    description: string;
    priority: Priority;
}
