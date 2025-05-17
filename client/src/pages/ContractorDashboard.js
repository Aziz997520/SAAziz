import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Tab, Tabs } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ContractorDashboard = () => {
  const { user } = useAuth();
  const [portfolioProjects, setPortfolioProjects] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    completion_date: '',
    client_name: '',
    images: []
  });

  useEffect(() => {
    fetchPortfolioProjects();
    fetchAvailableProjects();
  }, []);

  const fetchPortfolioProjects = async () => {
    try {
      const response = await axios.get('/api/portfolio/contractor');
      setPortfolioProjects(response.data);
    } catch (error) {
      setError('Failed to fetch portfolio projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableProjects = async () => {
    try {
      const response = await axios.get('/api/projects/available');
      setAvailableProjects(response.data);
    } catch (error) {
      setError('Failed to fetch available projects');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    setFormData(prev => ({
      ...prev,
      images: [...e.target.files]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'images') {
          formData.images.forEach(image => {
            formDataToSend.append('images', image);
          });
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      await axios.post('/api/portfolio', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setShowModal(false);
      fetchPortfolioProjects();
      setFormData({
        title: '',
        description: '',
        completion_date: '',
        client_name: '',
        images: []
      });
    } catch (error) {
      setError('Failed to create portfolio project');
    }
  };

  const handleApplyToProject = async (projectId) => {
    try {
      await axios.post(`/api/projects/${projectId}/apply`);
      fetchAvailableProjects();
    } catch (error) {
      setError('Failed to apply to project');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <Tabs defaultActiveKey="portfolio" className="mb-4">
        <Tab eventKey="portfolio" title="My Portfolio">
          <Row className="mb-4">
            <Col>
              <h2>My Portfolio</h2>
            </Col>
            <Col xs="auto">
              <Button onClick={() => setShowModal(true)}>Add Project</Button>
            </Col>
          </Row>

          {error && <div className="alert alert-danger">{error}</div>}

          <Row>
            {portfolioProjects.map(project => (
              <Col md={6} lg={4} key={project.id} className="mb-4">
                <Card>
                  {project.images?.[0] && (
                    <Card.Img variant="top" src={project.images[0]} />
                  )}
                  <Card.Body>
                    <Card.Title>{project.title}</Card.Title>
                    <Card.Text>{project.description}</Card.Text>
                    <div className="mb-2">
                      <strong>Client:</strong> {project.client_name}
                    </div>
                    <div className="mb-2">
                      <strong>Completed:</strong> {new Date(project.completion_date).toLocaleDateString()}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Tab>

        <Tab eventKey="available" title="Available Projects">
          <Row className="mb-4">
            <Col>
              <h2>Available Projects</h2>
            </Col>
          </Row>

          <Row>
            {availableProjects.map(project => (
              <Col md={6} lg={4} key={project.id} className="mb-4">
                <Card>
                  <Card.Body>
                    <Card.Title>{project.title}</Card.Title>
                    <Card.Text>{project.description}</Card.Text>
                    <div className="mb-2">
                      <strong>Budget:</strong> ${project.budget}
                    </div>
                    <div className="mb-2">
                      <strong>Location:</strong> {project.location}
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApplyToProject(project.id)}
                    >
                      Apply
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Tab>
      </Tabs>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Portfolio Project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Client Name</Form.Label>
              <Form.Control
                type="text"
                name="client_name"
                value={formData.client_name}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Completion Date</Form.Label>
              <Form.Control
                type="date"
                name="completion_date"
                value={formData.completion_date}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Project Images</Form.Label>
              <Form.Control
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
              />
            </Form.Group>
            <Button type="submit">Add Project</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ContractorDashboard; 