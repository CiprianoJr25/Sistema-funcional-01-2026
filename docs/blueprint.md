# **App Name**: EuroInfo Suite

## Core Features:

- Authentication: Secure user authentication system with email and password login. Includes 'forgot password' functionality and role-based redirection.
- User Management: Admin panel for managing users, assigning roles (admin, gerente, encarregado, tecnico), and managing sector assignments.
- Internal Tickets (Atendimentos Internos): System for creating, assigning, and tracking internal support tickets. Supports different status types (pending, in progress, completed, canceled) and role-based visibility.
- External Tickets (Chamados Externos): System for creating, assigning, and tracking external support tickets. Includes client management, scheduling, status updates, and technician field operations (accept, check-in, finalize).
- Route Optimization: A tool to optimize technician routes for external tickets using generative AI, based on the technician's current location and the addresses of pending tickets. Technicians can manually reorder the route.
- Dashboards: Role-based dashboards displaying key metrics and visualizations. Includes summaries of internal vs external tickets, technician activity, and other relevant data.
- Reports & History: Reporting module for generating reports on ticket data within a specified date range. Technicians can view and export their ticket history.

## Style Guidelines:

- Dark theme background color: Dark navy blue (#0B1320) to provide a professional and sophisticated feel.
- Primary color: Royal blue (#2E3569), a desaturated hue analogous to the background that stands out enough to guide focus.
- Accent color: Orange (#FF6600) for key actions and important information.
- Body and headline font: 'Inter' sans-serif for a modern, neutral look and great readability.
- Use clean and professional icons from 'shadcn/ui' to represent different modules and actions.
- Sidebar always rendered with modules accessible based on user role. Clean and intuitive layout with clear information hierarchy.
- Subtle transitions and animations to enhance user experience when navigating between modules and performing actions.