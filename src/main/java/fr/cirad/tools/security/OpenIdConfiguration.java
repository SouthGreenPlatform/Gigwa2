package fr.cirad.tools.security;

import java.util.List;
import java.util.Map;

public class OpenIdConfiguration {

    private String issuer;
    private String authorization_endpoint;
    private String token_endpoint;
    private String introspection_endpoint;
    private String userinfo_endpoint;
    private String end_session_endpoint;
    private boolean frontchannel_logout_session_supported;
    private boolean frontchannel_logout_supported;
    private String jwks_uri;
    private String check_session_iframe;
    private List<String> grant_types_supported;
    private List<String> acr_values_supported;
    private List<String> response_types_supported;
    private List<String> subject_types_supported;
    private List<String> id_token_signing_alg_values_supported;
    private List<String> id_token_encryption_alg_values_supported;
    private List<String> id_token_encryption_enc_values_supported;
    private List<String> userinfo_signing_alg_values_supported;
    private List<String> userinfo_encryption_alg_values_supported;
    private List<String> userinfo_encryption_enc_values_supported;
    private List<String> request_object_signing_alg_values_supported;
    private List<String> request_object_encryption_alg_values_supported;
    private List<String> request_object_encryption_enc_values_supported;
    private List<String> response_modes_supported;
    private String registration_endpoint;
    private List<String> token_endpoint_auth_methods_supported;
    private List<String> token_endpoint_auth_signing_alg_values_supported;
    private List<String> introspection_endpoint_auth_methods_supported;
    private List<String> introspection_endpoint_auth_signing_alg_values_supported;
    private List<String> authorization_signing_alg_values_supported;
    private List<String> authorization_encryption_alg_values_supported;
    private List<String> authorization_encryption_enc_values_supported;
    private List<String> claims_supported;
    private List<String> claim_types_supported;
    private boolean claims_parameter_supported;
    private List<String> scopes_supported;
    private boolean request_parameter_supported;
    private boolean request_uri_parameter_supported;
    private boolean require_request_uri_registration;
    private List<String> code_challenge_methods_supported;
    private boolean tls_client_certificate_bound_access_tokens;
    private String revocation_endpoint;
    private List<String> revocation_endpoint_auth_methods_supported;
    private List<String> revocation_endpoint_auth_signing_alg_values_supported;
    private boolean backchannel_logout_supported;
    private boolean backchannel_logout_session_supported;
    private String device_authorization_endpoint;
    private List<String> backchannel_token_delivery_modes_supported;
    private String backchannel_authentication_endpoint;
    private List<String> backchannel_authentication_request_signing_alg_values_supported;
    private boolean require_pushed_authorization_requests;
    private String pushed_authorization_request_endpoint;
    private Map<String, String> mtls_endpoint_aliases;
    private boolean authorization_response_iss_parameter_supported;
    
