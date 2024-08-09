package fr.cirad.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import javax.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public boolean sendResetPasswordEmail(String to, String resetCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String subject = "Password Reset Request - Gigwa2";
            String emailContent = "<h1>Password Reset Request</h1>"
                    + "<p>Hello,</p>"
                    + "<p>You have requested to reset your password for the <strong>Gigwa2</strong> application.</p>"
                    + "<p>Your password reset code is: <strong>" + resetCode + "</strong></p>"
                    + "<p>Please enter this code in the application to reset your password. This code will expire in 5 minutes.</p>";

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(emailContent, true);

            mailSender.send(message);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}