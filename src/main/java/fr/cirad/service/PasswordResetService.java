package fr.cirad.service;

import java.io.IOException;
import java.net.Socket;
import java.net.SocketException;
import java.net.UnknownHostException;
import java.time.LocalDateTime;

import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

import fr.cirad.security.ReloadableInMemoryDaoImpl;
import fr.cirad.security.UserWithMethod;
import fr.cirad.tools.AppConfig;
import fr.cirad.web.controller.BackOfficeController;
import fr.cirad.web.controller.GigwaAuthenticationController;

@Service
public class PasswordResetService {

	private static final Logger LOG = Logger.getLogger(PasswordResetService.class);
	
    public static final String RESET_CODE_KEY = "resetCode";
    public static final String RESET_EMAIL_KEY = "resetEmail";
    public static final String RESET_EXPIRATION_KEY = "resetExpiration";

    @Autowired(required=false)
    private JavaMailSenderImpl mailSender;

    @Autowired
    private AppConfig appConfig;

    @Autowired
    private ReloadableInMemoryDaoImpl userDao;
    
    public boolean seemsProperlyConfigured() {
        try (Socket socket = new Socket(mailSender.getHost(), mailSender.getPort())) {
            return true;
        } catch (Exception e) {
        	if (mailSender != null) {
        		LOG.error("JavaMailSenderImpl not properly configured", e);
        		mailSender = null;	// only log this error once
        	}
            return false;
        }
    }

    public String generateResetCode() {
        return String.format("%08d", new java.util.Random().nextInt(100000000));
    }

    public boolean sendResetPasswordEmail(String email, HttpSession session, HttpServletRequest request) throws MessagingException, SocketException, UnknownHostException {
        UserWithMethod user = userDao.getUserWithMethodByEmailAddress(email);
        if (user == null) {
            return true; // We return true to not disclose if the email exists
        }

        String resetCode = generateResetCode();
        String sWebAppRoot = request.getHeader("referer");
        if (sWebAppRoot != null)
            sWebAppRoot = sWebAppRoot.split("\\?")[0].replaceFirst(GigwaAuthenticationController.LOGIN_LOST_PASSWORD_URL, "");
        else {
			sWebAppRoot = appConfig.get("enforcedWebapRootUrl");
			if (sWebAppRoot == null) {
				String computedBaseURL = BackOfficeController.determinePublicHostName(request);
				if (computedBaseURL != null)
					sWebAppRoot = computedBaseURL + request.getContextPath();
			}
        }
		if (sWebAppRoot == null)
			LOG.warn("Unable to determine password reset link. None will be mentioned in the e-mail!");
		
        String subject = "Gigwa - Password reset request";
        String emailContent = "Hello,\n\nYou have requested to reset your password"
	         + (sWebAppRoot == null ? "" : " for the following Gigwa instance: " + sWebAppRoot + GigwaAuthenticationController.LOGIN_RESET_PASSWORD_URL)
	         + ".\nYour password reset code is: " + resetCode + "\nPlease enter this code in the application to reset your password. This code will expire in 5 minutes.\n";
        
		MimeMessage message = mailSender.createMimeMessage();
		MimeMultipart multipart = new MimeMultipart("alternative");
		MimeBodyPart messageTxtBody = new MimeBodyPart();
		
		messageTxtBody.setContent(emailContent, "text/plain; charset=" + mailSender.getDefaultEncoding());

		multipart.addBodyPart(messageTxtBody);
		
		message.setContent(multipart);
		message.setSentDate(new java.util.Date());
		String adminEmail = appConfig.get("adminEmail");    		
		message.addFrom(new InternetAddress[] {new InternetAddress(adminEmail != null ? adminEmail : getNoReplyAddress(mailSender))});

        message.setSubject(subject);
		message.addRecipient(Message.RecipientType.TO, new InternetAddress(email));
		message.saveChanges();

        mailSender.send(message);
        
        session.setAttribute(RESET_CODE_KEY, resetCode);
        session.setAttribute(RESET_EMAIL_KEY, email);
        session.setAttribute(RESET_EXPIRATION_KEY, LocalDateTime.now().plusMinutes(5));
        
        LOG.info("Sent password reset code to " + email);
        return true;
    }
    
    public static String getNoReplyAddress(JavaMailSenderImpl mailSender) throws IllegalArgumentException{
        String host = mailSender.getHost();

        // Try regex replacement for common prefixes
        String cleanedHost = host.replaceFirst("^(smtp|mail)\\.", "");

        // If regex didn't change the host, fall back to string manipulation
        if (cleanedHost.equals(host)) {
            int secondLastDotIndex = host.lastIndexOf('.', host.lastIndexOf('.') - 1);
            if (secondLastDotIndex != -1)
                cleanedHost = host.substring(secondLastDotIndex + 1);
        }

        // Construct the "noreply" email address
        String noReplyAddress = "noreply@" + cleanedHost;

        // Validate the email address
        if (!UserWithMethod.isEmailAddress(noReplyAddress))
            throw new IllegalArgumentException("Generated noreply address is not valid: " + noReplyAddress);

        return noReplyAddress;
    }

    public boolean validateResetCode(String code, HttpSession session) {
        LocalDateTime expiration = (LocalDateTime) session.getAttribute(RESET_EXPIRATION_KEY);

        String storedCode = (String) session.getAttribute(RESET_CODE_KEY);
        if (expiration == null || storedCode == null || expiration.isBefore(LocalDateTime.now())) { // Clear expired or invalid reset information
            session.removeAttribute(RESET_CODE_KEY);
            session.removeAttribute(RESET_EMAIL_KEY);
            session.removeAttribute(RESET_EXPIRATION_KEY);
            return false;
        }

        if (!storedCode.equals(code))
            return false;	// failed attempt

        return true;
    }

    public boolean updatePassword(String code, String newPassword, HttpSession session) {
        if (!validateResetCode(code, session))
            return false;

        String email = (String) session.getAttribute(RESET_EMAIL_KEY);
        UserWithMethod user = userDao.getUserWithMethodByEmailAddress(email);
        if (user == null)
            return false;

        try {
            userDao.saveOrUpdateUser(user.getUsername(), newPassword, user.getAuthorities(), user.isEnabled(), user.getMethod(), user.getEmail());
        }
        catch (IOException e) {
            LOG.error("Error while overriding user password", e);
            return false;
        }

        // Clear the reset information from the session
        session.removeAttribute(RESET_CODE_KEY);
        session.removeAttribute(RESET_EMAIL_KEY);
        session.removeAttribute(RESET_EXPIRATION_KEY);

        return true;
    }
}