	public String getIssuer() {
		return issuer;
	}
	public void setIssuer(String issuer) {
		this.issuer = issuer;
	}
	public String getAuthorization_endpoint() {
		return authorization_endpoint;
	}
	public void setAuthorization_endpoint(String authorization_endpoint) {
		this.authorization_endpoint = authorization_endpoint;
	}
	public String getToken_endpoint() {
		return token_endpoint;
	}
	public void setToken_endpoint(String token_endpoint) {
		this.token_endpoint = token_endpoint;
	}
	public String getIntrospection_endpoint() {
		return introspection_endpoint;
	}
	public void setIntrospection_endpoint(String introspection_endpoint) {
		this.introspection_endpoint = introspection_endpoint;
	}
	public String getUserinfo_endpoint() {
		return userinfo_endpoint;
	}
	public void setUserinfo_endpoint(String userinfo_endpoint) {
		this.userinfo_endpoint = userinfo_endpoint;
	}
	public String getEnd_session_endpoint() {
		return end_session_endpoint;
	}
	public void setEnd_session_endpoint(String end_session_endpoint) {
		this.end_session_endpoint = end_session_endpoint;
	}
	public boolean isFrontchannel_logout_session_supported() {
		return frontchannel_logout_session_supported;
	}
	public void setFrontchannel_logout_session_supported(boolean frontchannel_logout_session_supported) {
		this.frontchannel_logout_session_supported = frontchannel_logout_session_supported;
	}
	public boolean isFrontchannel_logout_supported() {
		return frontchannel_logout_supported;
	}
	public void setFrontchannel_logout_supported(boolean frontchannel_logout_supported) {
		this.frontchannel_logout_supported = frontchannel_logout_supported;
	}
	public String getJwks_uri() {
		return jwks_uri;
	}
	public void setJwks_uri(String jwks_uri) {
		this.jwks_uri = jwks_uri;
	}
	public String getCheck_session_iframe() {
		return check_session_iframe;
	}
	public void setCheck_session_iframe(String check_session_iframe) {
		this.check_session_iframe = check_session_iframe;
	}
	public List<String> getGrant_types_supported() {
		return grant_types_supported;
	}
	public void setGrant_types_supported(List<String> grant_types_supported) {
		this.grant_types_supported = grant_types_supported;
	}
	public List<String> getAcr_values_supported() {
		return acr_values_supported;
	}
	public void setAcr_values_supported(List<String> acr_values_supported) {
		this.acr_values_supported = acr_values_supported;
	}
	public List<String> getResponse_types_supported() {
		return response_types_supported;
	}
	public void setResponse_types_supported(List<String> response_types_supported) {
		this.response_types_supported = response_types_supported;
	}
	public List<String> getSubject_types_supported() {
		return subject_types_supported;
	}
	public void setSubject_types_supported(List<String> subject_types_supported) {
		this.subject_types_supported = subject_types_supported;
	}
	public List<String> getId_token_signing_alg_values_supported() {
		return id_token_signing_alg_values_supported;
	}
	public void setId_token_signing_alg_values_supported(List<String> id_token_signing_alg_values_supported) {
		this.id_token_signing_alg_values_supported = id_token_signing_alg_values_supported;
	}
	public List<String> getId_token_encryption_alg_values_supported() {
		return id_token_encryption_alg_values_supported;
	}
	public void setId_token_encryption_alg_values_supported(List<String> id_token_encryption_alg_values_supported) {
		this.id_token_encryption_alg_values_supported = id_token_encryption_alg_values_supported;
	}
	public List<String> getId_token_encryption_enc_values_supported() {
		return id_token_encryption_enc_values_supported;
	}
	public void setId_token_encryption_enc_values_supported(List<String> id_token_encryption_enc_values_supported) {
		this.id_token_encryption_enc_values_supported = id_token_encryption_enc_values_supported;
	}
	public List<String> getUserinfo_signing_alg_values_supported() {
		return userinfo_signing_alg_values_supported;
	}
	public void setUserinfo_signing_alg_values_supported(List<String> userinfo_signing_alg_values_supported) {
		this.userinfo_signing_alg_values_supported = userinfo_signing_alg_values_supported;
	}
	public List<String> getUserinfo_encryption_alg_values_supported() {
		return userinfo_encryption_alg_values_supported;
	}
	public void setUserinfo_encryption_alg_values_supported(List<String> userinfo_encryption_alg_values_supported) {
		this.userinfo_encryption_alg_values_supported = userinfo_encryption_alg_values_supported;
	}
	public List<String> getUserinfo_encryption_enc_values_supported() {
		return userinfo_encryption_enc_values_supported;
	}
	public void setUserinfo_encryption_enc_values_supported(List<String> userinfo_encryption_enc_values_supported) {
		this.userinfo_encryption_enc_values_supported = userinfo_encryption_enc_values_supported;
	}
	public List<String> getRequest_object_signing_alg_values_supported() {
		return request_object_signing_alg_values_supported;
	}
	public void setRequest_object_signing_alg_values_supported(List<String> request_object_signing_alg_values_supported) {
		this.request_object_signing_alg_values_supported = request_object_signing_alg_values_supported;
	}
	public List<String> getRequest_object_encryption_alg_values_supported() {
		return request_object_encryption_alg_values_supported;
	}
	public void setRequest_object_encryption_alg_values_supported(
			List<String> request_object_encryption_alg_values_supported) {
		this.request_object_encryption_alg_values_supported = request_object_encryption_alg_values_supported;
	}
	public List<String> getRequest_object_encryption_enc_values_supported() {
		return request_object_encryption_enc_values_supported;
	}
	public void setRequest_object_encryption_enc_values_supported(
			List<String> request_object_encryption_enc_values_supported) {
		this.request_object_encryption_enc_values_supported = request_object_encryption_enc_values_supported;
	}
	public List<String> getResponse_modes_supported() {
		return response_modes_supported;
	}
	public void setResponse_modes_supported(List<String> response_modes_supported) {
		this.response_modes_supported = response_modes_supported;
	}
	public String getRegistration_endpoint() {
		return registration_endpoint;
	}
	public void setRegistration_endpoint(String registration_endpoint) {
		this.registration_endpoint = registration_endpoint;
	}
	public List<String> getToken_endpoint_auth_methods_supported() {
		return token_endpoint_auth_methods_supported;
	}
	public void setToken_endpoint_auth_methods_supported(List<String> token_endpoint_auth_methods_supported) {
		this.token_endpoint_auth_methods_supported = token_endpoint_auth_methods_supported;
	}
	public List<String> getToken_endpoint_auth_signing_alg_values_supported() {
		return token_endpoint_auth_signing_alg_values_supported;
	}
	public void setToken_endpoint_auth_signing_alg_values_supported(
			List<String> token_endpoint_auth_signing_alg_values_supported) {
		this.token_endpoint_auth_signing_alg_values_supported = token_endpoint_auth_signing_alg_values_supported;
	}
	public List<String> getIntrospection_endpoint_auth_methods_supported() {
		return introspection_endpoint_auth_methods_supported;
	}
	public void setIntrospection_endpoint_auth_methods_supported(
			List<String> introspection_endpoint_auth_methods_supported) {
		this.introspection_endpoint_auth_methods_supported = introspection_endpoint_auth_methods_supported;
	}
	public List<String> getIntrospection_endpoint_auth_signing_alg_values_supported() {
		return introspection_endpoint_auth_signing_alg_values_supported;
	}
	public void setIntrospection_endpoint_auth_signing_alg_values_supported(
			List<String> introspection_endpoint_auth_signing_alg_values_supported) {
		this.introspection_endpoint_auth_signing_alg_values_supported = introspection_endpoint_auth_signing_alg_values_supported;
	}
	public List<String> getAuthorization_signing_alg_values_supported() {
		return authorization_signing_alg_values_supported;
	}
	public void setAuthorization_signing_alg_values_supported(List<String> authorization_signing_alg_values_supported) {
		this.authorization_signing_alg_values_supported = authorization_signing_alg_values_supported;
	}
	public List<String> getAuthorization_encryption_alg_values_supported() {
		return authorization_encryption_alg_values_supported;
	}
	public void setAuthorization_encryption_alg_values_supported(
			List<String> authorization_encryption_alg_values_supported) {
		this.authorization_encryption_alg_values_supported = authorization_encryption_alg_values_supported;
	}
	public List<String> getAuthorization_encryption_enc_values_supported() {
		return authorization_encryption_enc_values_supported;
	}
	public void setAuthorization_encryption_enc_values_supported(
			List<String> authorization_encryption_enc_values_supported) {
		this.authorization_encryption_enc_values_supported = authorization_encryption_enc_values_supported;
	}
	public List<String> getClaims_supported() {
		return claims_supported;
	}
	public void setClaims_supported(List<String> claims_supported) {
		this.claims_supported = claims_supported;
	}
	public List<String> getClaim_types_supported() {
		return claim_types_supported;
	}
	public void setClaim_types_supported(List<String> claim_types_supported) {
		this.claim_types_supported = claim_types_supported;
	}
	public boolean isClaims_parameter_supported() {
		return claims_parameter_supported;
	}
	public void setClaims_parameter_supported(boolean claims_parameter_supported) {
		this.claims_parameter_supported = claims_parameter_supported;
	}
	public List<String> getScopes_supported() {
		return scopes_supported;
	}
	public void setScopes_supported(List<String> scopes_supported) {
		this.scopes_supported = scopes_supported;
	}
	public boolean isRequest_parameter_supported() {
		return request_parameter_supported;
	}
	public void setRequest_parameter_supported(boolean request_parameter_supported) {
		this.request_parameter_supported = request_parameter_supported;
	}
	public boolean isRequest_uri_parameter_supported() {
		return request_uri_parameter_supported;
	}
	public void setRequest_uri_parameter_supported(boolean request_uri_parameter_supported) {
		this.request_uri_parameter_supported = request_uri_parameter_supported;
	}
	public boolean isRequire_request_uri_registration() {
		return require_request_uri_registration;
	}
	public void setRequire_request_uri_registration(boolean require_request_uri_registration) {
		this.require_request_uri_registration = require_request_uri_registration;
	}
	public List<String> getCode_challenge_methods_supported() {
		return code_challenge_methods_supported;
	}
	public void setCode_challenge_methods_supported(List<String> code_challenge_methods_supported) {
		this.code_challenge_methods_supported = code_challenge_methods_supported;
	}
	public boolean isTls_client_certificate_bound_access_tokens() {
		return tls_client_certificate_bound_access_tokens;
	}
	public void setTls_client_certificate_bound_access_tokens(boolean tls_client_certificate_bound_access_tokens) {
		this.tls_client_certificate_bound_access_tokens = tls_client_certificate_bound_access_tokens;
	}
	public String getRevocation_endpoint() {
		return revocation_endpoint;
	}
	public void setRevocation_endpoint(String revocation_endpoint) {
		this.revocation_endpoint = revocation_endpoint;
	}
	public List<String> getRevocation_endpoint_auth_methods_supported() {
		return revocation_endpoint_auth_methods_supported;
	}
	public void setRevocation_endpoint_auth_methods_supported(List<String> revocation_endpoint_auth_methods_supported) {
		this.revocation_endpoint_auth_methods_supported = revocation_endpoint_auth_methods_supported;
	}
	public List<String> getRevocation_endpoint_auth_signing_alg_values_supported() {
		return revocation_endpoint_auth_signing_alg_values_supported;
	}
	public void setRevocation_endpoint_auth_signing_alg_values_supported(
			List<String> revocation_endpoint_auth_signing_alg_values_supported) {
		this.revocation_endpoint_auth_signing_alg_values_supported = revocation_endpoint_auth_signing_alg_values_supported;
	}
	public boolean isBackchannel_logout_supported() {
		return backchannel_logout_supported;
	}
	public void setBackchannel_logout_supported(boolean backchannel_logout_supported) {
		this.backchannel_logout_supported = backchannel_logout_supported;
	}
	public boolean isBackchannel_logout_session_supported() {
		return backchannel_logout_session_supported;
	}
	public void setBackchannel_logout_session_supported(boolean backchannel_logout_session_supported) {
		this.backchannel_logout_session_supported = backchannel_logout_session_supported;
	}
	public String getDevice_authorization_endpoint() {
		return device_authorization_endpoint;
	}
	public void setDevice_authorization_endpoint(String device_authorization_endpoint) {
		this.device_authorization_endpoint = device_authorization_endpoint;
	}
	public List<String> getBackchannel_token_delivery_modes_supported() {
		return backchannel_token_delivery_modes_supported;
	}
	public void setBackchannel_token_delivery_modes_supported(List<String> backchannel_token_delivery_modes_supported) {
		this.backchannel_token_delivery_modes_supported = backchannel_token_delivery_modes_supported;
	}
	public String getBackchannel_authentication_endpoint() {
		return backchannel_authentication_endpoint;
	}
	public void setBackchannel_authentication_endpoint(String backchannel_authentication_endpoint) {
		this.backchannel_authentication_endpoint = backchannel_authentication_endpoint;
	}
	public List<String> getBackchannel_authentication_request_signing_alg_values_supported() {
		return backchannel_authentication_request_signing_alg_values_supported;
	}
	public void setBackchannel_authentication_request_signing_alg_values_supported(
			List<String> backchannel_authentication_request_signing_alg_values_supported) {
		this.backchannel_authentication_request_signing_alg_values_supported = backchannel_authentication_request_signing_alg_values_supported;
	}
	public boolean isRequire_pushed_authorization_requests() {
		return require_pushed_authorization_requests;
	}
	public void setRequire_pushed_authorization_requests(boolean require_pushed_authorization_requests) {
		this.require_pushed_authorization_requests = require_pushed_authorization_requests;
	}
	public String getPushed_authorization_request_endpoint() {
		return pushed_authorization_request_endpoint;
	}
	public void setPushed_authorization_request_endpoint(String pushed_authorization_request_endpoint) {
		this.pushed_authorization_request_endpoint = pushed_authorization_request_endpoint;
	}
	public Map<String, String> getMtls_endpoint_aliases() {
		return mtls_endpoint_aliases;
	}
	public void setMtls_endpoint_aliases(Map<String, String> mtls_endpoint_aliases) {
		this.mtls_endpoint_aliases = mtls_endpoint_aliases;
	}
	public boolean isAuthorization_response_iss_parameter_supported() {
		return authorization_response_iss_parameter_supported;
	}
	public void setAuthorization_response_iss_parameter_supported(boolean authorization_response_iss_parameter_supported) {
		this.authorization_response_iss_parameter_supported = authorization_response_iss_parameter_supported;
	}
}
