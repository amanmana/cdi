# MiniFramework MVC

A lightweight PHP 8.1+ MVC micro-framework with Laravel-style routing, middleware, session auth, CSRF, and a flexible approval workflow module.

## Features
- **Routing**: Laravel-style `Route::get('/path', 'Controller@method')`.
- **MVC**: Clear separation of concerns.
- **Middleware**: Pipeline support for Auth, Role, and CSRF.
- **Workflow Engine**: Generic approval system with steps and history.
- **UI/UX**: Beautifully crafted with Tailwind CSS & DaisyUI (CDN).
- **Security**: CSRF protection, salted password hashing, and output escaping.

## Installation

1. **Install Dependencies**
   ```bash
   composer install
   ```

2. **Database Setup**
   - Create a database named `framework_mini`.
   - Import `database/schema.sql`.
   - Import `database/seed.sql`.

3. **Configuration**
   - Copy `.env.example` to `.env`.
   - Update `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD`.

4. **Run the Application**
   ```bash
   php -S localhost:8000 -t public
   ```

## Demo Credentials

- **Admin Account**: `admin@example.com` / `password123`
- **Manager Account**: `manager@example.com` / `password123`
- **Staff Account**: `staff@example.com` / `password123`

## Workflow Example
1. **Public**: Visit `/` or `/job-requests/create` to submit a request.
2. **Manager**: Login as manager, go to Job Requests, and **Approve/Reject** the submitted request.
3. **Staff**: Login as staff, go to Job Requests, and **Complete** the approved request.

## Project Structure
- `app/Core`: Core framework classes (Router, Request, Response, etc.)
- `app/Controllers`: Application logic.
- `app/Models`: Database interacts.
- `app/Views`: HTML templates with layout support.
- `routes/web.php`: Route definitions.
- `public/index.php`: Entry point.
- `storage`: Log files and temporary data.

## License
MIT License.
