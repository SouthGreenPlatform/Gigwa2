package fr.cirad.service;

import java.io.IOException;
import java.net.Socket;
import java.net.SocketException;
import java.net.UnknownHostException;

import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;
import javax.servlet.http.HttpServletRequest;

import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

import fr.cirad.security.ReloadableInMemoryDaoImpl;
import fr.cirad.security.UserWithMethod;
import fr.cirad.tools.AppConfig;
import fr.cirad.tools.ExpiringHashMap;
import fr.cirad.web.controller.BackOfficeController;
import fr.cirad.web.controller.GigwaAuthenticationController;

@Service
public class PasswordResetService {

	private static final Logger LOG = Logger.getLogger(PasswordResetService.class);

    private static final ExpiringHashMap<String, String> resetInfo = new ExpiringHashMap<>(1000 * 60 * 5 /* expiration delay: 5 minutes */);

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

    public boolean sendResetPasswordEmail(String email, HttpServletRequest request) throws MessagingException, SocketException, UnknownHostException {
        UserWithMethod user = userDao.getUserWithMethodByEmailAddress(email);
        if (user == null /* don't disclose if the email exists */|| !user.getMethod().isEmpty() /* only local accounts are concerned */)
            return true;

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

        String subject = "Gigwa - Password Reset Request";
        String emailContentText = "Hello,\n\nYou have requested to reset your password"
             + (sWebAppRoot == null ? "" : " for the following Gigwa instance: " + sWebAppRoot + GigwaAuthenticationController.LOGIN_RESET_PASSWORD_URL)
             + ".\nYour password reset code is: " + resetCode + "\nPlease enter this code in the application to reset your password, it will expire in 5 minutes.\n";

        String emailContentHtml = "<html><body>"
             + "<p>Hello,</p>"
             + "<p>You have requested to reset your password"
             + (sWebAppRoot == null ? "" : " for the following Gigwa instance: <a href=\"" + sWebAppRoot + GigwaAuthenticationController.LOGIN_RESET_PASSWORD_URL + "\">" + sWebAppRoot + GigwaAuthenticationController.LOGIN_RESET_PASSWORD_URL + "</a>")
             + ".</p>"
             + "<p>Your password reset code is: <strong>" + resetCode + "</strong></p>"
             + "<p>Please enter this code in the application to reset your password, it will expire in 5 minutes.</p>"
             + "</body></html>";

        MimeMessage message = mailSender.createMimeMessage();
        MimeMultipart multipart = new MimeMultipart("alternative");

        MimeBodyPart messageTxtBody = new MimeBodyPart();
        messageTxtBody.setContent(emailContentText, "text/plain; charset=" + mailSender.getDefaultEncoding());
        multipart.addBodyPart(messageTxtBody);

        MimeBodyPart messageHtmlBody = new MimeBodyPart();
        messageHtmlBody.setContent(emailContentHtml, "text/html; charset=" + mailSender.getDefaultEncoding());
        multipart.addBodyPart(messageHtmlBody);

        message.setContent(multipart);
        message.setSentDate(new java.util.Date());
        String adminEmail = appConfig.get("adminEmail");
        message.addFrom(new InternetAddress[] {new InternetAddress(adminEmail != null ? adminEmail : getNoReplyAddress(mailSender))});

        message.setSubject(subject);
        message.addRecipient(Message.RecipientType.TO, new InternetAddress(email));
        message.saveChanges();

        mailSender.send(message);

        resetInfo.put(resetCode, email);

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

    public boolean updatePassword(String code, String newPassword) {
    	String emailAssociatedToCode = resetInfo.get(code);
        if (emailAssociatedToCode == null) {
        	LOG.debug("Password reset code validation failed for code '" + code/* + "' and newPassword '" + newPassword + "'"*/);
            return false;
        }

        UserWithMethod user = userDao.getUserWithMethodByEmailAddress(emailAssociatedToCode);
        if (user == null) {
        	LOG.warn("Unable to find user by email address '" + emailAssociatedToCode + "' for resetting password");
            return false;
        }

        try {
            userDao.saveOrUpdateUser(user.getUsername(), newPassword, user.getAuthorities(), user.isEnabled(), user.getMethod(), user.getEmail());
        }
        catch (IOException e) {
            LOG.error("Error while overriding user password", e);
            return false;
        }

        // Clear the reset information
        resetInfo.remove(code);

        return true;
    }
}