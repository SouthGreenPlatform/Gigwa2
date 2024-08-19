package fr.cirad.service;

import fr.cirad.security.ReloadableInMemoryDaoImpl;
import fr.cirad.security.UserWithMethod;
import fr.cirad.tools.AppConfig;
import fr.cirad.web.controller.BackOfficeController;

import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.time.LocalDateTime;

@Service
public class PasswordResetService {

	private static final Logger LOG = Logger.getLogger(PasswordResetService.class);
	
    private static final String RESET_CODE_KEY = "resetCode";
    private static final String RESET_EMAIL_KEY = "resetEmail";
    private static final String RESET_EXPIRATION_KEY = "resetExpiration";

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private AppConfig appConfig;

    @Autowired
    private ReloadableInMemoryDaoImpl userDao;

    public String generateResetCode() {
        return String.format("%08d", new java.util.Random().nextInt(100000000));
    }

    public boolean sendResetPasswordEmail(String email, HttpSession session, HttpServletRequest request) {
        UserWithMethod user = userDao.getUserWithMethodByEmailAddress(email);
        if (user == null) {
            return true; // We return true to not disclose if the email exists
        }

        String resetCode = generateResetCode();
        session.setAttribute(RESET_CODE_KEY, resetCode);
        session.setAttribute(RESET_EMAIL_KEY, email);
        session.setAttribute(RESET_EXPIRATION_KEY, LocalDateTime.now().plusMinutes(5));

        try {
            SimpleMailMessage message = new SimpleMailMessage();

            String sWebAppRoot = appConfig.get("enforcedWebapRootUrl");
            String enforcedWebapRootUrl = (sWebAppRoot == null ? BackOfficeController.determinePublicHostName(request) + request.getContextPath() : sWebAppRoot);
            if (enforcedWebapRootUrl == null || enforcedWebapRootUrl.trim().isEmpty())
            	LOG.warn("enforcedWebapRootUrl is not set in the application.properties file. Using the default value.");

            String subject = "Gigwa - Password reset request";
            String emailContent = "Hello,\n\nYou have requested to reset your password for the following Gigwa instance: " + enforcedWebapRootUrl + "\nYour password reset code is: " + resetCode + "\nPlease enter this code in the application to reset your password. This code will expire in 5 minutes.\n";

            message.setTo(email);
            message.setSubject(subject);
            message.setText(emailContent);

            mailSender.send(message);
            return true;
        } catch (Exception e) {
            LOG.error("Unable to send password reset email", e);
            return false;
        }
    }

    public boolean validateResetCode(String code, HttpSession session) {
        String storedCode = (String) session.getAttribute(RESET_CODE_KEY);
        LocalDateTime expiration = (LocalDateTime) session.getAttribute(RESET_EXPIRATION_KEY);

        if (storedCode == null || !storedCode.equals(code) || expiration == null) {
            return false;
        }

        return expiration.isAfter(LocalDateTime.now());
    }

    public boolean updatePassword(String code, String newPassword, HttpSession session) {
        if (!validateResetCode(code, session)) {
            return false;
        }

        String email = (String) session.getAttribute(RESET_EMAIL_KEY);
        UserWithMethod user = userDao.getUserWithMethodByEmailAddress(email);
        if (user == null) {
            return false;
        }

        try {
            userDao.saveOrUpdateUser(user.getUsername(), newPassword,
                    user.getAuthorities(),
                    user.isEnabled(), user.getMethod(), user.getEmail());
        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }

        // Clear the reset information from the session
        session.removeAttribute(RESET_CODE_KEY);
        session.removeAttribute(RESET_EMAIL_KEY);
        session.removeAttribute(RESET_EXPIRATION_KEY);

        return true;
    }
}