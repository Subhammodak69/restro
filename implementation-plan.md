# Customer Website and Ordering App Plan

## Goal

The `restro` app is both the restaurant's public website and customer ordering app. It must support normal home browsing/delivery and dine-in ordering when entered through a table QR. The website's restaurant name, menu highlights, address, hours, contact methods, service modes, and branding come from `src/data/company.json`, so sample copy can be replaced without editing components.

## Customer journeys

### Public website and home delivery

1. Show restaurant story/details, menu, availability, address/map, opening hours, phone/WhatsApp, and delivery coverage.
2. Browse and filter menu items, customize supported options, and maintain a cart.
3. Sign in with mobile number and OTP before placing a delivery order. Preserve the cart and return the customer to checkout after verification.
4. Capture delivery address and postal code; ask the server to validate coverage, fee, minimum order, and estimated delivery.
5. Confirm order with a dummy payment method for now. Clearly label the payment as demo; never imply that real money was charged.
6. Show live order progress and delivery status, plus order history for the signed-in customer.

### Dine-in from table QR

1. Admin-generated QR opens a signed/unguessable table URL and resolves the exact restaurant and table.
2. Show restaurant/menu details with a visible table number. Require mobile OTP login for placing the order; retain table context during verification.
3. Allow the customer to order in rounds at the same table session.
4. After placing an order, show a live waiting screen with KOT status and ETA. Include optional lightweight quiz/trivia and other waiting games; keep games separate from payment/order state.
5. Show waiter-call actions and the active table order. After the payment workflow is implemented, show a review prompt.

## Screens and implementation order

1. Load/validate `company.json`; use it for header, footer, contact, location, hours, and service-mode visibility.
2. Add route handling for website, `/t/:qrToken`, menu, cart, OTP login, delivery checkout, dine-in waiting, and customer order history.
3. Add shared API client, mobile OTP auth state, cart persistence, table context, and one authenticated Socket.IO connection.
4. Build menu customization, availability and location-aware delivery checkout.
5. Add dine-in order status screen, waiter requests, and waiting games.
6. Add responsive, accessible, error, loading, offline/reconnect, and empty states.

## Live updates

Join the customer socket to authorized rooms only: customer order room for home delivery and table session room for dine-in. Listen for order accepted/preparing/ready, item changes, ETA, delivery assignment and status, waiter acknowledgement, bill/payment status, and reconnect snapshots. Use REST to reconcile after reconnect; do not rely on socket events as the only source of truth.

## Acceptance criteria

- A user can browse without an account, but a mobile number and valid OTP are required to place either a home or dine-in order.
- A table QR always resolves to its mapped table; an invalid, disabled, or rotated QR explains how to get help.
- Home checkout validates address coverage and displays server-calculated delivery fee and total.
- Dine-in orders remain tied to the scanned table; the waiting screen updates without manual refresh and includes optional games.
- Demo payment is visibly marked as simulated and cannot be mistaken for a completed real gateway charge.
- Restaurant website details can be changed through `company.json` without changing page components.
