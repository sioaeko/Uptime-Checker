
# Uptime Checker

![스크린샷, 2024-06-25 23-13-54](https://github.com/sioaeko/Uptime-monitor/assets/101755125/3a80f563-ad68-4350-a1f5-dbe353f58088)

Uptime Checker is a simple tool to monitor the availability and SSL certificate status of specified URLs. This project provides a web interface to add URLs for monitoring and an API to check their status. This version is optimized for serverless deployment on Vercel.

The versions of nodejs that can run on common servers and desktops are here

[uptime-monitor](https://github.com/sioaeko/Uptime-monitor)

## Features

- **URL Monitoring**: Add URLs to monitor their availability.
- **SSL Certificate Check**: Check the SSL certificate status, including validity and expiration date.
- **Response Time Measurement**: Measure and display the response time of the monitored URLs.

## Setup and Installation

### Prerequisites

- Node.js (v12.x or later)
- npm (v6.x or later)
- Vercel account

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/Uptime-Checker.git
   cd Uptime-Checker
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

### Running the Project Locally

1. Start the server:

   ```bash
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:3000`.

### Deploying to Vercel

1. Sign up or log in to [Vercel](https://vercel.com/).
2. Import your project from GitHub to Vercel.
3. In the Vercel dashboard, set up your project settings and deploy.

### Environment Variables

For deployment on Vercel, you may need to set the following environment variables in the Vercel dashboard under your project settings:

- `NODE_ENV`: `production`

## API Endpoints

### `POST /api/add-url`

Add a URL for monitoring.

#### Request

```json
{
  "url": "https://example.com"
}
```

#### Response

```json
{
  "status": "success",
  "message": "URL added for monitoring"
}
```

### `GET /api/check-status`

Check the status of a monitored URL.

#### Request

```json
{
  "url": "https://example.com"
}
```

#### Response

```json
{
  "status": "up",
  "responseTime": 123,
  "ssl": {
    "valid": true,
    "expiresAt": "2024-12-31T23:59:59.000Z"
  },
  "lastChecked": "2024-06-25T12:34:56.000Z",
  "downHistory": []
}
```

### `POST /api/remove-url`

Remove a URL from monitoring.

#### Request

```json
{
  "url": "https://example.com"
}
```

#### Response

```json
{
  "status": "success",
  "message": "URL removed from monitoring"
}
```

## Project Structure

```
Uptime-Checker/
├── api/
│   ├── add-url.js
│   ├── check-status.js
│   └── remove-url.js
├── public/
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── serverless.js
├── vercel.json
├── package.json
└── README.md
```

## Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## License

This project is licensed under the MIT License.
