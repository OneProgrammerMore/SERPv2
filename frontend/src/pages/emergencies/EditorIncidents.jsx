import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableSortLabel
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { fetchEmergencies, deleteEmergency, updateEmergency } from '../../redux/slices/emergenciesSlice';


const EditorIncidents = () => {
  
  const [emergencies, setEmergencies] = React.useState([]);
  const emergenciesStore = useSelector(state => state.emergencies.emergencies);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [selectedEmergency, setSelectedEmergency] = React.useState(null);
  const [orderDirection, setOrderDirection] = React.useState('desc');
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    status: '',
    priority: '',
    emergency_type: ''
  });
  const dispatch = useDispatch();

  useEffect(() => {
    try {
      dispatch(fetchEmergencies());
    } catch (error) {
      console.error('Error al cargar las incidencias:', error);
    }
  }, []);

  // Sync Redux state to local state
  useEffect(() => {
    if (emergenciesStore) {
      setEmergencies(emergenciesStore);
    }
  }, [emergenciesStore]);
    

  // Función auxiliar para ordenar incidencias
  const sortEmergencies= (emergenciesList, direction) => {
    return [...emergenciesList].sort((a, b) => {
      // Primero ordenar por estado (activos arriba, resueltos abajo)
      if (a.status !== b.status) {
        return a.status === 'Active' ? -1 : 1;
      }

      // Si ambos tienen el mismo estado, ordenar por prioridad
      const priorityOrder = {
        Critical: 4,
        High: 3,
        Medium: 2,
        Low: 1
      };
      
      if (direction === 'desc') {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  // Función para ordenar incidencias
  const handleSort = () => {
    const newDirection = orderDirection === 'asc' ? 'desc' : 'asc';
    const sortedEmergencies = sortEmergencies(emergencies, newDirection);
    setEmergencies(sortedEmergencies);
    setOrderDirection(newDirection);
  };

  const handleEditClick = (emergency) => {
    setSelectedEmergency(emergency);
    setFormData({
      name: emergency.name,
      description: emergency.description,
      status: emergency.status,
      priority: emergency.priority,
      emergency_type: emergency.emergency_type
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEmergency(null);
    setFormData({
      name: '',
      description: '',
      status: '',
      priority: '',
      emergency_type: ''
    });
  };
  
  const handleUpdate = async (event) => {
    event.preventDefault();
    const updatedEmergency = {
      ...formData,
    };
    const id = selectedEmergency.id;
    try{ 

      const response = await dispatch(updateEmergency({id, updatedEmergency})).unwrap()
      console.log(response)
      if (!response.ok){
        console.log(
          "Looks like there was a problem. Status Code: ", response
        );
        return;
      }else{
        dispatch(fetchEmergencies());
        handleCloseDialog();
      }
    }catch(err) {
      console.log("Error in Create new Emergency while creating emergency", err);
    }
  };

  const handleDelete = async (emergencyID) => {

    const response = await dispatch(deleteEmergency(emergencyID));
    try{
      if (!response.payload.ok){
        console.log(
          "Looks like there was a problem. Status Code: ", response
        );
        return;
      }else{
        console.log("Succesfully updated the emergency")
        dispatch(fetchEmergencies());
      }  
    } catch(err) {
      console.log("Error in Create new Emergency while creating emergency", err);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Emergencies Editor
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>State</TableCell>
              <TableCell>
                <TableSortLabel
                  active={true}
                  direction={orderDirection}
                  onClick={handleSort}
                >
                  Priority
                </TableSortLabel>
              </TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Last Update</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {emergencies.map((emergency) => (
              <TableRow key={emergency.id}>
                <TableCell>{emergency.name}</TableCell>
                <TableCell>{emergency.description}</TableCell>
                <TableCell>
                  <Chip
                    label={emergency.status === 'Active' ? 'Active' : 'Solved'}
                    color={emergency.status === 'Active' ? 'error' : 'success'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={
                      emergency.priority === 'Critical' ? 'Critical' :
                      emergency.priority === 'High' ? 'High' :
                      emergency.priority === 'Medium' ? 'Medium' :
                      emergency.priority === 'Low' ? 'Low' : 'Unknown'
                    }
                    color={
                      emergency.status === 'Solved' ? 'success' :
                      emergency.priority === 'Critical' ? 'error' :
                      emergency.priority === 'High' ? 'warning' :
                      emergency.priority === 'Medium' ? 'warning' : 'info'
                    }
                    sx={{
                      '&.MuiChip-root': {
                        backgroundColor: 
                          emergency.status === 'Solved' ? '#4caf50' :
                          emergency.priority === 'Critical' ? '#ff0000' :
                          emergency.priority === 'High' ? '#ff9800' :
                          emergency.priority === 'Medium' ? '#ffeb3b' : '#2196f3',
                        color: 'white'
                      }
                    }}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={
                      emergency.emergency_type === 'Fire' ? 'Fire' :
                      emergency.emergency_type === 'Medical' ? 'Medical Emergency' :
                      emergency.emergency_type === 'Accident' ? 'Accident' :
                      emergency.emergency_type === 'Natural Disaster' ? 'Natural Disaster' : 'Other'
                    }
                    color="default"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(emergency.time_updated ? emergency.time_updated : emergency.time_created).toLocaleString()}
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleEditClick(emergency)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(emergency.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Emergency</DialogTitle>
        <form onSubmit={handleUpdate}>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    label="Status"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Solved">Sovled</MenuItem>
                    <MenuItem value="Archived">Archived</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Prioritat</InputLabel>
                  <Select
                    name="priority"
                    value={formData.priority}
                    label="Priority"
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <MenuItem value="Critical">Critical</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="Low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Emergency Type</InputLabel>
                  <Select
                    name="emergency_type"
                    value={formData.emergency_type}
                    label="Emergency Type"
                    onChange={(e) => setFormData({ ...formData, emergency_type: e.target.value })}
                  >
                    <MenuItem value="Fire">Fire</MenuItem>
                    <MenuItem value="Medical">Medical</MenuItem>
                    <MenuItem value="Accident">Accident</MenuItem>
                    <MenuItem value="Natural Disaster">Natural Disaster</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel·lar</Button>
          <Button  type="submit" variant="contained">
            Guardar
          </Button>
        </DialogActions>
        </DialogContent>
        </form>
      </Dialog>
    </Box>
  );
};

export default EditorIncidents; 