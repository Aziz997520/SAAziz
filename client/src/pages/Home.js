import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <Container>
      <Row className="text-center mb-5">
        <Col>
          <h1>Welcome to Servini</h1>
          <p className="lead">
            Connecting clients with professional contractors for your construction and renovation needs
          </p>
        </Col>
      </Row>

      {!user && (
        <Row className="justify-content-center mb-5">
          <Col md={6} className="text-center">
            <Button
              as={Link}
              to="/register"
              variant="primary"
              size="lg"
              className="me-3"
            >
              Get Started
            </Button>
            <Button
              as={Link}
              to="/login"
              variant="outline-primary"
              size="lg"
            >
              Login
            </Button>
          </Col>
        </Row>
      )}

      <Row>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>For Clients</Card.Title>
              <Card.Text>
                Post your construction or renovation projects and find qualified contractors in your area.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>For Contractors</Card.Title>
              <Card.Text>
                Showcase your portfolio, find new projects, and grow your business with our platform.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Easy Communication</Card.Title>
              <Card.Text>
                Built-in messaging system to facilitate smooth communication between clients and contractors.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-5">
        <Col className="text-center">
          <h2>How It Works</h2>
          <p>
            Whether you're a client looking for professional contractors or a contractor seeking new opportunities,
            Servini makes it easy to connect and get the job done.
          </p>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;