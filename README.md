# Customer Service Operations Console

A small customer-support operations dashboard for finding a customer, reviewing their profile and service requests, and creating a new service request. It is a working UI prototype backed by mock data, not a production customer-management system.

## What It Does

- Search customers by name or customer ID. Search requests are debounced by 300 ms.
- Select a customer to view their profile and service-request history.
- Create a service request with a subject, description, and priority.
- Show loading, empty, validation, success, and error feedback in the UI.
- Prevent concurrent form submissions in the UI and send an `Idempotency-Key` with create requests.

## Technology

- Next.js 16 App Router: page composition, development/build tooling, and API route handlers.
- React 19: interactive client-side console and state management.
- TypeScript 5: domain models and typed UI/API boundaries.
- Vitest, jsdom, and React Testing Library: component-level automated tests.
- ESLint with the Next.js configuration: static lint checks.

## Requirements and Setup

Use Node.js 20.9 or newer and npm. From the project directory:

```bash
npm install
npm run dev
```

Open <http://localhost:3000> in a browser. The app uses local mock data and does not require environment variables, credentials, or a separate backend service.

## Available Commands

```bash
npm run dev    # Start the local development server
npm run build  # Create a production build
npm run start  # Serve the production build (run build first)
npm run lint   # Run ESLint
npm test       # Run the automated tests once
```

## How It Is Organized

```text
app/
	page.tsx                         Application page
	layout.tsx                       Root layout and page metadata
	api/customers/                   Next.js API route handlers
src/
	features/customers/
		types.ts                       Customer and service-request domain types
		api/customer-api.ts            Browser-side HTTP client
		api/mock-data.ts               Seed data and in-memory operations
		ui/customer-console.tsx        Search, detail, and request form UI
	hooks/use-debounced-value.ts     Reusable debounced-value hook
	tests/customer-console.test.tsx  Customer console component test
```

The page renders the customer console. The console calls the client API module, which makes HTTP requests to same-origin Next.js route handlers. Those handlers read and update the mock-data module. This keeps UI state and HTTP concerns separate from the mock storage and business operations.

## API Routes

- `GET /api/customers?search={term}` returns customers whose name or ID matches the optional search term.
- `GET /api/customers/{id}` returns a customer's profile.
- `GET /api/customers/{id}/requests` returns that customer's service requests, newest first.
- `POST /api/customers/{id}/requests` creates a request. The JSON body contains `subject`, `description`, and `priority` (`Low`, `Medium`, `High`, or `Urgent`). The client sends an `Idempotency-Key` header.

## Design and Implementation Notes

- The customer list and selected-customer workspace support the central workflow without navigating away from the console.
- The 300 ms debounce reduces redundant list requests while someone is typing.
- The client API module centralizes fetch and response-error handling; API route handlers form the boundary to server-side data operations.
- New request input is trimmed and required fields are validated before submission. The mock API also validates the customer and request fields.
- The mock API stores idempotency results by customer and key so a repeated key returns the original request within the current process.

## Assumptions and Known Limitations

- Customer and request records are seeded in `src/features/customers/api/mock-data.ts`. Changes are in memory only and are lost when the server process restarts.
- The idempotency map is also process-local, has no expiration, and is not coordinated across multiple server instances. It demonstrates the request pattern only; production needs durable, atomic storage and an appropriate retention policy.
- The UI generates a new idempotency key for each create call and disables submission while a call is in flight. A retry after an ambiguous network failure therefore does not reuse the original key.
- There is no authentication, authorization, database, pagination, or integration with a real customer-service platform. This prototype should not be used with real customer data.
- Automated coverage is currently focused on the customer console's debounced search. API route behavior, persistence, and end-to-end browser workflows do not yet have dedicated tests.

## Automated Test

Run `npm test` to execute the Vitest suite. The existing `CustomerConsole` test renders the console, types a customer ID into search, and verifies that the customer API is called with the debounced search term. API functions are mocked in this component test, so it does not make network requests.

## AI-Tool Usage

GitHub Copilot was used to assist with the initial app structure, TypeScript domain types, mock API route patterns, and customer-console composition. AI-generated suggestions were treated as drafts and reviewed against the implementation and test behavior.

One design choice was to debounce customer search by 300 ms rather than trigger a request for every keystroke. The idempotency-key pattern was also retained as an example of duplicate-request handling, with its in-memory limitations called out above. The automated test provides a check for the debounced-search behavior; it is not a substitute for review or broader production testing.
