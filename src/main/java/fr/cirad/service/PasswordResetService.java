package fr.cirad.service;

import fr.cirad.security.ReloadableInMemoryDaoImpl;
import fr.cirad.security.UserWithMethod;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.Timer;
import java.util.TimerTask;

@Service
public class PasswordResetService {

    private Map<String, String> resetCodes = new HashMap<>();
    private Map<String, LocalDateTime> codeExpirations = new HashMap<>();

    @Autowired
    private EmailService emailService;

    @Autowired
    private ReloadableInMemoryDaoImpl userDao;

    public String generateResetCode() {
        return String.format("%08d", new Random().nextInt(100000000));
    }

    public boolean sendResetPasswordEmail(String email) {
        UserWithMethod user = userDao.getUserWithMethodByEmailAddress(email);
        if (user == null) {
            return true; // We return true to not disclose if the email exists
        }

        String resetCode = generateResetCode();
        resetCodes.put(resetCode, email);
        codeExpirations.put(resetCode, LocalDateTime.now().plusMinutes(5)); // Code valid for 5 minutes

        scheduleCodeRemoval(resetCode);

        return emailService.sendResetPasswordEmail(email, resetCode);
    }

    private void scheduleCodeRemoval(String code) {
        new Timer().schedule(new TimerTask() {
            @Override
            public void run() {
                resetCodes.remove(code);
                codeExpirations.remove(code);
            }
        }, 5 * 60 * 1000); // 5 minutes in milliseconds
    }

    public boolean validateResetCode(String code) {
        if (!resetCodes.containsKey(code)) {
            return false;
        }
        LocalDateTime expiration = codeExpirations.get(code);
        return expiration.isAfter(LocalDateTime.now());
    }

    public boolean updatePassword(String code, String newPassword) {
        if (!validateResetCode(code)) {
            return false;
        }

        String email = resetCodes.get(code);
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

        resetCodes.remove(code);
        codeExpirations.remove(code);
        return true;
    }
}