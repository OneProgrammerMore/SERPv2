# SERP - Sistema d'Emergències i Resposta Prioritaria

Emergency and Priority Response System - Project presented at Talent Arena 2025

![Emergency Response](https://placehold.co/600x400?text=SERP:+Sistema+d'Emergències+i+Resposta+Prioritaria)

## Overview

SERP is a comprehensive emergency management system that optimizes emergency response through network prioritization, real-time location tracking, and emergency resource allocation. The system integrates with Nokia API services to provide Quality of Service (QoS) for emergency vehicles and essential resource management.

This project has been initially done by a team of 5 for the 2 days Hackaton at Talent Arena 2025. As it could not be finished, neither presented, Mario Gómez García has "finished" it (work still in progress but parked).

The initial team was:
  - [Ariana](https://github.com/bavba)
  - Alejandro Gomez Villoldo
  - [Alex Sanchez Blabia](https://github.com/Caballosanex)
  - [Joan Renau Valls](https://github.com/TwikiTuki)
  - [Mario Gómez García](https://github.com/OneProgrammerMore)

## Deployment

### For Development
1. Change VARS in docker-compose file:
    - [ ] serp-fastapi
        - [ ] API_URL_CORS
        - [ ] SEED_DB_DEMO
        - [ ] PORT
    - [ ] serp-react
        - [ ] REACT_APP_API_URL

2. Start services using docker-compose
```bash
make start-dev
# OR
docker-compose up
```

**Useful Commands**
- Start FASTAPI server demo seeder for database
```bash
docker exec -it serp-fastapi python main.py runserver
```

- Run demo seeder for database
```bash
docker exec -it serp-fastapi python main.py seeddb
```

- Drop all database data
```bash
docker exec -it serp-fastapi python main.py dropdb
```


### For Deployment
1. Change VARS in docker-compose file:
    - [ ] serp-fastapi
        - [ ] API_URL_CORS
        - [ ] SEED_DB_DEMO
        - [ ] PORT
    - [ ] serp-react
        - [ ] REACT_APP_API_URL

2. Start services using docker-compose
```bash
make start-deploy
# OR
docker-compose -f docker-compose.deploy.yml up
```


## Key Features

- **Emergency Management**:
  - Create, track, and resolve emergency incidents
  - Priority-based handling of emergencies
  - Automatic resource assignment based on emergency type

- **Resource Management**:
  - Track emergency vehicles (ambulances, fire trucks, police)
  - Real-time location monitoring via GPS
  - Status tracking (active, inactive, resting, available)

- **Nokia Network Integration**:
  - Automatic QoS activation for emergency resources
  - Network bandwidth prioritization for critical communications
  - Dynamic QoS management based on emergency resolution

- **Multi-Role Access**:
  - Emergency center dashboard
  - Resource personnel mobile interface
  - Emergency operator coordination panel

## Architecture

The system is built using a microservices architecture with the following components:

- **Backend API**: FastAPI-based service handling business logic
- **Frontend**: React-based responsive web application
- **Database**: PostgreSQL for data persistence
- **Mock Nokia API**: Simulated integration with Nokia's network services [ToDo Version 0.003]
- **Docker**: Container-based deployment for all components

## Technology Stack

### Backend
- **FastAPI**: High-performance Python API framework
- **SQLModel/SQLAlchemy**: ORM for database interactions
- **PostgreSQL**: Relational database
- **Alembic**: Database migration
- **Docker**: Containerization
- **Uvicorn**: ASGI server
- **Pytes**: API testing


### Frontend
- **React**: UI framework
- **Redux**: State management
- **Material-UI**: Component library
- **Leaflet**: Interactive maps
- **React Router**: Navigation

## Project Structure

```
.
├── backend/
│   ├── alembic/            # Database migrations
│   ├── src/
│   │   ├── commands/       # Commands for project
│   │   ├── configs/        # Configuration files
│   │   ├── models/         # Database models
│   │   ├── routes/         # API endpoints
│   │   ├── seeders/        # Database seeders
│   │   └── services/       # Business logic
│   ├── Dockerfile          # Backend container definition
│   ├── main.py             # Application entry point
│   └── requirements.txt    # Python dependencies
│
├── frontend/
│   ├── public/             # Static files
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React contexts
│   │   ├── layouts/        # Page layouts
│   │   ├── pages/          # App pages
│   │   ├── redux/          # State management
│   │   └── App.jsx         # Main app component
│   ├── Dockerfile          # Frontend container definition
│   └── package.json        # JS dependencies
│
├── docker-compose.yml      # Multi-container definition
└── create_emergency_scenario.sh  # Test script
```

## Installation

### Prerequisites
- Docker and Docker Compose
- Git

### Setup Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/SERP.git
   cd SERP
   ```

2. Start the containers:
   ```bash
   docker-compose up -d
   ```

3. If you want data to play with: [OPTIONAL]
  ```bash
  docker exec -it SERP-backend python main.py seeddb
  ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001
   - API Documentation: http://localhost:5001/docs

## Usage

### Login Credentials [HARDCODED] - *User Authentication Not yet done

The system includes simulated authentication with the following demo accounts:

- **Emergency Center**:
  - Email: admin@serp.cat
  - Password: admin123

- **Resource Personnel**:
  - Email: resource@serp.cat
  - Password: resource123

- **Emergency Operator**:
  - Email: operator@serp.cat
  - Password: operator123



## API Endpoints

### Alerts/Emergencies
- `GET /api/alerts` - List all alerts
- `POST /api/alerts` - Create new alert
- `GET /api/alerts/{id}` - Get alert details
- `PATCH /api/alerts/{id}` - Update alert status

### Resources/Devices
- `GET /api/devices` - List all devices
- `POST /api/devices` - Register new device
- `GET /api/devices/{id}` - Get device details
- `PATCH /api/devices/{id}` - Update device
- `DELETE /api/devices/{id}` - Remove device
- `GET /api/devices/{id}/assignments` - Get device assignments

### QoS Management
- `POST /api/devices/{id}/qos` - Activate QoS for device
- `DELETE /api/devices/{id}/qos` - Deactivate QoS for device

### Location Services
- `GET /api/devices/{id}/location` - Get current device location



## Usefull Commands

### Running Migrations
```bash
docker exec SERP-backend alembic revision --autogenerate -m "Description"
docker exec SERP-backend alembic upgrade head
```

### Database Access
```bash
docker exec -it SERP-db psql -U user -d SERP
```

Common commands:
```sql
-- Show tables
\dt+

-- Show table info
\d+ users

-- Reset database
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

## Development Notes

### Backend
- The backend uses FastAPI with SQLModel (SQLAlchemy)
- Async database operations are used throughout
- API is structured by resource type (emergencies, resources, etc.)
- Integration with Nokia APIs is simulated

### Frontend
- The frontend uses React with Redux for state management
- Three distinct role-based views (emergency center, operator, resource)
- Interactive maps for location visualization
- Theme switching (light/dark mode)
- Mobile responsive design

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Project presented at Talent Arena 2025
- Thanks to Nokia for API integration specifications


### Creating Test Scenarios - DEPRECATED

A script is included to create test emergency scenarios:

```bash
./create_emergency_scenario.sh
```

For debug mode with more verbose output:
```bash
./create_emergency_scenario.sh -d
```
