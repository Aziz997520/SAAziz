import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ContractorProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        if (data.user.role !== 'contractor') {
          navigate('/client-profile');
          return;
        }
        setProfile(data.user);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (!profile) {
    return <Typography>Error loading profile</Typography>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Profile Header */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={3}>
              <Avatar
                src={profile.profileImage}
                alt={`${profile.firstName} ${profile.lastName}`}
                sx={{ width: 100, height: 100 }}
              />
              <Box>
                <Typography variant="h4">
                  {profile.firstName} {profile.lastName}
                </Typography>
                <Typography variant="subtitle1" color="textSecondary">
                  Contractor
                </Typography>
                <Typography variant="body1">
                  Rating: {profile.rating ? `${profile.rating}/5` : 'No ratings yet'}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Contact Information
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Email"
                      secondary={profile.email}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Phone"
                      secondary={profile.phone || 'Not provided'}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Offers Statistics */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Offers Overview
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Total Offers"
                      secondary={profile.totalOffers || 0}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Active Offers"
                      secondary={profile.activeOffers || 0}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Bio */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  About Me
                </Typography>
                <Typography variant="body1">
                  {profile.bio || 'No bio provided'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Skills */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Professional Skills
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {profile.skills ? (
                    JSON.parse(profile.skills).map((skill, index) => (
                      <Chip key={index} label={skill} color="primary" />
                    ))
                  ) : (
                    <Typography>No skills listed</Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ContractorProfile; 