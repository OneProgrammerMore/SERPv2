import React from "react";
import { useDispatch } from "react-redux";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Modal,
  Alert,
} from "@mui/material";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import LocationOnIcon from "@mui/icons-material/LocationOn";

import { createEmergency } from "../../redux/slices/emergenciesSlice";

const MapComponent = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  return null;
};

const NovaEmergencia = () => {
  const dispatch = useDispatch();

  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    emergency_type: "Other",
    priority: "High",
    latitude: "",
    longitude: "",
    telephone_contact: "",
  });

  const [openMap, setOpenMap] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleLocationSelect = (lat, lng) => {
    setFormData((prevState) => ({
      ...prevState,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
    setOpenMap(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Crear nueva incidencia con ID único y fecha
    const newIncident = {
      ...formData,
      status: "Active",
    };

    try {
      const resultAction = await dispatch(createEmergency(newIncident));

      if (resultAction.payload.ok) {
        console.log("Submitted successfully:", resultAction.payload);

        setShowSuccess(true);
        setFormData({
          name: "",
          description: "",
          location: "",
          emergency_type: "Other",
          priority: "High",
          latitude: "",
          longitude: "",
          telephone_contact: "",
        });
        // Ocultar el mensaje después de 3 segundos
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      } else {
        console.error("Submission failed:", resultAction.payload);
      }
    } catch (error) {
      console.log("Error during emergency creation:", error);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      description: "",
      // location: '',
      emergency_type: "Other",
      priority: "High",
      latitude: "",
      longitude: "",
      // selectedResource: ''
      telephone_contact: "",
    });
  };

  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "80%",
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 4,
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        New Emergency
      </Typography>

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          A new emergency has been succesfully created.
        </Alert>
      )}

      <Paper sx={{ p: 3, mt: 3 }} elevation={0}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Title"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={4}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Grid>

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

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Latitude"
                name="latitude"
                value={formData.latitude}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Longitude"
                name="longitude"
                value={formData.longitude}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Emergency Type</InputLabel>
                <Select
                  name="emergency_type"
                  value={formData.emergency_type}
                  label="Emergency Type"
                  onChange={handleChange}
                >
                  <MenuItem value="Fire">Fire</MenuItem>
                  <MenuItem value="Medical">Medical</MenuItem>
                  <MenuItem value="Accident">Accident</MenuItem>
                  <MenuItem value="Natural Disaster">Natural Disaster</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Priority</InputLabel>
                <Select
                  name="priority"
                  value={formData.priority}
                  label="Priority"
                  onChange={handleChange}
                >
                  <MenuItem value="Critical">Critical</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Telephone"
                name="telephone_contact"
                value={formData.telephone_contact}
                onChange={handleChange}
                required
              />
            </Grid>

            {/* <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Recurs Assignat</InputLabel>
                <Select
                  name="selectedResource"
                  value={formData.selectedResource}
                  label="Assigned Resource"
                  onChange={handleChange}
                >
                  {resources.map((resource) => (
                    <MenuItem key={resource.id} value={resource.id}>
                      {resource.name} - {resource.type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid> */}

            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 2,
                  height: "100%",
                  alignItems: "center",
                }}
              >
                <Button variant="outlined" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button variant="contained" type="submit">
                  New Emergency
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Modal
        open={openMap}
        onClose={() => setOpenMap(false)}
        aria-labelledby="map-modal-title"
      >
        <Box sx={modalStyle}>
          <Typography
            id="map-modal-title"
            variant="h6"
            component="h2"
            gutterBottom
          >
            Select a location in the Map
          </Typography>
          <Box sx={{ height: "500px", width: "100%" }}>
            <MapContainer
              center={[41.3879, 2.16992]}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
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
    </Box>
  );
};

export default NovaEmergencia;
