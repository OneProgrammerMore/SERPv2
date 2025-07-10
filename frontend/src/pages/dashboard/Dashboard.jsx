import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Tabs, 
  Tab, 
  CircularProgress, 
  Button, 
  Chip, 
  Divider,
  Card, 
  CardContent, 
  CardHeader,
  IconButton,
  Tooltip,
  TextField
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Map as MapIcon,
  List as ListIcon,
  Search as SearchIcon,
  LocalFireDepartment as FireIcon,
  LocalHospital as MedicalIcon,
  DirectionsCar as AccidentIcon,
  Storm as NaturalDisasterIcon,
  Warning as OtherIcon,
  LocalPolice as PoliceIcon,
  LocalFireDepartment as FirefighterIcon,
  LocalHospital as AmbulanceIcon,
  DirectionsCar as VehicleIcon,
  Build as EquipmentIcon
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { fetchResources } from '../../redux/slices/resourcesSlice';
import { fetchEmergencies } from '../../redux/slices/emergenciesSlice';


// Función para convertir un componente SVG a URL de datos
const svgToDataUrl = (IconComponent, color = '#FF0000') => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <circle cx="12" cy="12" r="11" fill="white" stroke="${color}" stroke-width="1"/>
      <g transform="scale(0.7) translate(5, 5)">
        ${IconComponent}
      </g>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Definir los paths SVG para cada icono
const iconPaths = {
  fire: '<path d="M19.48 12.35c-1.57-4.08-7.16-4.3-5.81-10.23.1-.44-.37-.78-.75-.55C9.29 3.71 6.68 8 8.87 13.62c.18.46-.36.89-.75.59-1.81-1.37-2-3.34-1.84-4.75.06-.52-.62-.77-.91-.34C4.69 10.16 4 11.84 4 14.37c.38 5.6 5.11 7.32 6.81 7.54 2.43.31 5.06-.14 6.95-1.87 2.08-1.93 2.84-5.01 1.72-7.69zm-9.28 5.03c1.44-.35 2.18-1.39 2.38-2.31.33-1.43-.96-2.83-.09-5.09.33 1.87 3.27 3.04 3.27 5.08.08 2.53-2.66 4.7-5.56 2.32z"/><path fill="none" d="M0 0h24v24H0z"/>',
  medical: '<path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/>',
  accident: '<path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>',
  natural: '<path d="M18 8h-7l-2-2H4c-1.1 0-1.99.9-1.99 2L2 20c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-2.06 11L11 14.77 8.06 19H5.12L9 13.77 5.64 9h2.94l2.42 4 2.42-4h2.94l-3.36 4.77L19 19h-3.06z"/>',
  other: '<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>'
};

