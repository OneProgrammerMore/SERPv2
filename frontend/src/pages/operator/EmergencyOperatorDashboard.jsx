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
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Modal
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Assignment as AssignmentIcon,
  Add as AddIcon,
  Edit as EditIcon,
  NotificationsActive as AlertIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Search as SearchIcon
} from '@mui/icons-material';
// import { fetchEmergencies, createEmergency, updateEmergency, resolveEmergency, assignResourcesToEmergency } from '../../redux/slices/emergenciesSlice';
import { fetchResources } from '../../redux/slices/resourcesSlice';
import { fetchAlerts, resolveAlert } from '../../redux/slices/alertsSlice';
import {APIURL, APIProtocol} from "../../constants.js"
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';

const MapComponent = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  return null;
};

// Panel de estadísticas
const StatPanel = ({ title, value, color }) => (
  <Card elevation={2} sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="h6" color="textSecondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h3" color={color} align="center">
        {value}
      </Typography>
    </CardContent>
  </Card>
);

// Componente de tarjeta de emergencia
const EmergencyCard = ({ emergency, onAssign, onUpdate, onResolve, resources }) => {
  const statusLabels = {
    Active: 'Active',
    Pending: 'Pending',
    Solved: 'Solved',
    Archived: 'Archived'
  };
  
  return (
    <Card elevation={3} sx={{ mb: 2 }}>
      <CardHeader 
        title={emergency.name}
        subheader={
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <LocationIcon fontSize="small" sx={{ mr: 0.5 }} />
            <Typography variant="body2">
              {`Lat: ${emergency.location_emergency_data.latitude} Long: ${emergency.location_emergency_data.longitude}`}
            </Typography>
            <TimeIcon fontSize="small" sx={{ ml: 2, mr: 0.5 }} />
            <Typography variant="body2">
              {new Date(emergency.time_created).toLocaleString('ca-ES')}
            </Typography>
          </Box>
        }
        action={
          <Chip 
            label={statusLabels[emergency.status]} 
            color={emergency.status === 'Active' ? 'error' : emergency.status === 'Pending' ? 'warning' : 'success'}
            size="small"
          />
        }
      />
      <CardContent>
        <Typography variant="body1" paragraph>
          {emergency.description}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Contact Info:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2">{emergency.telephone_contact}</Typography>
            </Box>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" gutterBottom>
               {/* Assigned Resources: {emergency.resources?.length || 0} */}
              Assigned Resources: {resources.filter(r => r.assignments != undefined && r.assignments[0] !=undefined && r.assignments[0].id == emergency.id).length || 0}
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          {emergency.status !== 'Solved' && (
            <>
              <Button 
                size="small" 
                startIcon={<AssignmentIcon />} 
                variant="outlined"
                onClick={() => onAssign(emergency.id)}
              >
                Assign Resources
              </Button>
              <Button 
                size="small" 
                startIcon={<EditIcon />} 
                variant="outlined"
                onClick={() => onUpdate(emergency.id)}
              >
                Update
              </Button>
              <Button 
                size="small" 
                startIcon={<CheckIcon />} 
                variant="contained" 
                color="success"
                onClick={() => onResolve(emergency.id)}
              >
                Solve
              </Button>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// Componente principal del dashboard
const EmergencyOperatorDashboard = () => {
  const dispatch = useDispatch();
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedEmergencyId, setSelectedEmergencyId] = useState(null);
  const [selectedResources, setSelectedResources] = useState([]);
  const [selectedResourcesPrev, setSelectedResourcesPrev] = useState([]);
  const [newEmergency, setNewEmergency] = useState({
    name: '',
    description: '',
    location: '',
    telephone_contact: '',
    latitude: '',
    longitude: '',
    status: 'Active'
  });
  const [updateEmergencyData, setUpdateEmergencyData] = useState({
    status: 'Pending',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [openMap, setOpenMap] = React.useState(false);
  // const emergencies = useSelector(state => state.emergencies.emergencies);
  // const emergenciesStatus = useSelector(state => state.emergencies.status);
  // const resources = useSelector(state => state.resources.resources);
  // const resourcesStatus = useSelector(state => state.resources.status);
  // const alerts = useSelector(state => state.alerts.alerts);
  // const alertsStatus = useSelector(state => state.alerts.status);
  const [emergencies, setEmergencies] = useState([]);
  const [resources, setResources] = useState([]);

   // Estadísticas
  const [activeEmergencies, setActiveEmergencies] = React.useState(0);
  const [pendingEmergencies, setPendingEmergencies] = React.useState(0);
  const [solvedEmergencies, setSolvedEmergencies] = React.useState(0);
  const [availableResources, setAvailableResources] = React.useState(0);
  const [assignedResources,setAssignedResources] = React.useState(0);
  const computeStatisticsEmergencies = (emergenciesIn) => {
    setActiveEmergencies(emergenciesIn.filter(e => e.status === 'Active').length)
    setPendingEmergencies(emergenciesIn.filter(e => e.status === 'Pending').length)
    setSolvedEmergencies(emergenciesIn.filter(e => e.status === 'Solved').length)
  }
  const computeStatisticsResources = (resourcesIn) => {
    setAvailableResources(resourcesIn.filter(r => r.status == 'Available' ).length)
    setAssignedResources(resourcesIn.filter(r => r.status == 'Busy' ).length)
    // setAssignedResources(resourcesIn.filter(r => typeof r.assignments !== 'undefined' && r.assignments.length > 0 && r.status == 'Busy' ).length)
    // setAvailableResources(resourcesIn.filter(r => r.status === 'undefined' || r.assignments.length == 0 ).length)
    // setAssignedResources(resourcesIn.filter(r => typeof r.assignments !== 'undefined' && r.assignments.length > 0 ).length)
  }

  
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
  };
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    // location: '',
    emergency_type: 'Other',
    priority: 'High',
    latitude: '',
    longitude: '',
    telephone_contact: '',
    status: 'Active'
    // selectedResource: ''
  });
  const handleLocationSelect = (lat, lng) => {
    setFormData(prevState => ({
      ...prevState,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
      // location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }));
    setOpenMap(false);
  };
  // useEffect(() => {
  //   // Cargar datos al montar el componente
  //   dispatch(fetchEmergencies());
  //   dispatch(fetchResources());
  //   dispatch(fetchAlerts());
  // }, [dispatch]);
  
  // const handleRefresh = () => {
  //   dispatch(fetchEmergencies());
  //   dispatch(fetchResources());
  //   dispatch(fetchAlerts());
  // };
  
  const fetchEmergencies = ()  => {
    const endpoint = APIProtocol + APIURL + '/api/alerts'
    fetch(endpoint, {
      method: 'GET', // or 'PUT'
      headers: {
        'Accept': 'application/json',
      }
    })
    .then(function(response) {
      if (!response.ok) {
        console.log(
          "Looks like there was a problem. Status Code: " + response.status
        );
        return;
      }
      response.json().then(function(data) {
        setEmergencies(data)
        console.log(data)
        computeStatisticsEmergencies(data)
        setIsLoading(false);
      });
    })
    .catch(function(err) {
      console.log("Error in Dashboard while fetching emergencies", err);
    });
  }

  const fetchResources = ()  => {
    const endpoint = APIProtocol + APIURL + '/api/devices'
    fetch(endpoint, {
      method: 'GET', // or 'PUT'
      headers: {
        'Accept': 'application/json',
      }
    })
    .then(function(response) {
      if (!response.ok) {
        console.log(
          "Looks like there was a problem. Status Code: " + response.status
        );
        return;
      }
      response.json().then(function(data) {
        setResources(data)
        console.log(data)
        computeStatisticsResources(data)
        setIsLoading(false);
      });
    })
    .catch(function(err) {
      console.log("Error in Dashboard while fetching emergencies", err);
    });
  }

  const fetchAssignments = async (resources) => {
    let endpoint = ''
    for (const resource of resources){
      endpoint = APIProtocol + APIURL + '/api/devices/' + resource.id + '/assignments'

      fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      })
      .then(function(response) {
        if (!response.ok) {
          console.log(
            "Looks like there was a problem. Status Code: " + response.status
          );
          return;
        }
        response.json().then(function(data) {
          resource.assignments = data
         
        });
      })
      .catch(function(err) {
        console.log("Error in Dashboard while fetching emergencies", err);
      })
    }
    return resources;
  }

  const fetchResourcesWithAssignments = ()  => {
    const endpoint = APIProtocol + APIURL + '/api/devices'
    fetch(endpoint, {
      method: 'GET', // or 'PUT'
      headers: {
        'Accept': 'application/json',
      }
    })
    .then(function(response) {
      if (!response.ok) {
        console.log(
          "Looks like there was a problem. Status Code: " + response.status
        );
        return;
      }
      response.json().then(function(data) {
        let resourcesWithAssignment = []
        resourcesWithAssignment = fetchAssignments(data).then(function(resourcesWithAssignment){
          setResources(resourcesWithAssignment)
          console.log("resourcesWithAssigments")
          console.log(resourcesWithAssignment)
          computeStatisticsResources(resourcesWithAssignment)
          setIsLoading(false);
        });
        
      });
    })
    .catch(function(err) {
      console.log("Error in Dashboard while fetching emergencies", err);
    });
  }

  useEffect(() => {
    fetchEmergencies()
    const idEmergencies = setInterval(() => (
      fetchEmergencies()
    ), 100000);
    // fetchResources()
    // const idResources = setInterval(() => (
    //   fetchResources()
    // ), 100000);
    fetchResourcesWithAssignments()
    const idResources = setInterval(() => (
      fetchResourcesWithAssignments()
    ), 100000);
    return () => clearInterval(idEmergencies), clearInterval(idResources) ;  
  }, []);

  // Filtrar emergencias por búsqueda
  const filteredEmergencies = emergencies.filter(emergency => 
    emergency.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emergency.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emergency.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
 

  
  // const activeAlerts = alerts.filter(a => !a.resolved).length;

  // useEffect(() => {
  //   // Cargar datos al montar el componente
  //   dispatch(fetchEmergencies());
  //   dispatch(fetchResources());
  //   dispatch(fetchAlerts());
  // }, [dispatch]);
  
  const handleRefresh = () => {
    fetchEmergencies()
    fetchResourcesWithAssignments()
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  const handleAssignResources = (emergencyId) => {
    setSelectedEmergencyId(emergencyId);
    setDialogType('assign');
    setOpenDialog(true);
  };

  const assignResourcesToEmergency = () => {
    console.log("Assigning Resources to Emergency")
    console.log("Emergency ID: ",selectedEmergencyId );
    console.log("Resources IDs", selectedResources)
    console.log("Resources IDs",[...selectedResources]);

    const endpoint = APIProtocol + APIURL + '/api/alerts/' + selectedEmergencyId + '/assign' 
    fetch(endpoint, {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        resourcesIDs: [...selectedResources]
      })
    })
    .then(function(response) {
      if (!response.ok) {
        console.log(
          "Looks like there was a problem assigning the resources to the emergency. Status Code: " + response.status
        );
        return;
      }
      response.json().then(function(data) {
        console.log("Assign Data : ", data)
        setIsLoading(false);
      });
    })
    .catch(function(err) {
      console.log("Error in Dashboard while fetching emergencies", err);
    });


  }
  const solveEmergency = (emergencyID) => {
    console.log("Solving Emergency")
    console.log("Emergency ID: ", emergencyID);
    setSelectedEmergencyId(emergencyID);
    setDialogType('solve');
    setOpenDialog(true);
  }

  const solveEmergencyAPICall = () =>{
    const endpoint = APIProtocol + APIURL + '/api/alerts/' + selectedEmergencyId
    console.log("Endpoint Update", endpoint)
    fetch(endpoint, {
      method: 'PATCH', // or 'PUT'
      headers: {
        // 'Accept': 'application/json',
        "Content-type": "application/json"
      },
      body: JSON.stringify({
        status: "Solved"
      }),
    })
    .then(function(response) {
      if (!response.ok) {
        console.log(
          "Looks like there was a problem. Status Code: " + response.status
        );
        return;
      }
      console.log("Succesfully solved the emergency")
      fetchEmergencies();
      setOpenDialog(false);
    })
    .catch(function(err) {
      console.log("Error in Create new Emergency while creating emergency", err);
    });
}


  const updateEmergency = () =>{
    console.log("Updating Emergency")
    const endpoint = APIProtocol + APIURL + '/api/alerts/' + selectedEmergencyId
    console.log("Endpoint Update", endpoint)
    fetch(endpoint, {
      method: 'PATCH',
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify({
        status: updateEmergencyData.status,
        description: updateEmergencyData.description
      }),
    })
    .then(function(response) {
      if (!response.ok) {
        console.log(
          "Looks like there was a problem. Status Code: " + response.status
        );
        return;
      }
      console.log("Succesfully updated the emergency")
      fetchEmergencies();
      setOpenDialog(false);
    })
    .catch(function(err) {
      console.log("Error while updating the emergency:", err);
    });
  }
  const createEmergency = () => {
    const newEmergency = {
      ...formData,
      status: 'Active',
    };
    console.log("DEBUG - Inside the function 2")
    console.log(newEmergency)
    console.log(JSON.stringify(newEmergency))
    const endpoint = APIProtocol + APIURL + '/api/alerts'
    fetch(endpoint, {
      method: 'POST', // or 'PUT'
      headers: {
        // 'Accept': 'application/json',
        "Content-type": "application/json"
      },
      body: JSON.stringify(newEmergency),
    })
    .then(function(response) {
      if (!response.ok) {
        console.log(
          "Looks like there was a problem. Status Code: " + response.status
        );
        return;
      }
      console.log("Succesfully created new emergency")
      // Mostrar mensaje de éxito y limpiar el formulario
      setFormData({
        name: '',
        description: '',
        emergency_type: 'Other',
        priority: 'High',
        latitude: '',
        longitude: '',
        telephone_contact: '',
        status: 'Active'
        // selectedResource: ''
      });
      // Ocultar el mensaje después de 3 segundos
      fetchEmergencies();
      // setOpenDialog(false);
    })
    .catch(function(err) {
      console.log("Error in Create new Emergency while creating emergency", err);
    });
  };

  const handleDialogs = () => {
    switch(dialogType){
      case 'create':
        createEmergency();
        break;
      case 'assign':
        assignResourcesToEmergency();
        break;
      case 'solve':
        // solveEmergency();
        solveEmergencyAPICall();
        break;
      case 'update':
        updateEmergency();
        break;
    }
    fetchResourcesWithAssignments();
    fetchEmergencies()
    setOpenDialog(false)
  }

  
  const handleUpdateEmergency = (emergencyId) => {
    const emergency = emergencies.find(e => e.id === emergencyId);
    if (emergency) {
      setUpdateEmergencyData({
        status: emergency.status,
        description: emergency.description
      });
    }
    setSelectedEmergencyId(emergencyId);
    setDialogType('update');
    setOpenDialog(true);
  };
  
  const handleResolveEmergency = (emergencyId) => {
    setSelectedEmergencyId(emergencyId);
    setDialogType('solve');
    setOpenDialog(true);
  };
  
  const findResourcesToEmergencyByID = (emergencyID) => {
    const prevResources = resources
      .filter(r => r.assignments != undefined  && r.assignments[0] != undefined   && r.assignments[0].id == emergencyID)
      .map(resource => (resource.id) )
    console.log("ID = ", emergencyID)
    console.log("prevResources = ", prevResources)
    console.log("resources = ", resources);
    return prevResources
  }

  const handleOpenDialog = () =>{
    switch(dialogType){
      case 'create':
        break;
      case 'assign':
        setSelectedResourcesPrev(findResourcesToEmergencyByID(selectedEmergencyId))
        break;
      case 'solve':
        break;
      case 'update':
        break;
    }
    fetchResourcesWithAssignments();
    fetchEmergencies()
  }

  useEffect(() => {
    if (openDialog) {
      handleOpenDialog()
    }
  }, [openDialog]);

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEmergencyId(null);
    console.log("selectedResources = ", selectedResources)
    setSelectedResources([]);
  };
  
  const handleResourceSelection = (event) => {
    setSelectedResources(event.target.value);
    setSelectedResourcesPrev(event.target.value);
    console.log("resourceSelection = ", event.target)
  };
  
  const handleNewEmergencyChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleUpdateEmergencyChange = (event) => {
    const { name, value } = event.target;
    setUpdateEmergencyData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // const handleConfirmDialog = () => {
  //   // Aquí se implementaría la lógica para cada tipo de acción
  //   if (dialogType === 'assign') {
  //     console.log(`Assignant recursos ${selectedResources} a l'emergència ${selectedEmergencyId}`);
  //     dispatch(assignResourcesToEmergency({ emergencyId: selectedEmergencyId, resourceIds: selectedResources }));
  //   } else if (dialogType === 'update') {
  //     console.log(`Actualitzant emergència ${selectedEmergencyId}`, updateEmergencyData);
  //     dispatch(updateEmergency({ 
  //       id: selectedEmergencyId, 
  //       emergencyData: updateEmergencyData
  //     }));
  //   } else if (dialogType === 'resolve') {
  //     console.log(`Resolent emergència ${selectedEmergencyId}`);
  //     dispatch(resolveEmergency(selectedEmergencyId));
  //   } else if (dialogType === 'create') {
  //     // Aquí se implementaría la lógica para crear una nueva emergencia
  //     console.log('Creant nova emergència', newEmergency);
  //     dispatch(createEmergency({
  //       ...newEmergency,
  //       timestamp: new Date().toISOString()
  //     }));
      
  //     // Resetear el formulario
  //     setNewEmergency({
  //       title: '',
  //       description: '',
  //       location: '',
  //       contactPhone: '',
  //       latitude: 41.3851,
  //       longitude: 2.1734,
  //       status: 'active'
  //     });
  //   }
  //   handleCloseDialog();
  // };

  // const handleNewEmergency = () => {
  //   // Aquí se implementaría la lógica para cada tipo de acción
  //   if (dialogType === 'assign') {
  //     console.log(`Assignant recursos ${selectedResources} a l'emergència ${selectedEmergencyId}`);
  //     // dispatch(assignResourcesToEmergency({ emergencyId: selectedEmergencyId, resourceIds: selectedResources }));
  //   } else if (dialogType === 'update') {
  //     console.log(`Actualitzant emergència ${selectedEmergencyId}`, updateEmergencyData);
  //     // dispatch(updateEmergency({ 
  //     //   id: selectedEmergencyId, 
  //     //   emergencyData: updateEmergencyData
  //     // }));
  //   } else if (dialogType === 'resolve') {
  //     console.log(`Resolent emergència ${selectedEmergencyId}`);
  //     // dispatch(resolveEmergency(selectedEmergencyId));
  //   } else if (dialogType === 'create') {
  //     // Aquí se implementaría la lógica para crear una nueva emergencia
  //     console.log('Creant nova emergència', newEmergency);
  //     // dispatch(createEmergency({
  //     //   ...newEmergency,
  //     //   timestamp: new Date().toISOString()
  //     // }));
      
  //     // Resetear el formulario
  //     setNewEmergency({
  //       name: '',
  //       description: '',
  //       location: '',
  //       telephone_contact: '',
  //       latitude: '',
  //       longitude: '',
  //       status: 'Active'
  //     });
  //   }
  //   handleCloseDialog();
  // };
  
  // Verificar si los datos están cargando
  // const isLoading = 
  //   emergenciesStatus === 'loading' || 
  //   resourcesStatus === 'loading' || 
  //   alertsStatus === 'loading';
    
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Operator Main Panel
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
            title="Available Resources" 
            value={availableResources} 
            color="info.main" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatPanel 
            title="Assigned Resources" 
            value={assignedResources} 
            color="secondary.main" 
          />
        </Grid>
        {/* <Grid item xs={12} sm={6} md={2}>
          <StatPanel 
            title="Alertes Actives" 
            value={activeAlerts} 
            color="error.main" 
          />
        </Grid> */}
      </Grid>
      
      {/* Tabs y búsqueda */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Emergències" />
            <Tab label="Recursos" />
            <Tab label="Alertes" />
          </Tabs>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Cercar..."
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} />
              }}
            />
            
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              sx={{ ml: 2 }}
              onClick={() => {
                setDialogType('create');
                setOpenDialog(true);
              }}
            >
              Nova Emergència
            </Button>
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
            {/* Tab de Emergencias */}
            {tabValue === 0 && (
              <Box>
                {filteredEmergencies.length === 0 ? (
                  <Alert severity="info">No s'han trobat emergències</Alert>
                ) : (
                  filteredEmergencies.map(emergency => (
                    <EmergencyCard 
                      key={emergency.id}
                      emergency={emergency}
                      onAssign={handleAssignResources}
                      onUpdate={handleUpdateEmergency}
                      onResolve={solveEmergency}
                      resources={resources}
                    />
                  ))
                )}
              </Box>
            )}
            
            {/* Tab de Recursos */}
            {tabValue === 1 && (
              <Box>
                <List>
                  {resources.length === 0 ? (
                    <Alert severity="info">Resources Not Found</Alert>
                  ) : (
                    resources.map(resource => (
                      <ListItem 
                        key={resource.id}
                        secondaryAction={
                          <Chip 
                            label={resource.status} 
                            color={resource.status == 'Available' ? 'success' :'secondary'} 
                            size="small"
                          />
                        }
                      >
                        <ListItemIcon>
                          {resource.type === 'ambulance' ? (
                            <PhoneIcon />
                          ) : resource.type === 'police' ? (
                            <LocationIcon />
                          ) : (
                            <TimeIcon />
                          )}
                        </ListItemIcon>
                        <ListItemText 
                          primary={resource.name} 
                          secondary={`Type: ${resource.resource_type} | Location: Lat: ${resource.location_resource_data.latitude} Long: ${resource.location_resource_data.longitude}`} 
                        />
                      </ListItem>
                    ))
                  )}
                </List>
              </Box>
            )}
            
            {/* Tab de Alertas */}
            {/* {tabValue === 2 && (
              <Box>
                <List>
                  {alerts.length === 0 ? (
                    <Alert severity="info">No s'han trobat alertes</Alert>
                  ) : (
                    alerts.map(alert => (
                      <ListItem 
                        key={alert.id}
                        secondaryAction={
                          <IconButton 
                            edge="end" 
                            color={alert.resolved ? 'default' : 'error'}
                            disabled={alert.resolved}
                            onClick={() => {
                              console.log(`Marcant alerta ${alert.id} com resolta`);
                              dispatch(resolveAlert(alert.id));
                            }}
                          >
                            {alert.resolved ? <CheckIcon /> : <AlertIcon />}
                          </IconButton>
                        }
                      >
                        <ListItemIcon>
                          <AlertIcon color={alert.resolved ? 'disabled' : 'error'} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={alert.title} 
                          secondary={`${alert.description} | ${new Date(alert.timestamp).toLocaleString('ca-ES')}`} 
                        />
                      </ListItem>
                    ))
                  )}
                </List>
              </Box>
            )} */}
          </>
        )}
      </Paper>
      
      {/* Diálogos */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'assign' && 'Assign Resources'}
          {dialogType === 'update' && 'Update Emergency'}
          {dialogType === 'solve' && 'Solve Emergency'}
          {dialogType === 'create' && 'Create New Emergency'}
        </DialogTitle>
        <DialogContent>
          {/* {dialogType === 'assign' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Available Resources</InputLabel>
              <Select
                multiple
                value={selectedResources}
                onChange={handleResourceSelection}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const resource = resources.find(r => r.id === value);
                      return (
                        <Chip key={value} label={resource?.name || value} />
                      );
                    })}
                  </Box>
                )}
              >
                {resources
                  .filter(resource => !resource.emergencyId)
                  .map(resource => (
                    <MenuItem key={resource.id} value={resource.id}>
                      {resource.name} - {resource.type}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          )} */}
          {dialogType === 'assign' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Available Resources</InputLabel>
              <Select
                multiple
                value={selectedResourcesPrev}
                // value={selectedResources}
                onChange={handleResourceSelection}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const resource = resources.find(r => r.id === value);
                      return (
                        <Chip key={value} label={resource?.name || value} />
                      );
                    })}
                  </Box>
                )}
              >
                {resources
                  // .filter(resource =>  resource.assignments != undefined && resource.assignments[0] == undefined)
                  .map(resource => (
                    <MenuItem key={resource.id} value={resource.id}>
                      {resource.name} - {resource.type}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          )}
          
          {dialogType === 'update' && (
            <Box component="form" sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>State</InputLabel>
                    <Select
                      name="status"
                      value={updateEmergencyData.status}
                      onChange={handleUpdateEmergencyChange}
                      label="State"
                    >
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="Solved">Solved</MenuItem>
                      <MenuItem value="Archived">Archived</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Updated Description"
                    name="description"
                    value={updateEmergencyData.description}
                    onChange={handleUpdateEmergencyChange}
                    multiline
                    rows={4}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
          
          {dialogType === 'solve' && (
            <Typography>
              Are you sure the emergency is solved?
            </Typography>
          )}
          
          {dialogType === 'create' && (
            <Box component="form" sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Title"
                    name="name"
                    value={formData.name}
                    onChange={handleNewEmergencyChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleNewEmergencyChange}
                    multiline
                    rows={4}
                    required
                  />
                </Grid>
                {/* <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Location"
                    name="location"
                    value={newEmergency.location}
                    onChange={handleNewEmergencyChange}
                    required
                  />
                </Grid> */}
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<LocationOnIcon />}
                    onClick={() => setOpenMap(true)}
                  >
                    Select location
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Latitude"
                    name="latitude"
                    type="number"
                    value={formData.latitude}
                    onChange={handleNewEmergencyChange}
                    required

                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Longitude"
                    name="longitude"
                    type="number"
                    value={formData.longitude}
                    onChange={handleNewEmergencyChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      name="priority"
                      value={formData.priority}
                      label="Priority"
                      onChange={handleNewEmergencyChange}
                    >
                      <MenuItem value="Critical">Critical</MenuItem>
                      <MenuItem value="High">High</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="Low">Low</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Emergency Type</InputLabel>
                    <Select
                      name="emergency_type"
                      value={formData.emergency_type}
                      label="Emergency Type"
                      onChange={handleNewEmergencyChange}
                    >
                      <MenuItem value="Fire">Fire</MenuItem>
                      <MenuItem value="Medical">Medical</MenuItem>
                      <MenuItem value="Accident">Accident</MenuItem>
                      <MenuItem value="Natural Disaster">Natural Disaster</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contact Telephone"
                    name="telephone_contact"
                    value={formData.telephone_contact}
                    onChange={handleNewEmergencyChange}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Estat</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleNewEmergencyChange}
                      label="Status"
                    >
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="Solved">Solved</MenuItem>
                      <MenuItem value="Archived">Archived</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>

        <Modal
          open={openMap}
          onClose={() => setOpenMap(false)}
          aria-labelledby="map-modal-title"
        >
          <Box sx={modalStyle}>
            <Typography id="map-modal-title" variant="h6" component="h2" gutterBottom>
              Select a location in the Map
            </Typography>
            <Box sx={{ height: '500px', width: '100%' }}>
              <MapContainer
                center={[41.3879, 2.16992]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapComponent onLocationSelect={handleLocationSelect} />
              </MapContainer>
            </Box>
          </Box>
        </Modal>


        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CloseIcon />}>
            Cancel
          </Button>
          <Button 
            onClick={handleDialogs} 
            variant="contained" 
            color="primary"
            startIcon={<CheckIcon />}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmergencyOperatorDashboard;
