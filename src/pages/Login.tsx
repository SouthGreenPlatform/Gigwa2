import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useNavigate,useSearchParams } from "react-router-dom";
import Button from "react-bootstrap/Button";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Form from "react-bootstrap/Form";
import { useAuth } from "../contexts/Authentication.tsx";
import axios from "axios";
import endpoints from "../endpoints";
import PasswordResetModal from "../components/ResetPassword.tsx";
import config from "../config/config";
import { getConfigParam } from "../tools/commons";
import "../styles/login.scss";
interface FormData {
  username: string;
  password: string;
}
interface User {
  token: string;
}
interface LoginProps {
  resetOnMount?: boolean;
}

// Exported login API call
export async function loginRequest(username?: string, password?: string) {
  const response = await axios.post(
    `${endpoints.LOGIN_URL}`,
    username ? { username, password } : null,
    {
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
    }
  );
  return response.data;
}

function Login({ resetOnMount = false }: LoginProps) {
  const casLoginUrl = `${config.INSTANCE_URL}/initiateCasLogin.do`;

  const [searchParams] = useSearchParams();
  const [forceStep2, setForceStep2] = useState(false);
  useEffect(() => {
    if (resetOnMount || searchParams.get('reset') === 'true') {
      setShowResetModal(true);
      setForceStep2(true);
    }
  }, [searchParams, resetOnMount]);
  const [showResetModal,setShowResetModal] = useState(false)
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    username: "",
    password: "",
  });
  const [token, setToken] = useState<string>(""); // Stocker le token indépendamment
  const [user, setUser] = useState<User>({ token: "" });
  useEffect(() => {
    setUser({ token });
  }, [token]);
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  const { login, isAuthenticated, username } = useAuth();
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated]);

  const [adminEmail, setAdminEmail] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    getConfigParam("adminEmail").then(setAdminEmail);
  }, []);

  // handleSubmit now just prepares and calls loginRequest
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const data = await loginRequest(formData.username, formData.password);
      console.log("Token returned: ", data.token);
      // localStorage.setItem("auth_token", data.token); // No longer needed if using context only
      login(formData.username, data.token);
      navigate('/');
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 403) {
          alert("Access denied: Invalid username or password.");
        } else {
          alert(`An error occurred: ${error.response.status} - ${error.response.data.message || "Unknown error"}`);
        }
      } else if (error.request) {
        console.error("No response received:", error.request);
        alert("No response from the server. Please try again later.");
      } else {
        console.error("Error setting up the request:", error.message);
        alert("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="login-page-wrapper">
      {!isAuthenticated ? (
        <>
          <div className="login-card">
            <h2 className="login-title">Login</h2>
            <Form onSubmit={handleSubmit} className="w-100">
              <Form.Group className="login-field" controlId="formBasicEmail">
                <FloatingLabel
                  controlId="floatingInput"
                  label="Email address"
                >
                  <Form.Control
                    type="text"
                    placeholder="Enter email"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                </FloatingLabel>
              </Form.Group>
              <Form.Group className="login-field" controlId="formBasicPassword">
                <FloatingLabel controlId="floatingPassword" label="Password">
                  <Form.Control
                    type="password"
                    placeholder="Password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                </FloatingLabel>
              </Form.Group>

              <Button variant="success" type="submit" size="lg" className="login-submit-btn">
                Log in
              </Button>
              <button type="button" className="login-forgot-btn" onClick={() => setShowResetModal(true)}>
                Forgot Password?
              </button>

              <div className="login-divider">or</div>

              <Button
                variant="outline-success"
                type="button"
                size="lg"
                className="login-cas-btn"
                href={casLoginUrl}
              >
                Authenticate with Cirad account
              </Button>

              { adminEmail && (
                <div className="login-admin-contact">
                  Apply for an account at <a href={`mailto:${adminEmail}?subject=Gigwa account request`}>{adminEmail}</a>
                </div>
              )}

            </Form>
            <PasswordResetModal handleClose={setShowResetModal} show={showResetModal} forceStep2={forceStep2}/>
          </div>
        </> ) : (
        <div className="login-already-authenticated">Already logged in as {username}, redirecting to main page...</div>
      )}
    </div>
  );
}

export default Login;