// Crear iconos personalizados para cada tipo de emergencia
const createCustomIcon = (svgPath, color) => {
  const dataUrl = svgToDataUrl(svgPath, color);
  return L.icon({
    iconUrl: dataUrl,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

// Crear iconos personalizados para cada tipo de emergencia
const emergencyIcons = {
  fire: createCustomIcon(iconPaths.fire, '#FF4444'),
  medical: createCustomIcon(iconPaths.medical, '#4CAF50'),
  accident: createCustomIcon(iconPaths.accident, '#FFA000'),
  natural: createCustomIcon(iconPaths.natural, '#5C6BC0'),
  other: createCustomIcon(iconPaths.other, '#757575')
};

// Definir los paths SVG para cada icono de recurso
const resourceIconPaths = {
  police: '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.83-2.61 9.18-7 10.93-4.39-1.75-7-6.1-7-10.93v-4.7l7-3.12z"/>',
  firefighter: '<path d="M19.48 12.35c-1.57-4.08-7.16-4.3-5.81-10.23.1-.44-.37-.78-.75-.55C9.29 3.71 6.68 8 8.87 13.62c.18.46-.36.89-.75.59-1.81-1.37-2-3.34-1.84-4.75.06-.52-.62-.77-.91-.34C4.69 10.16 4 11.84 4 14.37c.38 5.6 5.11 7.32 6.81 7.54 2.43.31 5.06-.14 6.95-1.87 2.08-1.93 2.84-5.01 1.72-7.69zm-9.28 5.03c1.44-.35 2.18-1.39 2.38-2.31.33-1.43-.96-2.83-.09-5.09.33 1.87 3.27 3.04 3.27 5.08.08 2.53-2.66 4.7-5.56 2.32z"/>',
  ambulance: '<path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/>',
  vehicle: '<path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>',
  equipment: '<path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>'
};

// Crear iconos personalizados para cada tipo de recurso
const resourceIcons = {
  police: createCustomIcon(resourceIconPaths.police, '#1976D2'),
  firefighter: createCustomIcon(resourceIconPaths.firefighter, '#FF4444'),
  ambulance: createCustomIcon(resourceIconPaths.ambulance, '#4CAF50'),
  vehicle: createCustomIcon(resourceIconPaths.vehicle, '#FFA000'),
  equipment: createCustomIcon(resourceIconPaths.equipment, '#757575')
};

// Función para obtener el color del estado del recurso
const getResourceStatusColor = (status) => {
  switch (status) {
    case 'Available':
      return '#4CAF50';
    case 'Busy':
      return '#FF4444';
    case 'Maintenace':
      return '#FFA000';
    default:
      return '#757575';
  }
};

// Función para obtener el texto del estado del recurso
const getResourceStatusText = (status) => {
  switch (status) {
    case 'Available':
      return 'Disponible';
    case 'Busy':
      return 'Ocupado';
    case 'Maintenace':
      return 'Mantenimiento';
    default:
      return status;
  }
};

// Panel de estadísticas
const StatPanel = ({ title, value, color }) => (
  <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardContent sx={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: '150px'  // Altura mínima fija para todos los paneles
    }}>
      <Typography 
        variant="h6" 
        color="textSecondary" 
        sx={{ 
          minHeight: '48px',  // Altura fija para el título
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}
      >
        {title}
      </Typography>
      <Typography 
        variant="h3" 
        color={color} 
        align="center"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1
        }}
      >
        {value}
      </Typography>
    </CardContent>
  </Card>
);

// Componente de dashboard
const Dashboard = () => {

  const dispatch = useDispatch();

  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState('list');
  const [isLoading, setIsLoading] = useState(true);
  
  const emergencies = useSelector((state) => state.emergencies?.emergencies || []);
  const resources = useSelector((state) => state.resources?.resources || []);



  useEffect(() => {
    setIsLoading(true)
    dispatch(fetchEmergencies())
    const idEmergencies = setInterval(() => (
      dispatch(fetchEmergencies())
    ), 100000);
    dispatch(fetchResources())
    const idResources = setInterval(() => (
      dispatch(fetchResources())
    ), 100000);
    setIsLoading(false)
    return () => clearInterval(idEmergencies), clearInterval(idResources) ;  
  }, []);
  



  // Filtrar emergencias por búsqueda
  const filteredEmergencies =  emergencies.filter(emergency => 
    emergency.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //emergency.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emergency.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Estadísticas
  const activeEmergencies = emergencies.filter(e => e.status === 'Active').length;
  const pendingEmergencies = emergencies.filter(e => e.status === 'Pending').length;
  const solvedEmergencies = emergencies.filter(e => e.status === 'Solved').length;
  const totalResources = resources.length;
  const availableResources = resources.filter(r => r.status === 'Available').length;
  const busyResources = resources.filter(r => r.status === 'Busy').length;
  const maintenanceResources = resources.filter(r => r.status === 'Maintenance').length;
  
  
  const handleRefresh = () => {
    dispatch(fetchEmergencies())
    dispatch(fetchResources())
    setIsLoading(false)
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleViewChange = (view) => {
    setCurrentView(view);
  };
  
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Control Central Main Panel
        </Typography>
        <Button 
          startIcon={<RefreshIcon />} 
          variant="outlined" 
          onClick={handleRefresh}
          disabled={isLoading}
        >
          Update
        </Button>
      </Box>
      
      {/* Panel de estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <StatPanel 
            title="Active Emergencies" 
            value={activeEmergencies} 
            color="error.main" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatPanel 
            title="Pending Emergencies" 
            value={pendingEmergencies} 
            color="warning.main" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatPanel 
            title="Solved Emergencies" 
            value={solvedEmergencies} 
            color="success.main" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatPanel 
            title={
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span>Total Resources </span>
              </Box>
            }
            value={totalResources} 
            color="info.main" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatPanel 
            title="Available Resources" 
            value={availableResources} 
            color="success.main" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatPanel 
            title="Busy Resources" 
            value={busyResources} 
            color="error.main" 
          />
        </Grid>
      </Grid>
      
      {/* Tabs y filtros */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Emergencies" />
            <Tab label="Resources" />
          </Tabs>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search..."
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ mr: 2 }}
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} />
              }}
            />
            
            <Tooltip title="Filtrar">
              <IconButton>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
            
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            
            <Tooltip title="Map View">
              <IconButton 
                color={currentView === 'map' ? 'primary' : 'default'} 
                onClick={() => handleViewChange('map')}
              >
                <MapIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Vista de llista">
              <IconButton 
                color={currentView === 'list' ? 'primary' : 'default'}
                onClick={() => handleViewChange('list')}
              >
                <ListIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>
      
      {/* Contenido principal */}
      <Paper sx={{ p: 2 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Vista de mapa para las emergencias */}
            {tabValue === 0 && currentView === 'map' && (
              <Box sx={{ height: 600 }}>
                <MapContainer center={[41.3851, 2.1734]} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {filteredEmergencies.map(emergency => (
                    <Marker 
                      key={emergency.id} 
                      position={[emergency.location_emergency_data.latitude, emergency.location_emergency_data.longitude]}
                      icon={emergencyIcons[emergency.type] || emergencyIcons.other}
                    >
                      <Popup>
                        <Typography variant="subtitle1">{emergency.title}</Typography>
                        <Typography variant="body2">{emergency.description}</Typography>
                        <Typography variant="caption">
                          Estat: 
                          <Chip 
                            size="small" 
                            label={emergency.status === 'Active' ? 'Active' : emergency.status === 'pending' ? 'Pendent' : 'Resolta'} 
                            color={emergency.status === 'Active' ? 'error' : emergency.status === 'pending' ? 'warning' : 'success'} 
                            sx={{ ml: 1 }}
                          />
                        </Typography>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </Box>
            )}
            
            {/* Vista de lista para las emergencias */}
            {tabValue === 0 && currentView === 'list' && (
              <Box>
                {filteredEmergencies.length === 0 ? (
                  <Typography align="center" color="textSecondary" sx={{ py: 3 }}>
                    No found emergencies
                  </Typography>
                ) : (
                  <>
                    {/* Título para emergencias activas y pendientes */}
                    <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
                      Active Emergencies
                    </Typography>

                    {/* Emergencias activas y pendientes */}
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                      {filteredEmergencies
                        .filter(emergency => emergency.status !== 'solved')
                        .map(emergency => (
                          <Grid item xs={12} key={emergency.id}>
                            <Card variant="outlined">
                              <CardHeader
                                title={emergency.name}
                                subheader={`Location: Lat: ${emergency.location_emergency_data.latitude} Long: ${emergency.location_emergency_data.longitude}`}
                                action={
                                  <Chip 
                                    label={emergency.status}
                                    color={emergency.status === 'Active' ? 'error' : 'warning'} 
                                  />
                                }
                              />
                              <CardContent>
                                <Typography variant="body2" color="textSecondary">
                                  {emergency.description}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  <b> Created At: </b> {new Date(emergency.time_created ? emergency.time_created : emergency.time_created).toLocaleString()}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  <b> Updated At:</b> {new Date(emergency.time_updated ? emergency.time_updated : emergency.time_updated).toLocaleString()}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                      ))}
                    </Grid>

                    {/* Separador y título para emergencias resueltas */}
                    {filteredEmergencies.some(e => e.status === 'resolved') && (
                      <>
                        <Divider sx={{ my: 3 }} />
                        <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
                          Solved Emergencies
                        </Typography>
                      </>
                    )}

                    {/* Emergencias resueltas */}
                    <Grid container spacing={1}>
                      {filteredEmergencies
                        .filter(emergency => emergency.status === 'resolved')
                        .map(emergency => (
                          <Grid item xs={12} sm={6} md={4} key={emergency.id}>
                            <Card variant="outlined" sx={{ opacity: 0.8 }}>
                              <CardHeader
                                title={
                                  <Typography variant="subtitle1">
                                    {emergency.title}
                                  </Typography>
                                }
                                subheader={
                                  <Typography variant="caption">
                                    {`Location: Lat: ${emergency.location_emergency_data.latitude} Long: ${emergency.location_emergency_data.longitude}`}
                                  </Typography>
                                }
                                action={
                                  <Chip 
                                    size="small"
                                    label="Resolta" 
                                    color="success" 
                                  />
                                }
                              />
                              <CardContent sx={{ py: 1 }}>
                                <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.875rem' }}>
                                  {emergency.description}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                      ))}
                    </Grid>
                  </>
                )}
              </Box>
            )}
            
            {/* Contenido para recursos */}
            {tabValue === 1 && (
              <Box>
                {resources.length === 0 ? (
                  <Typography align="center" color="textSecondary" sx={{ py: 3 }}>
                    No resources found
                  </Typography>
                ) : currentView === 'map' ? (
                  <Box sx={{ height: 600 }}>
                    <MapContainer center={[41.3851, 2.1734]} zoom={13} style={{ height: '100%', width: '100%' }}>
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      {resources
                        .filter(resource => resource.location_resource_data.latitude != null && resource.location_resource_data.longitude != null)
                        .map(resource => (
                          <Marker 
                            key={resource.id} 
                            position={[
                              parseFloat(resource.location_resource_data.latitude), 
                              parseFloat(resource.location_resource_data.longitude)
                            ]}
                            icon={resourceIcons[resource.resource_type] || resourceIcons.equipment}
                          >
                            <Popup>
                              <Box sx={{ p: 1 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                  {resource.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Type: {resource.resource_type.charAt(0).toUpperCase() + resource.resource_type.slice(1)}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  <Typography variant="caption" sx={{ mr: 1 }}>
                                    State:
                                  </Typography>
                                  <Chip 
                                    size="small" 
                                    label={getResourceStatusText(resource.status)}
                                    sx={{ 
                                      backgroundColor: getResourceStatusColor(resource.status),
                                      color: 'white',
                                      '& .MuiChip-label': {
                                        px: 1
                                      }
                                    }}
                                  />
                                </Box>
                                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                  Last Update: {new Date(resource.time_updated != "" ? resource.time_updated : resource.time_created).toLocaleString()}
                                </Typography>
                                {resource.location_resource_data && (
                                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                    {`Location: Lat: ${resource.location_resource_data.latitude} Long: ${resource.location_resource_data.longitude}`}
                                  </Typography>
                                )}
                              </Box>
                            </Popup>
                          </Marker>
                      ))}
                    </MapContainer>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {resources.map((resource) => (
                      <Grid item xs={12} sm={6} md={4} key={resource.id}>
                        <Card>
                          <CardHeader
                            title={resource.name}
                            subheader={`Type: ${resource.resource_type}`}
                            action={
                              <Chip
                                label={resource.status}
                                sx={{ 
                                  backgroundColor: getResourceStatusColor(resource.status),
                                  color: 'white',
                                  '& .MuiChip-label': {
                                    px: 1
                                  }
                                }}
                                size="small"
                              />
                            }
                          />
                          <CardContent>
                            <Typography variant="body2" color="text.secondary">
                              {`Location: Lat: ${resource.location_resource_data.latitude} Long: ${resource.location_resource_data.longitude}`}
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                             Last Update: {new Date(resource.time_updated ? resource.time_updated : resource.time_created).toLocaleString()}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default Dashboard; 