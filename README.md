# Bon Gout

Bon Gout is a full-stack food ordering platform built with React and Django REST Framework. Customers can browse the menu, manage a cart, place orders, make Razorpay payments, and track order status. Staff and administrators have role-based tools for managing menu items, orders, and users.

## Features

- JWT authentication with signup, login, OTP verification, and Google/Firebase integrations
- Role-based access for customers, employees, and administrators
- Menu categories, search, item details, ratings, and featured items
- Cart management and order history
- Razorpay payment integration
- Admin and staff management tools
- Responsive React interface with Tailwind CSS

## Tech Stack

- Frontend: React 18, React Router, Axios, Tailwind CSS, Lucide React
- Backend: Django 5, Django REST Framework, SimpleJWT
- Database: MySQL
- Deployment support: Gunicorn and WhiteNoise

## Project Structure

```text
foodweb/
├── backend/                 # Django API
│   ├── bon_gout/            # Project settings and URL configuration
│   ├── restaurant/          # Menu, orders, payments, and restaurant APIs
│   ├── users/               # Authentication and user APIs
│   ├── manage.py
│   └── requirements.txt
└── bon-gout/                # React frontend
    ├── public/
    ├── src/
    ├── package.json
    └── tailwind.config.js
```

## Requirements

- Python 3.10 or newer
- Node.js 16 or newer and npm
- MySQL 8 or another compatible MySQL server

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/Vikkyreddy08/bon-gout-food-ordering-platform.git
cd bon-gout-food-ordering-platform
```

### 2. Configure the backend

```bash
cd backend
python -m venv venv

# Windows PowerShell
.\venv\Scripts\Activate.ps1

# macOS/Linux
# source venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env` with values for your local environment:

```env
DEBUG=True
SECRET_KEY=replace_with_a_secure_secret
DB_NAME=bon_gout
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_HOST=127.0.0.1
DB_PORT=3306
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
ADMIN_SECRET_CODE=your_admin_signup_code
```

Run migrations and start the API:

```bash
python manage.py migrate
python manage.py runserver
```

The backend runs at `http://127.0.0.1:8000/`.

### 3. Configure and start the frontend

Open a second terminal:

```bash
cd bon-gout
npm install
```

Create `bon-gout/.env`:

```env
REACT_APP_API_URL=http://127.0.0.1:8000/api/
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
```

Start the React development server:

```bash
npm start
```

The frontend runs at `http://localhost:3000/`.

## Useful Commands

Run these from `bon-gout/`:

```bash
npm start       # Start the development server
npm test        # Run the test runner
npm run build   # Create a production build
```

Run these from `backend/`:

```bash
python manage.py check       # Check the Django project
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

## API Examples

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/users/register/` | POST | Register a user |
| `/api/users/login/` | POST | Log in and receive JWT tokens |
| `/api/restaurant/menu/` | GET | List menu items |
| `/api/restaurant/orders/` | POST | Place an order |
| `/api/users/profile/` | GET | Get the authenticated user's profile |

## Security Notes

- Keep `.env` files and production secrets out of version control.
- Use a strong Django `SECRET_KEY` in production.
- Set `DEBUG=False` and configure allowed hosts and CORS origins before deployment.

## Author

Nandeeshwar Reddy - [@Vikkyreddy08](https://github.com/Vikkyreddy08)
