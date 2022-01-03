package fr.cirad.security;

import org.springframework.dao.UncategorizedDataAccessException;

@SuppressWarnings("serial")
public class ExternalUserCreationFailureException extends UncategorizedDataAccessException {
	public ExternalUserCreationFailureException(String message, Throwable cause) {
		super(message, cause);
	}
}
