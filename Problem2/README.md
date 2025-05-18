This project contains the database schema for an **event management platform**. The platform allows users to register, browse available events, sign up for sessions, and leave feedback after attending.

### Main Tables

- **Users** – Stores user details.
- **Addresses** – General addresses used for both delivery and event locations.
- **DeliveryAddresses** – Maps users to their delivery addresses.
- **Events** – Represents top-level events on the platform.
- **Sessions** – Sessions tied to an event.
- **SessionRegistrations** – Tracks user registrations to specific sessions.
- **Feedback** – Feedback and ratings left by users after attending sessions.

### Relationships

- A user can have multiple delivery addresses.
- An event can have multiple sessions.
- A session is linked to one event and one address.
- A user can register for multiple sessions.
- A user can leave feedback only for sessions they attended.
- All relationships are enforced with `FOREIGN KEY` constraints using:
  - `ON DELETE CASCADE`
  - `ON DELETE SET NULL` where appropriate.

### Data Integrity Constraints

- Unique constraints on `email` and `phone_number`.
- All essential fields are `NOT NULL`.
- Feedback is only allowed if the user registered for the session:
  - Enforced via a composite foreign key to `SessionRegistrations(user_id, session_id)`.
- Sessions include additional checks:
  - `total_seats > 0`
  - `end_time > start_time`
  - `registration_deadline < start_time`
- Feedback ratings are constrained to be **between 1 and 5**.
