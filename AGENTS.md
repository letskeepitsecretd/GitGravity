<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# GitGravity Project Guidelines & Design Rules

### 1. Card Layout Variety (Zero-Duplicates Policy)
- **Rule**: The card generator MUST produce dynamic, highly varied card designs (era, pattern, accent, typography, light/dark mode).
- **Implementation**: The design DNA selection (`generateCardDNA`) must always be computed from a blend of the user's username, current month, top language, commit counts, stars, and longest streak. Never use static or single-variable formulas which result in identical layouts for different cards.

### 2. High-Density & Plainness Prevention
- **Rule**: Never leave cards plain, boring, or empty. Any card design template must be balanced, visually striking, and completely filled out.
- **Implementation**:
  - Fill empty space with background patterns (`getPattern`), decorative brutalist details, or curves/shapes.
  - Display rich user details—such as **Total Commits**, **Streak Days**, **Stars count**, **Primary Vector Language**, and **Pull Requests count**—arranged in clean grid layouts to prevent design voids (especially for layout archetypes like `ERA_BLOCKS` and `ERA_ARCHES`).

### 3. Strictly No AI Characters or Art placeholders
- **Rule**: Only render the user's real GitHub profile photo. If the user does not have a profile photo or the image fails to load (e.g., CORS blocks), fallback **only** to the official **GitHub Logo SVG** inside a styled background.
- **Restriction**: Do NOT use generic initials text placeholder boxes, and do NOT add any AI-generated character illustrations or placeholder designs.

### 4. Robust Client-Side and Proxy Cache-Busting
- **Rule**: To prevent browsers and CDNs from showing cached 404s, empty frames, or legacy cards:
  - All dynamic metrics and gallery endpoints (like `/api/admin/metrics`) must be requested with client-side timestamp cache-busters (`?t=${Date.now()}`) and `{ cache: 'no-store' }` headers.
  - Saved card previews inside admin portals must append both `t=${timestamp}` (from DB registry) and a session-based random renderer ID to ensure fresh assets are fetched.

