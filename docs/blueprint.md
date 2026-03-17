# **App Name**: LedgerTrust Audit

## Core Features:

- Order List & Status Dashboard: Display all credit orders ('pedidos') in a comprehensive table, including ID, date, company, program, UF, quantity, value, audit status, and a visual status indicator (🟢 OK, 🟡 Pending, 🔴 Error).
- Order Details & Movement View: Allow users to click on an order to view its expanded details, including a list of associated movements ('movimentos'), displaying their origin, destination, quantity, and validation status (duplicated or valid).
- Manual Movement Input & Management: Enable adding new 'movimentos' manually, typically via a text area for raw data, and provide functionality to edit or delete existing 'movimentos'.
- Global Hash Validation System: Automatically check all 'movimento' hashes ('hashMovimento') for uniqueness across the entire system. If a duplicate is detected, mark the movement as 'duplicado = true' and update the parent 'pedido.status' to 'erro' to flag the conflict.
- Automated Order Status Management: Continuously and automatically update the 'pedido.status' to 'ok', 'pendente', or 'erro' based on whether all associated 'movimentos' are validated and free of duplicates, and if the order is complete.
- Audit Marking: Provide a simple interface (e.g., a checkbox) for users to explicitly mark a 'pedido' as 'auditado' (audited), indicating it has passed a manual review.
- Migration Readiness Control: Enforce a strict security rule to block any critical action, such as export or migration, if a 'pedido's 'status' is not 'ok', ensuring data integrity before blockchain integration.

## Style Guidelines:

- Color scheme: Dark. Emphasizing trust, integrity, and technical precision for a blockchain-adjacent system. Status indicators (green, yellow, red) will stand out prominently.
- Primary color: A confident and trustworthy indigo, chosen for stability and professionalism. (#734DCC)
- Background color: A very dark, desaturated shade of the primary indigo, providing a strong foundation for content. (#27222E)
- Accent color: An analogous, slightly brighter blue to highlight interactive elements and draw attention. (#69A9F0)
- Headline and Body font: 'Inter', a grotesque-style sans-serif for its modern, machined, and objective look, ensuring maximum clarity and readability for data-heavy content.
- Utilize clear and functional icons for system actions like 'add', 'edit', 'delete', and 'view'. Use distinct visual cues (🟢, 🟡, 🔴) for order status, and a checkmark for 'auditado'.
- Implement a structured and clean layout, particularly for data tables, balancing density with readability. Ensure clear separation of information when expanding order details to display movements.
- Incorporate subtle and smooth transitions for state changes, such as expanding order details or updating statuses, to enhance user experience without being distracting.