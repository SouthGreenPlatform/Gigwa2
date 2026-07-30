import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, FloatingLabel, Alert, Spinner } from 'react-bootstrap';
import { useApi } from '../contexts/Authentication';
import { useSearchParams } from 'react-router-dom';
import endpoints from "../endpoints";
import "../styles/reset-password-modal.scss";

const PasswordResetModal = ({ show, handleClose, forceStep2 = false }) => {
  const api = useApi();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertVariant, setAlertVariant] = useState('success');
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessionID,setSessionID]=useState("");


  function formatJsessionIdCookie() {
    const cookie = document.cookie
  const cookies = cookie.split(';').map(c => c.trim());
  console.log("session cookie: ", cookie)
  const jsessionCookie = cookies.find(c => c.startsWith('JSESSIONID='));
  if (!jsessionCookie) return null;

  // jsessionCookie is like "JSESSIONID=value:id"
  const [, value] = jsessionCookie.split('=');

  // Extract the part after the colon
  const colonIndex = value.indexOf(':');
  if (colonIndex === -1) return null; // no colon found

  const reformattedValue = value.slice(colonIndex + 1); // after colon
  return `JSESSIONID:${reformattedValue}`;
}
  useEffect(() => {
    if (forceStep2) {
        console.log("Session ID", formatJsessionIdCookie())
      setStep(2);
    }
  }, [forceStep2]);
 useEffect(() => {
    if (searchParams.get('reset') === 'true') {
      setStep(2);
    }
  }, [searchParams]);
  const resetStates = () => {
    setStep(1);
    setEmail('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setLoading(false);
    setAlertMsg('');
    setAlertVariant('success');
  };

  const handleCloseModal = () => {
    searchParams.delete('reset');
setSearchParams(searchParams);

    handleClose();
    resetStates();
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlertMsg('');

    try {
      
      await api.post(
        endpoints.LOST_PASSWORD_URL,
        `email=${encodeURIComponent(email)}`,
        
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            accept: "application/json",
          },
        }
      );

      // Replace with real API call:
      // await axios.post('/api/send-reset-email', { email });

      setAlertVariant('success');
      setAlertMsg('If your email matches a valid account then a reset code has been sent to your email.');
      searchParams.set('reset', 'true');
      setSearchParams(searchParams);

    } catch (error) {
      setAlertVariant('danger');
      setAlertMsg('Failed to send reset code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlertMsg('');

    if (newPassword.length < 8) {
      setAlertVariant('danger');
      setAlertMsg('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setAlertVariant('danger');
      setAlertMsg('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      // Simulate API call
      await api.post(
        endpoints.RESET_PASSWORD_URL,
        `code=${code}&newPassword=${newPassword}`,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            accept: "application/json",
            Cookie: formatJsessionIdCookie(),
          },
        }
      );

      // Replace with real API call:
      // await axios.post('/api/reset-password', { email, code, newPassword });

      setAlertVariant('success');
      setAlertMsg('Password reset successful. You can now log in.');
      handleCloseModal()
    } catch (error) {
      setAlertVariant('danger');
      setAlertMsg('Invalid code or error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleCloseModal} centered className="reset-password-modal">
      <Modal.Header closeButton closeVariant="white">
        <Modal.Title>Password Reset</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {alertMsg && <Alert variant={alertVariant}>{alertMsg}</Alert>}

        {step === 1 ? (
          <Form onSubmit={handleEmailSubmit}>
            <FloatingLabel controlId="emailInput" label="Email address" className="mb-3">
              <Form.Control
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </FloatingLabel>

            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : 'Send Reset Code'}
            </Button>
          </Form>
        ) : (
          <Form onSubmit={handlePasswordReset}>
            <FloatingLabel controlId="codeInput" label="Reset Code" className="mb-3">
              <Form.Control
                type="text"
                placeholder="Enter code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </FloatingLabel>

            <FloatingLabel controlId="newPassword" label="New Password" className="mb-3">
              <Form.Control
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
              <Form.Text className="text-muted">Minimum 8 characters</Form.Text>
            </FloatingLabel>

            <FloatingLabel controlId="confirmPassword" label="Confirm New Password" className="mb-3">
              <Form.Control
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </FloatingLabel>

            <Button variant="success" type="submit" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : 'Reset Password'}
            </Button>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default PasswordResetModal;
