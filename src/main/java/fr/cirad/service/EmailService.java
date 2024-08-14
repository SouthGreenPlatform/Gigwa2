package fr.cirad.service;

import fr.cirad.tools.AppConfig;
import fr.cirad.web.controller.BackOfficeController;
import org.mortbay.log.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import javax.mail.internet.MimeMessage;
import javax.servlet.http.HttpServletRequest;

import static fr.cirad.mgdb.service.GigwaGa4ghServiceImpl.TMP_OUTPUT_FOLDER;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private AppConfig appConfig;

    public boolean sendResetPasswordEmail(String to, String resetCode, HttpServletRequest request) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();

            String sWebAppRoot = appConfig.get("enforcedWebapRootUrl");
            String enforcedWebapRootUrl = (sWebAppRoot == null
                    ? BackOfficeController.determinePublicHostName(request) + request.getContextPath()
                    : sWebAppRoot);

            if (enforcedWebapRootUrl == null || enforcedWebapRootUrl.trim().isEmpty()) {
                Log.warn("enforcedWebapRootUrl is not set in the application.properties file. Using the default value.");
            }

            String subject = "Password Reset Request";
            String emailContent = "Hello,\nYou have requested to reset your password for : " + enforcedWebapRootUrl + ".\nYour password reset code is: " + resetCode + "\nPlease enter this code in the application to reset your password. This code will expire in 5 minutes.\n";

            message.setTo(to);
            message.setSubject(subject);
            message.setText(emailContent);

            mailSender.send(message);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}