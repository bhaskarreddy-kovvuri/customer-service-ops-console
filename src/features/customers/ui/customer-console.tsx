"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
    createCustomerRequest,
    fetchCustomerDetail,
    fetchCustomerRequests,
    fetchCustomers,
} from "@/features/customers/api/customer-api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type {
    CreateServiceRequestInput,
    Customer,
    Priority,
    ServiceRequest,
} from "@/features/customers/types";

const initialForm: CreateServiceRequestInput = {
    subject: "",
    description: "",
    priority: "Medium",
};

const priorityStyles: Record<Priority, string> = {
    Low: "priority-low",
    Medium: "priority-medium",
    High: "priority-high",
    Urgent: "priority-urgent",
};

export function CustomerConsole() {
    const [searchTerm, setSearchTerm] = useState("");
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(true);
    const [loadingCustomerDetail, setLoadingCustomerDetail] = useState(false);
    const [listError, setListError] = useState<string | null>(null);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [formState, setFormState] = useState<CreateServiceRequestInput>(initialForm);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
    const selectedCustomerIdRef = useRef<string | null>(null);

    useEffect(() => {
        selectedCustomerIdRef.current = selectedCustomerId;
    }, [selectedCustomerId]);

    useEffect(() => {
        let ignore = false;

        async function loadCustomers() {
            setLoadingCustomers(true);
            setListError(null);

            try {
                const data = await fetchCustomers(debouncedSearchTerm);

                if (ignore) {
                    return;
                }

                setCustomers(data);

                if (!data.length) {
                    setSelectedCustomerId(null);
                    setSelectedCustomer(null);
                    setServiceRequests([]);
                    return;
                }

                const currentSelectedId = selectedCustomerIdRef.current;
                let nextCustomerId = data[0].id;

                if (currentSelectedId && data.some((customer) => customer.id === currentSelectedId)) {
                    nextCustomerId = currentSelectedId;
                }

                setSelectedCustomerId(nextCustomerId);

                if (nextCustomerId !== currentSelectedId) {
                    setSelectedCustomer(null);
                    setServiceRequests([]);
                }
            } catch (error) {
                if (!ignore) {
                    setListError(
                        error instanceof Error
                            ? error.message
                            : "Unable to load customers at the moment.",
                    );
                }
            } finally {
                if (!ignore) {
                    setLoadingCustomers(false);
                }
            }
        }

        loadCustomers();

        return () => {
            ignore = true;
        };
    }, [debouncedSearchTerm]);

    useEffect(() => {
        const customerId = selectedCustomerId;

        if (!customerId) {
            return;
        }

        let ignore = false;

        async function loadCustomerDetail() {
            const requestCustomerId = customerId;

            if (!requestCustomerId) {
                return;
            }

            setLoadingCustomerDetail(true);
            setDetailError(null);

            try {
                const [customerDetail, customerRequests] = await Promise.all([
                    fetchCustomerDetail(requestCustomerId),
                    fetchCustomerRequests(requestCustomerId),
                ]);

                if (!ignore) {
                    setSelectedCustomer(customerDetail);
                    setServiceRequests(customerRequests);
                }
            } catch (error) {
                if (!ignore) {
                    setDetailError(
                        error instanceof Error
                            ? error.message
                            : "Unable to load customer detail.",
                    );
                }
            } finally {
                if (!ignore) {
                    setLoadingCustomerDetail(false);
                }
            }
        }

        loadCustomerDetail();

        return () => {
            ignore = true;
        };
    }, [selectedCustomerId]);

    const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const handleFormChange = (
        field: keyof CreateServiceRequestInput,
        value: string,
    ) => {
        setFormState((currentState) => ({
            ...currentState,
            [field]: field === "priority" ? (value as Priority) : value,
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedCustomerId || !selectedCustomer) {
            setSubmitError("Select a customer before creating a service request.");
            return;
        }

        const trimmedSubject = formState.subject.trim();
        const trimmedDescription = formState.description.trim();

        if (!trimmedSubject || !trimmedDescription) {
            setSubmitError("Subject and description are both required.");
            return;
        }

        setSubmitError(null);
        setSubmitSuccess(null);
        setIsSubmitting(true);

        try {
            const newRequest = await createCustomerRequest(selectedCustomerId, {
                subject: trimmedSubject,
                description: trimmedDescription,
                priority: formState.priority,
            });

            setServiceRequests((currentRequests) => [newRequest, ...currentRequests]);
            setSelectedCustomer((currentCustomer) =>
                currentCustomer
                    ? { ...currentCustomer, openRequestCount: currentCustomer.openRequestCount + 1 }
                    : currentCustomer,
            );
            setCustomers((currentCustomers) =>
                currentCustomers.map((customer) =>
                    customer.id === selectedCustomerId
                        ? { ...customer, openRequestCount: customer.openRequestCount + 1 }
                        : customer,
                ),
            );
            setFormState(initialForm);
            setSubmitSuccess("Service request created successfully.");
        } catch (error) {
            setSubmitError(
                error instanceof Error
                    ? error.message
                    : "The service request could not be submitted.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="page-shell">
            <div className="console-shell">
                <header className="topbar">
                    <div>
                        <p className="eyebrow">Operations Console</p>
                        <h1>Customer Service Console</h1>
                    </div>
                    <div className="summary-pill">
                        <span>{customers.length}</span>
                        customers
                    </div>
                </header>

                <div className="search-panel">
                    <label htmlFor="customer-search" className="label-text">
                        Search by customer name or ID
                    </label>
                    <input
                        id="customer-search"
                        name="customer-search"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="e.g. Alicia or C-1002"
                        className="search-input"
                        aria-label="Search customers by name or ID"
                    />
                </div>

                <div className="layout-grid">
                    <aside className="list-panel">
                        <div className="panel-header">
                            <h2>Customers</h2>
                        </div>

                        {loadingCustomers ? (
                            <div className="state-block">Loading customers...</div>
                        ) : listError ? (
                            <div className="state-block error-text">{listError}</div>
                        ) : !customers.length ? (
                            <div className="state-block">No customers match that search.</div>
                        ) : (
                            <ul className="customer-list">
                                {customers.map((customer) => (
                                    <li key={customer.id}>
                                        <button
                                            type="button"
                                            className={`customer-item ${selectedCustomerId === customer.id ? "active" : ""}`}
                                            onClick={() => setSelectedCustomerId(customer.id)}
                                        >
                                            <div className="customer-row-top">
                                                <strong>{customer.name}</strong>
                                                <span className={`status-tag status-${customer.status.toLowerCase()}`}>
                                                    {customer.status}
                                                </span>
                                            </div>
                                            <div className="customer-row-meta">
                                                <span>{customer.id}</span>
                                                <span>{customer.openRequestCount} open</span>
                                            </div>
                                            <span className="muted-text">{customer.email}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </aside>

                    <section className="detail-panel">
                        {loadingCustomerDetail ? (
                            <div className="state-block detail-loading">Loading customer detail...</div>
                        ) : detailError ? (
                            <div className="state-block error-text">{detailError}</div>
                        ) : !selectedCustomer ? (
                            <div className="state-block">Select a customer to review their profile.</div>
                        ) : (
                            <>
                                <div className="detail-header">
                                    <div>
                                        <p className="eyebrow">Customer Profile</p>
                                        <h2>{selectedCustomer.name}</h2>
                                    </div>
                                    <span className={`status-tag status-${selectedCustomer.status.toLowerCase()}`}>
                                        {selectedCustomer.status}
                                    </span>
                                </div>

                                <div className="profile-grid">
                                    <div className="profile-card">
                                        <span className="label-text">Customer ID</span>
                                        <strong>{selectedCustomer.id}</strong>
                                    </div>
                                    <div className="profile-card">
                                        <span className="label-text">Email</span>
                                        <strong>{selectedCustomer.email}</strong>
                                    </div>
                                    <div className="profile-card">
                                        <span className="label-text">Phone</span>
                                        <strong>{selectedCustomer.phone}</strong>
                                    </div>
                                    <div className="profile-card">
                                        <span className="label-text">Open Requests</span>
                                        <strong>{selectedCustomer.openRequestCount}</strong>
                                    </div>
                                </div>

                                <div className="request-section">
                                    <div className="panel-header requests-header">
                                        <h3>Service Requests</h3>
                                        <span>{serviceRequests.length} items</span>
                                    </div>

                                    {serviceRequests.length === 0 ? (
                                        <div className="state-block">No service requests available for this customer.</div>
                                    ) : (
                                        <div className="request-list">
                                            {serviceRequests.map((request) => (
                                                <article className="request-card" key={request.id}>
                                                    <div className="request-card-header">
                                                        <div>
                                                            <strong>{request.subject}</strong>
                                                            <p>{request.id}</p>
                                                        </div>
                                                        <span className={`priority-badge ${priorityStyles[request.priority]}`}>
                                                            {request.priority}
                                                        </span>
                                                    </div>
                                                    <p className="request-description">{request.description}</p>
                                                    <div className="request-meta">
                                                        <span>{request.status}</span>
                                                        <span>
                                                            {new Date(request.createdAt).toLocaleString(undefined, {
                                                                dateStyle: "medium",
                                                                timeStyle: "short",
                                                            })}
                                                        </span>
                                                    </div>
                                                </article>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <form className="request-form" onSubmit={handleSubmit}>
                                    <div className="panel-header requests-header">
                                        <h3>Create Service Request</h3>
                                    </div>

                                    <div className="form-grid">
                                        <label htmlFor="service-subject">
                                            <span className="label-text">Subject</span>
                                            <input
                                                id="service-subject"
                                                name="service-subject"
                                                value={formState.subject}
                                                onChange={(event) => handleFormChange("subject", event.target.value)}
                                                placeholder="Describe the issue"
                                                className="field-input"
                                            />
                                        </label>

                                        <label htmlFor="service-priority">
                                            <span className="label-text">Priority</span>
                                            <select
                                                id="service-priority"
                                                name="service-priority"
                                                value={formState.priority}
                                                onChange={(event) => handleFormChange("priority", event.target.value)}
                                                className="field-input"
                                            >
                                                <option value="Low">Low</option>
                                                <option value="Medium">Medium</option>
                                                <option value="High">High</option>
                                                <option value="Urgent">Urgent</option>
                                            </select>
                                        </label>
                                    </div>

                                    <label htmlFor="service-description">
                                        <span className="label-text">Description</span>
                                        <textarea
                                            id="service-description"
                                            name="service-description"
                                            value={formState.description}
                                            onChange={(event) => handleFormChange("description", event.target.value)}
                                            placeholder="Add the customer problem and any follow-up details."
                                            className="field-textarea"
                                            rows={5}
                                        />
                                    </label>

                                    {submitError ? <div className="message error">{submitError}</div> : null}
                                    {submitSuccess ? <div className="message success">{submitSuccess}</div> : null}

                                    <button
                                        type="submit"
                                        className="submit-button"
                                        disabled={isSubmitting || !selectedCustomer || !formState.subject.trim() || !formState.description.trim()}
                                    >
                                        {isSubmitting ? "Submitting..." : "Create Service Request"}
                                    </button>
                                </form>
                            </>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
